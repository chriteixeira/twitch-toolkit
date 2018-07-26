'use strict';

const Chat = require('./src/twitchChatEmitter');
const API = require('./src/twitchApi');
const WebHook = require('./src/twitchWebhook');

module.exports = {
    API,
    Chat,
    WebHook
};
