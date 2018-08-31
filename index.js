'use strict';

const Chat = require('./src/twitchChatEmitter');
const API = require('./src/twitchApi');
const WebHook = require('./src/twitchWebhook');
const WebSub = require('./src/twitchWebSub');

module.exports = {
    API,
    Chat,
    WebSub,
    WebHook
};