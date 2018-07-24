'use strict';

const tmi = require('tmi.js');

const util = require('util');
const helpers = require('./helpers');
const request = require('request-promise');

/**
 * @class TwitchChatEmitter
 * The Twitch chat implementation, based on the already existing module tmi.js (tmijs.org), adding more features and handlers to chat interation.
 *
 * @param {object}   config The config object
 * @param {object}   config.logger The logger instance. If empty, the default logger will be used.
 * @param {string[]} config.channels The twitch channels that will be used. This is required for chat and websub.
 * @param {string}   config.username The chat bot username. This is required.
 * @param {string}   config.password The chat bot OAUTH token password. You can get it at http://twitchapps.com/tmi/ . This is required.
 * @param {boolean}  config.reconnect Reconnect to Twitch when disconnected from server. Default: false
 * @param {number}   config.maxReconnectAttempts Max number of reconnection attempts (Default: Infinity)
 * @param {number}   config.maxReconnectInterval Max number of ms to delay a reconnection (Default: 30000)
 * @param {number}   config.reconnectDecay The rate of increase of the reconnect delay (Default: 1.5)
 * @param {number}   config.reconnectInterval Number of ms before attempting to reconnect (Default: 1000)
 * @param {boolean}  config.secure Use secure connection (SSL / HTTPS) (Overrides port to 443)
 * @param {number}   config.timeout Number of ms to disconnect if no responses from server (Default: 9999)
 * @param {object[]} config.triggers The triggers object array.
 * @param {string}   config.triggers[].name The name of the trigger. This is required.
 * @param {string}   config.triggers[].type The type of the trigger. Can be one 'word' or 'command'. This is required
 * @param {boolean}  config.triggers[].chatTrigger Define if its a chat trigger. (Default: true)
 * @param {boolean}  config.triggers[].whisperTrigger Define if its a whisper trigger. (Default: false)
 * @param {number}   config.triggers[].minDelay The delay before the action is triggered again. (Default: 0)
 * @param {string}   config.triggers[].eventName The name of the event that will be triggered. If this is empty, no event will be emitted.
 * @param {string}   config.triggers[].responseText The text that will be sent to chat/whisper if the action is triggered. If this is empty, nothing will be sent.
 * @param {string}   config.commandPrefix The prefix caracter for chat command. Default is "!"
 */
function TwitchChatEmitter(config) {
    //TODO Validate required
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
        commandPrefix: config.commandPrefix || '!'
    };

    //Create the triggers maps
    this.triggersMap = new Map();
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
        return tmi.Client.prototype.connect.call(this);
    } catch (err) {
        throw err;
    }
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

util.inherits(TwitchChatEmitter, tmi.Client);

/* test code */
if (process.env.NODE_ENV === 'test') {
    TwitchChatEmitter.prototype._handleMessage = _handleMessage;
    TwitchChatEmitter.prototype._getMessageWords = _getMessageWords;
}
/* end-test code */

module.exports = TwitchChatEmitter;
