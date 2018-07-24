'use strict';

const Chat = require('./src/twitchChatEmitter');
const API = require('./src/twitchApi');
const WebSub = require('./src/twitchWebSub');

module.exports = {
    API,
    Chat,
    WebSub
};
