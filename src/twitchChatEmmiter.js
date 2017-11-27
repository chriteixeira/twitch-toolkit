'use strict';

const util = require('util');

const EventEmitter = require('eventemitter3');
const tmi = require('tmi.js');

const helpers = require('./helpers');

//var textVars = ['@user'];

function TwitchChatEmmiter(config) {
    EventEmitter.call(this);

    this.config = config || {};
    this.config.options = config.option || {};
    this.config.commands = config.commands || {};
    this.config.text = config.text || {};
}

TwitchChatEmmiter.prototype.connect = function () {
    let _this = this;
    var options = {
        options: {
            debug: true
        },
        connection: {
            reconnect: true
        },
        identity: {
            username: this.config.username,
            password: this.config.password
        },
        channels: this.config.channels
    };

    this.client = new tmi.client(options);

    // Connect the client to the server..
    this.client.connect();

    this.client.on('chat', _handleChatMessage.bind(this));

    this.client.on('part', function (channel, username, self) {
        _this.emit('part', channel, username, self);
    });

    this.client.on('join', function (channel, username, self) {
        _this.emit('join', channel, username, self);
    });

};

function _handleChatMessage(channel, userstate, message, self) {
    message = message.trim();
    //Check if its a command or message by looking the prefix
    if (message.indexOf(this.config.commands.prefix) === 0) {
        let command = helpers.getFirstWord(message.substring(1));
        //Check if its a basic command or a event command
        if (this.config.commands.basic[command]) {
            this.client.say(channel, replaceTextVars(this.config.commands.basic[command], userstate.username));
        }
        else {
            this.client.emit('chatCommand_' + command.toLowerCase(), channel, userstate.username, command, self);
        }
    }
    else {
        //Check if it contais a basic text word and print the message
        helpers.iterateObject(this.config.text.basic, (item, key) => {
            if (message.indexOf(key) !== -1) {
                this.client.say(channel, replaceTextVars(item, userstate.username));
            }
        });
        this.emit('chatMessage', channel, userstate.username, message, self);
    }
}

function replaceTextVars(text, username) {
    return helpers.replaceAllOccurrences(text, '@user', username);
}

util.inherits(TwitchChatEmmiter, EventEmitter);

//TwitchChatEmmiter.prototype.addCommand = function
//TwitchChatEmmiter.prototype.addCommand = function

module.exports = TwitchChatEmmiter;