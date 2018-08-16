'use strict';

const tmi = require('tmi.js');

const util = require('util');
const request = require('request-promise');

/**
 * @class TwitchChatEmitter
 * The Twitch chat implementation, based on the already existing module tmi.js (tmijs.org), adding more features and handlers to chat interation.
 *
 * @param {object}   config The config object
 * @param {boolean}  config.debug Debug mode. If true, will show the debug messages.
 * @param {object}   config.logger The logger instance. If empty, the default logger will be used.
 * @param {string[]} config.channels The twitch channels that will be used. This is required.
 * @param {string}   config.username The chat bot username. This is required.
 * @param {string}   config.password The chat bot OAUTH token password. You can get it at http://twitchapps.com/tmi/ . This is required.
 * @param {boolean}  config.reconnect Reconnect to Twitch when disconnected from server. Default: false
 * @param {number}   config.maxReconnectAttempts Max number of reconnection attempts (Default: Infinity)
 * @param {number}   config.maxReconnectInterval Max number of ms to delay a reconnection (Default: 30000)
 * @param {number}   config.reconnectDecay The rate of increase of the reconnect delay (Default: 1.5)
 * @param {number}   config.reconnectInterval Number of ms before attempting to reconnect (Default: 1000)
 * @param {boolean}  config.secure Use secure connection (SSL / HTTPS) (Overrides port to 443)
 * @param {number}   config.timeout Number of ms to disconnect if no responses from server (Default: 9999)
 * @param {string}   config.commandPrefix The prefix caracter for chat command. Default is "!".
 *
 * @param {object[]} config.triggers The triggers object array.
 * @param {string}   config.triggers[].name The name of the trigger. This is required.
 * @param {string}   config.triggers[].type The type of the trigger. Can be one 'word' or 'command'. This is required
 * @param {string}   config.channel The channel in which the trigger will be used. This is required.
 * @param {boolean}  config.triggers[].chatTrigger Define if its a chat trigger. (Default: true)
 * @param {boolean}  config.triggers[].whisperTrigger Define if its a whisper trigger. (Default: false)
 * @param {number}   config.triggers[].minDelay The delay before the action is triggered again. (Default: 0)
 * @param {string}   config.triggers[].eventName The name of the event that will be triggered. If this is empty, no event will be emitted.
 * @param {string}   config.triggers[].responseText The text that will be sent to chat/whisper if the action is triggered. If this is empty, nothing will be sent.
 *
 * @param {object[]} config.timedMessages The timed messages array.
 * @param {string}   config.timedMessages[].message The message to be sent.
 * @param {string}   config.channel The channel in which the timed message will be sent. This is required.
 * @param {number}   config.timedMessages[].minDelay The minimum delay, in seconds, between this kind of message. This is required.
 * @param {number}   config.timedMessages[].minChatMessages The minimum ammount of messages in chat to send this message.
 *
 */
function TwitchChatEmitter(config) {
    if (!config.channels) throw new Error('Missing channels value.');
    if (!config.username) throw new Error('Missing username value.');
    if (!config.password) throw new Error('Missing password value.');
    let options = {
        options: {
            debug:
                config.debug ||
                (process.env.LOG_LEVEL && process.env.LOG_LEVEL === 'debug'),
            ignoreSelf: config.ignoreSelf
        },
        connection: {
            reconnect: config.reconnect,
            maxReconnectAttempts: config.maxReconnectAttempts,
            maxReconnectInterval: config.maxReconnectInterval,
            reconnectDecay: config.reconnectDecay,
            reconnectInterval: config.reconnectInterval,
            secure: config.secure,
            timeout: config.timeout
        },
        identity: {
            username: config.username,
            password: config.password
        },
        channels: config.channels,
        logger: config.logger,
        commandPrefix: config.commandPrefix || '!',
        timedMessages: config.timedMessages
    };

    //Create the local variables
    this.chatMessageCount = 0;
    this.triggersMap = new Map();

    //Create the triggers maps
    if (config.triggers) {
        for (let i in config.triggers) {
            let trigger = config.triggers[i];

            let name =
                trigger.type === 'command'
                    ? options.commandPrefix + trigger.name
                    : trigger.name;

            let triggerObj = {};
            if (this.triggersMap.has(name)) {
                triggerObj = this.triggersMap.get(name);
            } else {
                triggerObj.items = [];
                triggerObj.lastDate = null;
            }

            triggerObj.items.push(trigger);
            this.triggersMap.set(name, triggerObj);
        }
    }

    tmi.Client.call(this, options);

    if (config.logger) {
        this.log = config.logger;
    }
    this.on('chat', (channel, userstate, message, self) => {
        _handleMessage(this, 'chat', channel, userstate, message, self);
    });
    this.on('whisper', (from, userstate, message, self) => {
        _handleMessage(this, 'whisper', null, userstate, message, self);
    });
    this.chatEmotes = null;
}

/**
 * Connect to the chat.
 */
