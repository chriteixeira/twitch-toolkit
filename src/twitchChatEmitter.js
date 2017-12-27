'use strict';

const tmi = require('tmi.js');

const util = require('util');
const helpers = require('./helpers');

//var textVars = ['@user'];

function TwitchChatEmitter(options, logger) {
    tmi.Client.call(this, options);
    this.log = logger;
    this.on('chat', _handleChatMessage.bind(this));
}

TwitchChatEmitter.prototype.connect = function () {
    tmi.Client.prototype.connect.call(this);
};

function _handleChatMessage(channel, userstate, message, self) {

    if (!this.getOptions().options.ignoreSelf || (!self && userstate.username.toLowerCase() != this.getOptions().username.toLowerCase())) {
        message = message.trim();
        //Check if its a command or message by looking the prefix
        if (message.indexOf(this.getOptions().commands.prefix) === 0) {
            let command = helpers.getFirstWord(message.substring(1));
            //Check if its a basic command or a event command
            if (this.getOptions().commands.basic[command]) {
                this.say(channel, replaceTextVars(this.getOptions().commands.basic[command], '@' + userstate.username));
            } else {
                this.emit('command_' + command.toLowerCase(), channel, userstate.username, command, self);
            }
        } else {
            //Check if it contais a basic text word and print the message
            helpers.iterateObject(this.getOptions().wordTriggers.basic, (item, key) => {
                if (message.indexOf(key) !== -1) {
                    this.say(channel, replaceTextVars(item, userstate.username));
                }
            });
        }
    }
}

function replaceTextVars(text, username) {
    return helpers.replaceAllOccurrences(text, '@user', username);
}

util.inherits(TwitchChatEmitter, tmi.Client);

module.exports = TwitchChatEmitter;