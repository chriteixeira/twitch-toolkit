'use strict';

const twitchChatEmitter = require('./src/twitchChatEmitter');
const twitchAPI = require('./src/twitchApi');
const twitchWebSub = require('./src/twitchWebSub');
const logger = require('./src/logger');

/**
 * @class Twitch
 * Create the toolkit with its modules.
 * @param {object} config 
 */
function Twitch(config) {
    this.config = config || {};

    this.chatConfig = {
        username: config.chat.username,
        options: {
            debug: config.debug,
            ignoreSelf: config.chat.ignoreSelf
        },
        connection: {
            reconnect: config.chat.reconnect
        },
        identity: {
            username: config.chat.username,
            password: config.chat.password
        },
        channels: config.chat.channels,
        chatCommands: config.chat.chatCommands,
        whisperCommands: config.chat.whisperCommands,
        wordTriggers: config.chat.wordTriggers,
    };

    this.logger = (config.logger) ? config.logger : logger.create();
    this.chat = new twitchChatEmitter(this.chatConfig, this.logger);
    this.api = new twitchAPI(this.config, this.logger);
    this.websub = new twitchWebSub(this.config, this.logger);
}

/**
 * Connect to twitch chat.
 */
Twitch.prototype.connect = async function () {
    try {
        await this.chat.connect();
    } catch (err) {
        throw err;
    }
};

/**
 * Disconnect from the twitch chat.
 */
Twitch.prototype.disconnect = async function () {
    try {
        await this.chat.disconnect();
    } catch (err) {
        throw err;
    }
};

/**
 * Check if the stream is live.
 * @return {bool} True if the stream is live and false otherwise.
 */
Twitch.prototype.isLive = async function () {
    try {
        let data = await this.api.getStreams({
            user_login: this.config.streamName
        });
        return data.length > 0;
    } catch (err) {
        throw err;
    }
};

/**
 * Get the bot user data.
 * @return {object} The bot user data object.
 */
Twitch.prototype.getBotUser = async function () {
    try {
        let user = await this.api.getUsers({
            login: this.config.streamName
        });
        return user[0];
    } catch (err) {
        throw err;
    }
};

/**
 * Get the stream user data.
 * @return {object} The stream user data object.
 */
Twitch.prototype.getStreamUser = async function () {
    try {
        let user = await this.api.getUsers({
            login: this.config.streamName
        });
        return user[0];
    } catch (err) {
        throw err;
    }
};


module.exports = Twitch;