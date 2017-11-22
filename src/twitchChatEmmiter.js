'use strict';

const util = require('util');

const EventEmitter = require('eventemitter3');
const tmi = require('tmi.js');

const stringUtils = require('./stringUtils');

//var textVars = ['@user'];

function TwitchChatEmmiter() {
    EventEmitter.call(this);

    this.config = {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_CHAT_PASSWORD,
        channels: [process.env.TWITCH_CHANNEL],
        options: {
            debug: true,
            reconnect: true,
            ignoreSelf: true,
        },
        commands: {
            prefix: '!',
            basic: {
                'discord': 'abc'
            },
            event: ['horario'],
        },
        text: {
            basic: {
                'maconha': '@user Maconha faz mal, sabia?',
                'stallonecobra': '@user O que você quer, cretino?'
            },
            event: ['']
        }
    };

    _initChatBot();
}

function _initChatBot() {
    try {
        let _this = this;
        var options = {
            options: {
                debug: true
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: process.env.TWITCH_USERNAME,
                password: process.env.TWITCH_CHAT_PASSWORD
            },
            channels: [process.env.TWITCH_CHANNEL]
        };

        var client = new tmi.client(options);

        // Connect the client to the server..
        client.connect();

        client.on('chat', function (channel, userstate, message, self) {
            handleChatMessage(client, channel, userstate, message, self);
        });

        client.on('part', function (channel, username, self) {
            _this.emit('part', channel, username, self);
        });

        client.on('join', function (channel, username, self) {
            _this.emit('join', channel, username, self);
        });
    } catch (err) {
        //console.error(err);
    }
}

function handleChatMessage(client, channel, userstate, message, self) {
    message = message.trim();
    if (message.indexOf(client.config.commands.prefix) === 0) {
        let command = stringUtils.getFirstWord(message);
        if (client.config.commands.basic[command]) {
            client.say(channel, replaceTextVars(client.config.commands.basic[command], userstate.username));
        }
        else {
            client.emit('chatCommand_' + command, channel, userstate.username, command, self);
        }
    }
    else {
        //if (client.config.text.basic[message]) {
        //}
        //else {
        this.emit('chatmessage', channel, userstate.username, message, self);
        //}
    }
}

function replaceTextVars(text, username) {
    stringUtils.replaceAllOccurrences(text, '@user', username);
}

util.inherits(TwitchChatEmmiter, EventEmitter);

//TwitchChatEmmiter.prototype.addCommand = function
//TwitchChatEmmiter.prototype.addCommand = function

module.exports = TwitchChatEmmiter;