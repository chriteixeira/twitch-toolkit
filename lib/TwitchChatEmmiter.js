'use strict';

const util = require("util");

const EventEmitter = require('eventemitter3');
const tmi = require("tmi.js");

var textVars = ['@user'];

function TwitchChatEmmiter(config) {
    EventEmiiter.call(this);

    this.config = {
        username: process.env.TWITCH_USERNAME,
        password: process.env.TWITCH_CHAT_PASSWORD,
        channels: [process.env.TWITCH_CHANNEL],
        options: {
            debug: true,
            reconnect: true
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

async function _initChatBot() {
    try {
        let _self = this;
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
            message = message.trim();
            if (message.indexOf(_this.config.commands.prefix) === 0) {
                _this.emit('chatcommand', channel, userstate.username, command, self);
            }
            else {
                _this.emit('chatmessage', channel, userstate.username, message, self);
            }
        });

        client.on('part', function (channel, username, self) {
            _this.emit('part', channel, username, self);
        });

        client.on('join', function (channel, username, self) {
            _this.emit('join', channel, username, self);
        });
    } catch (err) {
        console.error(err);
    }
}

function replaceTextVars(text, username) {
    text.replace(new RegExp('@user', 'g'), username);
}

util.inherits(TwitchChatEmmiter, EventEmitter);

//TwitchChatEmmiter.prototype.addCommand = function
//TwitchChatEmmiter.prototype.addCommand = function

module.exports = TwitchChatEmmiter;