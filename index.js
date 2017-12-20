'use strict';

const twitchChatEmmiter = require('./src/twitchChatEmmiter');
const twitchAPI = require('./src/twitchAPI');

function Twitch(config) {
    this.options = config || {};

    let chatOptions = {
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

    this.chat = new twitchChatEmmiter(chatOptions);
    this.api = new twitchAPI(config);
}

Twitch.prototype.connect = async function () {
    await this.chat.connect();
};

Twitch.prototype.disconnect = async function () {
    await this.chat.disconnect();
};

Twitch.prototype.isLive = async function () {
    try {
        let data = await this.api.getStreams({
            user_login: this.options.username
        });
        return data.length > 0;
    } catch (err) {
        throw err;
    }
};

Twitch.prototype.getUser = async function () {
    try {
        let user = await this.api.getUsers({
            login: this.options.username
        });
        return user[0];
    } catch (err) {
        throw err;
    }
};


module.exports = Twitch;