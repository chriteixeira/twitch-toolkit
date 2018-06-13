'use strict';

const chai = require('chai');
const expect = chai.expect; // eslint-disable-line no-unused-vars

const twitchChat = require('../src/twitchChatEmitter');

let chatConfig = {
    options: {
        ignoreSelf: false
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: process.env.TWITCH_CLIENT_USERNAME,
        password: process.env.TWITCH_CLIENT_PASSWORD
    },
    chatCommands: {
        prefix: '!',
        basic: {
            testCommand: 'This is a test!'
        },
        event: ['testCommandEvent']
    },
    wordTriggers: {
        basic: {
            testWord: 'This is a test!'
        },
        event: ['testWordEvent']
    },
    channels: ['#stallonecobrabot']
};
let chat;

describe('twitchChat.connect', () => {
    it('should connect to the chat without errors', function(done) {
        chat = new twitchChat(chatConfig);
        chat.connect()
            .then(() => {
                done();
            })
            .catch(err => {
                done(err);
            });
    });
});

describe('twitchChat:_handleChatMessage', () => {
    let userstate = {
        badges: { broadcaster: '1', warcraft: 'horde' },
        color: '#FFFFFF',
        'display-name': 'Schmoopiie',
        emotes: { '25': ['0-4'] },
        mod: true,
        'room-id': '37402112',
        subscriber: false,
        turbo: true,
        'user-id': '37402112',
        'user-type': 'mod',
        'emotes-raw': '25:0-4',
        'badges-raw': 'broadcaster/1,warcraft/horde',
        username: 'shad_ra',
        'message-type': 'chat'
    };

    it('should emit the chat_parsed event', function(done) {
        let msg = 'Test message ' + new Date().getTime();
        chat.on('chat_parsed', (channel, userstate, message) => {
            chat.removeAllListeners('chat_parsed');
            if (message === msg) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat._handleChatMessage('#stallonecobrabot', userstate, msg, false);
    });

    it('should emit the command event', function(done) {
        chat.on('chat_cmd_testcommandevent', () => {
            chat.removeAllListeners('chat_cmd_testcommandevent');
            done();
        });
        chat._handleChatMessage(
            '#stallonecobrabot',
            userstate,
            '!testCommandEvent',
            false
        );
    });

    it('should trigger the basic command text', function(done) {
        chat.on('chat_parsed', (channel, userstate, message) => {
            chat.removeAllListeners('chat_parsed');
            if (message === chatConfig.chatCommands.basic.testCommand) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat._handleChatMessage(
            '#stallonecobrabot',
            userstate,
            '!testCommand',
            false
        );
    });

    it('should trigger the basic word text', function(done) {
        chat.on('chat_parsed', (channel, userstate, message) => {
            chat.removeAllListeners('chat_parsed');
            if (message === chatConfig.wordTriggers.basic.testWord) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat._handleChatMessage(
            '#stallonecobrabot',
            userstate,
            'testWord',
            false
        );
    });
});

describe('twitchChat:chatParsed event', () => {
    it('should receive the same text with no emote', function(done) {
        let sentMessage = 'Test message ' + new Date().getTime();
        chat.on('chat_parsed', (channel, userstate, message, self) => {
            chat.removeAllListeners('chat_parsed');
            if (
                channel === '#stallonecobrabot' &&
                self &&
                userstate &&
                message === sentMessage
            ) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat.say('#stallonecobrabot', sentMessage);
    });

    it('should parse the emote to html', function(done) {
        chat.on('chat_parsed', (channel, userstate, message, self) => {
            chat.removeAllListeners('chat_parsed');
            if (
                channel === '#stallonecobrabot' &&
                self &&
                userstate &&
                message.indexOf('<img class="chat-image"' >= 0)
            ) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat.say('#stallonecobrabot', 'Kappa');
    });

    it('should parse the emote to html and keep the remaining text', function(done) {
        let text = 'Test message ' + new Date().getTime();
        chat.on('chat_parsed', (channel, userstate, message, self) => {
            chat.removeAllListeners('chat_parsed');
            if (
                channel === '#stallonecobrabot' &&
                self &&
                userstate &&
                message.indexOf('<img class="chat-image"') >= 0 &&
                message.indexOf(text) >= 0
            ) {
                done();
            } else {
                done(new Error('Validation failed.'));
            }
        });
        chat.say('#stallonecobrabot', 'Kappa ' + text);
    });
});

describe('twitchChat:wordTriggers', () => {
    it('should send the proper message on basic chat word triggers', function(done) {
        chat.on('chat_parsed', (channel, userstate, message, self) => {
            if (
                channel === '#stallonecobrabot' &&
                self &&
                userstate &&
                message === chatConfig.wordTriggers.basic.testWord
            ) {
                chat.removeAllListeners('chat_parsed');
                done();
            } else if (message !== 'testWord') {
                chat.removeAllListeners('chat_parsed');
                done(
                    new Error('Validation failed. Message received: ' + message)
                );
            }
        });
        chat.say('#stallonecobrabot', 'testWord');
    });

    /*
    it('should trigger the proper event on event chat word triggers', function(done) {
        chat.on('chat_cmd_testcommandevent', () => {
            chat.removeAllListeners('chat_cmd_testwordevent');
            done();
        });
        chat.say('#stallonecobrabot', 'testWordEvent');
    });
    */
});

describe('twitchChat:chatCommands', () => {
    it('should send the proper message on basic chat command', function(done) {
        chat.on('chat_parsed', (channel, userstate, message, self) => {
            if (
                channel === '#stallonecobrabot' &&
                self &&
                userstate &&
                message === chatConfig.chatCommands.basic.testCommand
            ) {
                chat.removeAllListeners('chat_parsed');
                done();
            } else if (message !== '!testCommand') {
                chat.removeAllListeners('chat_parsed');
                done(
                    new Error('Validation failed. Message received: ' + message)
                );
            }
        });
        chat.say('#stallonecobrabot', '!testCommand');
    });

    it('should trigger the proper event on event chat command', function(done) {
        chat.on('chat_cmd_testcommandevent', () => {
            chat.removeAllListeners('chat_cmd_testcommandevent');
            done();
        });
        chat.say('#stallonecobrabot', '!testCommandEvent');
    });
});

describe('twitchChat.disconnect', () => {
    it('should disconnect from the chat', function(done) {
        chat.disconnect()
            .then(() => done())
            .catch(err => done(err));
    });
});
