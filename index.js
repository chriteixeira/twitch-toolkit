'use strict';

const Chat = require('./src/twitchChatEmitter');
const API = require('./src/twitchApi');
const WebHook = require('./src/twitchWebhook');
const PubSub = require('./src/twitchPubSub');

module.exports = {
    API,
    Chat,
    PubSub,
    WebHook
};