'use strict';

const twitchChatEmitter = require('./src/twitchChatEmitter');
const twitchAPI = require('./src/twitchAPI');
const twitchWebSub = require('./src/twitchWebSub');
const logger = require('./src/logger');

function Twitch(config) {
    this.config = config || {};

    this.chatConfig = {
        username: config.username,
        options: {
            debug: config.options.debug,
            ignoreSelf: config.options.ignoreSelf
        },
        connection: {
            reconnect: true
        },
        identity: {
            username: config.username,
            password: config.password
        },
        channels: config.channels,
        commands: config.commands,
        wordTriggers: config.wordTriggers,
    };

    this.logger = logger.create();
}

Twitch.prototype.connect = async function () {
    this.chat = new twitchChatEmitter(this.chatConfig, this.logger);
    this.api = new twitchAPI(this.config, this.logger);
    this.websub = new twitchWebSub(this.config, this.logger);

    await this.chat.connect();
};

Twitch.prototype.disconnect = async function () {
    await this.chat.disconnect();
};

Twitch.prototype.isLive = async function () {
    try {
        let data = await this.api.getStreams({
            user_login: this.config.username
        });
        return data.length > 0;
    } catch (err) {
        throw err;
    }
};

Twitch.prototype.getBotUser = async function () {
    try {
        let user = await this.api.getUsers({
            login: this.config.username
        });
        return user[0];
    } catch (err) {
        throw err;
    }
};

Twitch.prototype.getStreamUser = async function () {
    try {
        let user = await this.api.getUsers({
            login: this.config.channel
        });
        return user[0];
    } catch (err) {
        throw err;
    }
};


module.exports = Twitch;