TwitchChatEmitter.prototype.connect = async function() {
    try {
        let emotes = await request({
            url: 'https://twitchemotes.com/api_cache/v3/global.json',
            method: 'GET'
        });
        this.chatEmotes = JSON.parse(emotes);

        let result = await tmi.Client.prototype.connect.call(this);

        //Prepare the timed messages
        if (this.getOptions().timedMessages) {
            this.getOptions().timedMessagesTimerIds = [];
            for (let i in this.getOptions().timedMessages) {
                let message = this.getOptions().timedMessages[i];
                if (!message.minDelay) {
                    throw new Error(
                        'Missing minimum delay constraint for timed message.'
                    );
                }
                if (!message.channel) {
                    throw new Error(
                        'Missing the channel for the timed message.'
                    );
                }
                let timedMessage = {
                    message: message.message,
                    channel: message.channel,
                    minDelay: message.minDelay,
                    minChatMessages: message.minChatMessages,
                    messageCount: 0, //Number of messages sent before the last time it was sent.
                    lastTrigger: null
                };

                if (message.minDelay) {
                    let timerId = setInterval(() => {
                        _triggerTimedMessage(this, timedMessage);
                    }, message.minDelay * 1000);
                    this.getOptions().timedMessagesTimerIds.push(timerId);
                }
            }
        }

        return result;
    } catch (err) {
        throw err;
    }
};

TwitchChatEmitter.prototype.disconnect = async function() {
    if (this.getOptions().timedMessagesTimerIds) {
        for (let i in this.getOptions().timedMessagesTimerIds) {
            clearInterval(this.getOptions().timedMessagesTimerIds[i]);
        }
    }
    return tmi.Client.prototype.disconnect.call(this);
};

/**
 * Handle a chat message, firing the specific events.
 * @private
 * @param {string} channel The channel in which the message was sent.
 * @param {object} userstate The userstate object as described in the tmi 'chat 'event.
 * @param {string} message The chat message.
 * @param {bool} self Whether is the bot user or not.
 */
async function _handleMessage(chat, type, channel, userstate, message, self) {
    message = message.trim();
    let finalMessage = message;
    try {
        if (!self || process.env.NODE_ENV === 'test') {
            let words = _getMessageWords(
                message,
                chat.getOptions().commandPrefix
            );
            for (let i in words) {
                if (chat.triggersMap.has(words[i])) {
                    let triggers = chat.triggersMap.get(words[i]);
                    for (let j in triggers.items) {
                        let trigger = triggers.items[j];
                        if (
                            !trigger.minDelay ||
                            !triggers.lastDate ||
                            new Date().getTime() - trigger.minDelay >
                                triggers.lastDate.getTime()
                        ) {
                            if (trigger.eventName) {
                                chat.emit(
                                    trigger.eventName,
                                    channel,
                                    userstate,
                                    message,
                                    self
                                );
                            }
                            if (trigger.responseText) {
                                if (type === 'chat') {
                                    await chat.say(
                                        channel,
                                        trigger.responseText
                                    );
                                } else if (type === 'whisper') {
                                    await chat.whisper(
                                        userstate.username,
                                        trigger.responseText
                                    );
                                }
                            }
                        }
                    }
                    triggers.lastDate = new Date();
                }
                if (chat.chatEmotes[words[i]]) {
                    let emoteHtml =
                        '<img class="chat-image"  src="' +
                        encodeURI(
                            'https://static-cdn.jtvnw.net/emoticons/v1/' +
                                chat.chatEmotes[words[i]].id +
                                '/1.0'
                        ) +
                        '">';
                    finalMessage = finalMessage.replace(words[i], emoteHtml);
                }
            }
        }

        /**
         * The chat message parsed to html, with twitch emotes.
         * @event TwitchChatEmitter#Chat:chat_parsed
         * @param {string} channel The channel in which the command was sent.
         * @param {object} userstate The userstate object.
         * @param {string} message The parsed message.
         * @param {bool} self Whether the command was sent to the user bot or not.
         */
        if (type === 'chat') {
            chat.messageCount++;
            chat.emit('chat_parsed', channel, userstate, finalMessage, self);
        }
    } catch (err) {
        chat.log.error(err);
    }
}

function _getMessageWords(message, commandPrefix) {
    let reg = new RegExp(
        '[.,!?@#$%¨&*(){}\\[\\]|\\/:;<>]'.replace(commandPrefix, ''),
        'g'
    );
    return message.replace(reg, '').split(' ');
}

function _triggerTimedMessage(chat, timedMessage) {
    if (
        !timedMessage.minChatMessages ||
        chat.chatMessageCount >=
            timedMessage.minChatMessages * (timedMessage.messageCount + 1)
    ) {
        timedMessage.messageCount++;
        timedMessage.lastTrigger = new Date();
        chat.say(timedMessage.channel, timedMessage.message);
    }
}

util.inherits(TwitchChatEmitter, tmi.Client);

/* test code */
if (process.env.NODE_ENV === 'test') {
    TwitchChatEmitter.prototype._handleMessage = _handleMessage;
    TwitchChatEmitter.prototype._getMessageWords = _getMessageWords;
    TwitchChatEmitter.prototype._triggerTimedMessage = _triggerTimedMessage;
}
/* end-test code */

module.exports = TwitchChatEmitter;
