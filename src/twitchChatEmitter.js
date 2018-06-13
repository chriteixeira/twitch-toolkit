'use strict';

const tmi = require('tmi.js');

const util = require('util');
const helpers = require('./helpers');
const request = require('request-promise');

/**
 * @class TwitchChatEmitter
 * The Twitch chat implementation, based on the already existing module tmi.js (tmijs.org), adding more features and handlers to chat interation.
 *
 * @param {object} options
 * @param {object} logger The logger object.
 */
function TwitchChatEmitter(options, logger) {
    options.wordTriggers = options.wordTriggers || {};
    options.wordTriggers.basic = options.wordTriggers.basic || {};
    options.wordTriggers.events = options.wordTriggers.events || [];

    options.chatCommands = options.chatCommands || {};
    options.chatCommands.basic = options.chatCommands.basic || {};
    options.chatCommands.events = options.chatCommands.events || [];

    tmi.Client.call(this, options);

    if (logger) {
        this.log = logger;
    }
    this.on('chat', _handleChatMessage.bind(this));
    this.on('whisper', _handleWhisperMessage.bind(this));
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
function _handleChatMessage(channel, userstate, message, self) {
    if (
        !this.getOptions().options.ignoreSelf ||
        (!self &&
            userstate.username.toLowerCase() !=
                this.getOptions().username.toLowerCase())
    ) {
        message = message.trim();
        let finalMessage = message;

        //Check if its a command or message by looking the prefix
        if (
            this.getOptions().chatCommands &&
            message.indexOf(this.getOptions().chatCommands.prefix) === 0
        ) {
            let command = helpers.getFirstWord(message.substring(1));
            //Check if its a basic command or a event command
            if (this.getOptions().chatCommands.basic[command]) {
                this.say(
                    channel,
                    _replaceTextVars(
                        this.getOptions().chatCommands.basic[command],
                        '@' + userstate.username
                    )
                );
            } else {
                /**
                 * The chat command event, triggered when the specified command is sent. This event is dynamic and the name will change according to the options passed to the toolkit.
                 * @event TwitchChatEmitter#Chat:chat_cmd_COMMAND
                 * @param {string} channel The channel in which the command was sent.
                 * @param {string} username The name of the user who sent the command.
                 * @param {string} command The triggered command.
                 * @param {bool} self Whether the command was sent to the user bot or not.
                 */
                this.emit(
                    'chat_cmd_' + command.toLowerCase(),
                    channel,
                    userstate.username,
                    command,
                    self
                );
            }
        } else {
            let words = message.replace(/[^\w\s]/g, '').split(/\W/g);
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                if (this.getOptions().wordTriggers.basic[word]) {
                    this.say(
                        channel,
                        _replaceTextVars(
                            this.getOptions().wordTriggers.basic[word],
                            '@' + userstate.username
                        )
                    );
                }
                if (this.chatEmotes[word]) {
                    let emoteHtml =
                        '<img class="chat-image"  src="' +
                        encodeURI(
                            'https://static-cdn.jtvnw.net/emoticons/v1/' +
                                this.chatEmotes[word].id +
                                '/1.0'
                        ) +
                        '">';
                    finalMessage = finalMessage.replace(word, emoteHtml);
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
        this.emit('chat_parsed', channel, userstate, finalMessage, self);
    }
}

/**
 * Handle a whisper message sent to the bot user.
 * @private
 * @param {string} from The username who sent the whisper.
 * @param {object} userstate The userstate object who sent the whisper.
 * @param {string} message The whispered message.
 * @param {bool} self Whether the command was sent to the user bot or not.
 */
function _handleWhisperMessage(from, userstate, message, self) {
    if (
        !this.getOptions().options.ignoreSelf ||
        (!self &&
            userstate.username.toLowerCase() !=
                this.getOptions().username.toLowerCase())
    ) {
        message = message.trim();
        //Check if its a command or message by looking the prefix
        if (message.indexOf(this.getOptions().whisperCommands.prefix) === 0) {
            let command = helpers.getFirstWord(message.substring(1));
            //Check if its a basic command or a event command
            if (this.getOptions().whisperCommands.basic[command]) {
                this.whisper(
                    from,
                    _replaceTextVars(
                        this.getOptions().whisperCommands.basic[command],
                        '@' + userstate.username
                    )
                );
            } else {
                let commandMessage = message
                    .substring(command.length + 2)
                    .trim();
                /**
                 * The whisper command event, triggered when the specified command is sent. This event is dynamic and the name will change according to the options passed to the toolkit.
                 * @event TwitchChatEmitter#Chat:whisper_cmd_COMMAND
                 * @param {string} userstate The userstate object for the user who sent the whisper.
                 * @param {string} command The triggered command.
                 * @param {string} commandMessage The message sent with the command.
                 * @param {bool} self Whether the command was sent to the user bot or not.
                 */
                this.emit(
                    'whisper_cmd_' + command.toLowerCase(),
                    userstate,
                    command,
                    commandMessage,
                    self
                );
            }
        }
    }
}

function _replaceTextVars(text, username) {
    return helpers.replaceAllOccurrences(text, '@user', username);
}

util.inherits(TwitchChatEmitter, tmi.Client);

/* test code */
if (process.env.NODE_ENV === 'test') {
    TwitchChatEmitter.prototype._handleChatMessage = _handleChatMessage;
    TwitchChatEmitter.prototype._handleWhisperMessage = _handleWhisperMessage;
}
/* end-test code */

module.exports = TwitchChatEmitter;
