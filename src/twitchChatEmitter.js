'use strict';

const tmi = require('tmi.js');

const util = require('util');
const helpers = require('./helpers');
const request = require('request-promise');

//var textVars = ['@user'];

function TwitchChatEmitter(options, logger) {
    tmi.Client.call(this, options);
    this.log = logger;
    this.on('chat', _handleChatMessage.bind(this));
    this.on('whisper', _handleWhisperMessage.bind(this));
    this.chatEmotes = null;
}

TwitchChatEmitter.prototype.connect = async function () {
    tmi.Client.prototype.connect.call(this);
    try {
        let emotes = await request({
            url: 'https://twitchemotes.com/api_cache/v3/global.json',
            method: 'GET'
        });
        this.chatEmotes = JSON.parse(emotes);
    } catch (err) {
        throw err;
    }
};

function _handleChatMessage(channel, userstate, message, self) {

    if (!this.getOptions().options.ignoreSelf || (!self && userstate.username.toLowerCase() != this.getOptions().username.toLowerCase())) {
        message = message.trim();
        let finalMessage = message;

        //Check if its a command or message by looking the prefix
        if (message.indexOf(this.getOptions().chatCommands.prefix) === 0) {
            let command = helpers.getFirstWord(message.substring(1));
            //Check if its a basic command or a event command
            if (this.getOptions().chatCommands.basic[command]) {
                this.say(channel, replaceTextVars(this.getOptions().chatCommands.basic[command], '@' + userstate.username));
            } else {
                this.emit('chat_cmd_' + command.toLowerCase(), channel, userstate.username, command, self);
            }
        } else {
            let words = message.replace(/[^\w\s]/g, '').split(/\W/g);
            for (let i = 0; i < words.length; i++) {
                let word = words[i];
                if (this.getOptions().wordTriggers.basic[word]) {
                    this.say(channel, replaceTextVars(this.getOptions().wordTriggers.basic[word], userstate.username));
                }
                if (this.chatEmotes[word]) {
                    let emoteHtml = '<img class="chat-image"  src="' + encodeURI('https://static-cdn.jtvnw.net/emoticons/v1/' + this.chatEmotes[word].id + '/1.0') + '">';
                    finalMessage = finalMessage.replace(word, emoteHtml);
                }
            }
        }
        this.emit('chat_parsed', channel, userstate, finalMessage, self);
    }
}

function _handleWhisperMessage(from, userstate, message, self) {

    if (!this.getOptions().options.ignoreSelf || (!self && userstate.username.toLowerCase() != this.getOptions().username.toLowerCase())) {
        message = message.trim();
        //Check if its a command or message by looking the prefix
        if (message.indexOf(this.getOptions().whisperCommands.prefix) === 0) {
            let command = helpers.getFirstWord(message.substring(1));
            //Check if its a basic command or a event command
            if (this.getOptions().whisperCommands.basic[command]) {
                this.whisper(from, replaceTextVars(this.getOptions().whisperCommands.basic[command], '@' + userstate.username));
            } else {
                let commandMessage = message.substring(command.length + 2).trim();
                this.emit('whisper_cmd_' + command.toLowerCase(), userstate, command, commandMessage, self);
            }
        }
    }
}

function replaceTextVars(text, username) {
    return helpers.replaceAllOccurrences(text, '@user', username);
}

util.inherits(TwitchChatEmitter, tmi.Client);

module.exports = TwitchChatEmitter;