'use strict';

const chai = require('chai');
const expect = chai.expect; // eslint-disable-line no-unused-vars

const twitchChat = require('../src/twitchChatEmitter');

let triggerWordEvent = {
    name: 'test_word',
    type: 'word',
    chatTrigger: true,
    whisperTrigger: false,
    eventName: 'test_word_evt'
};

let triggerCommandEvent = {
    name: 'test_command',
    type: 'command',
    chatTrigger: true,
    whisperTrigger: false,
    eventName: 'test_command_evt'
};

let triggerWordText = {
    name: 'test_word',
    type: 'word',
    chatTrigger: true,
    whisperTrigger: false,
    responseText: 'word test text'
};

let triggerCommandText = {
    name: 'test_command',
    type: 'command',
    chatTrigger: true,
    whisperTrigger: false,
    responseText: 'command test text'
};

let triggerDelay = {
    name: 'delay_command',
    type: 'command',
    chatTrigger: true,
    whisperTrigger: false,
    minDelay: 1000,
    eventName: 'test_delay_evt'
};

let chatConfig = {
    channels: ['#stallonecobrabot'],
    username: process.env.TWITCH_CLIENT_USERNAME,
    password: process.env.TWITCH_CLIENT_PASSWORD,
    reconnect: true,
    triggers: [
        triggerWordEvent,
        triggerCommandEvent,
        triggerWordText,
        triggerCommandText,
        triggerDelay
    ]
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

describe('twitchChat:_handleMessage', () => {
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
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            msg,
            false
        );
    });

    it('should emit the command event', function(done) {
        chat.on(triggerCommandEvent.eventName, () => {
            chat.removeAllListeners(triggerCommandEvent.eventName);
            done();
        });
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            '!' + triggerCommandEvent.name,
            false
        );
    });

    it('should emit the word event', function(done) {
        chat.on(triggerWordEvent.eventName, () => {
            chat.removeAllListeners(triggerWordEvent.eventName);
            done();
        });
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            triggerWordEvent.name,
            false
        );
    });

    it('should trigger the basic command text', function(done) {
        chat.on('chat_parsed', (channel, userstate, message) => {
            chat.removeAllListeners('chat_parsed');
            if (message === triggerCommandText.responseText) {
                done();
            } else if (message !== '!' + triggerCommandText.name) {
                done(new Error('Validation failed.'));
            }
        });
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            '!' + triggerCommandText.name,
            false
        );
    });

    it('should trigger the basic word text', function(done) {
        chat.on('chat_parsed', (channel, userstate, message) => {
            chat.removeAllListeners('chat_parsed');
            if (message === triggerWordText.responseText) {
                done();
            } else if (message !== '!' + triggerWordText.name) {
                done(new Error('Validation failed.'));
            }
        });
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            triggerWordText.name,
            false
        );
    });

    it('should not trigger an event before the minimum delay', function(done) {
        let triggerCount = 0;
        chat.on(triggerDelay.eventName, () => {
            triggerCount++;
        });
        setTimeout(() => {
            chat.removeAllListeners(triggerDelay.eventName);
            if (triggerCount === 1) {
                done();
            } else {
                done(new Error('Event triggered more than one time.'));
            }
        }, triggerDelay.minDelay + 500);

        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            '!' + triggerDelay.name,
            false
        );
        chat._handleMessage(
            chat,
            'chat',
            '#stallonecobrabot',
            userstate,
            '!' + triggerDelay.name,
            false
        );
    });
});

describe('twitchChat:_getMessageWords', () => {
    it('should return an empty array for an empty string', function() {
        let words = chat._getMessageWords('','');
        expect(words).to.not.be.empty;
    });

    it('should return the right number of words for a non-empty string', function() {
        let words = chat._getMessageWords('this is a test.','!');
        expect(words).to.have.lengthOf(4);
    });

    it('should return the right words', function() {
        let words = chat._getMessageWords('this is a test.','!');
        expect(words[0]).to.be.equal('this');
        expect(words[1]).to.be.equal('is');
        expect(words[2]).to.be.equal('a');
        expect(words[3]).to.be.equal('test');
    });

    it('should return the right words and command', function() {
        let words = chat._getMessageWords('this is a !test.','!');
        expect(words[0]).to.be.equal('this');
        expect(words[1]).to.be.equal('is');
        expect(words[2]).to.be.equal('a');
        expect(words[3]).to.be.equal('!test');
    });
});

describe('twitchChat.disconnect', () => {
    it('should disconnect from the chat', function(done) {
        chat.disconnect()
            .then(() => done())
            .catch(err => done(err));
    });
});
