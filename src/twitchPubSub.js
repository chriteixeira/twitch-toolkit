const eventemitter = require('eventemitter3');
const WebSocket = require('ws');
const util = require('util');

const _ = require('./helpers');
const logger = require('./logger').getLogger();

const WEBSOCKET_ADDRESS = 'wss://pubsub-edge.twitch.tv';
const WEBSOCKET_TIMEOUT = 4 * 60 * 1000;

//TODO Add this param and support
//@param {number}   config.maxReconnectAttempts Max number of reconnection attempts (Default: Infinity)
//@param {number}   config.maxReconnectInterval Max number of ms to delay a reconnection (Default: 30000)
//@param {number}   config.reconnectDecay The rate of increase of the reconnect delay (Default: 1.5)
//@param {number}   config.reconnectInterval Number of ms before attempting to reconnect (Default: 1000)
//@param {boolean}  config.secure Use secure connection (SSL / HTTPS) (Overrides port to 443)
//@param {number}   config.timeout Number of ms to disconnect if no responses from server (Default: 9999)

/**
 * @class TwitchPubSub
 * The Twitch PubSub implementation, as described in https://dev.twitch.tv/docs/pubsub/ .
 * @param {object}   config The config object.
 * @param {object}   config.logger The logger instance. If empty, the default logger will be used.
 * @param {string}   config.authToken The Twitch with OAuth token.
 * @param {boolean}  config.reconnect Reconnect to Twitch PubSub when disconnected from server. Default: false
 */
function TwitchPubSub(config) {
    eventemitter.call(this);
    this.logger = config.logger || logger;
    this.waitingResponseMap = new Map();
    this.subscriptions = [];

    this.config = config;
    this.config.reconnect = this.config.reconnect || true;
}

/**
 * Connects to the Twitch PubSub
 * @returns {Promise} Promise for the connection.
 */
TwitchPubSub.prototype.connect = function() {
    this.logger.debug('Connecting Twitch PubSub');
    this.ws = new WebSocket(WEBSOCKET_ADDRESS);
    this.ws.onopen = _onOpen.bind(this);
    this.ws.onclose = _onClose.bind(this);
    this.ws.onmessage = _onMessage.bind(this);
    this.ws.onerror = _onError.bind(this);

    this.ws.on('ping', _onPing.bind(this));
    this.ws.on('pong', _onPong.bind(this));

    this.refreshIntervalId = setInterval(
        _refresh.bind(this),
        WEBSOCKET_TIMEOUT
    );

    return new Promise(
        (resolve, reject) =>
            (this.connectionPromise = {
                resolve,
                reject
            })
    );
};

/**
 * Disconnects to the Twitch PubSub
 * @returns {Promise} Promise for the disconnection.
 */
TwitchPubSub.prototype.disconnect = function() {
    this.logger.debug('Disconnecting Twitch PubSub');
    this.ws.close();
    this.isConnected = false;
    clearInterval(this.refreshIntervalId);
    delete this.ws;
    delete this.waitingResponseMap;

    return new Promise(
        (resolve, reject) =>
            (this.disconnectionPromise = {
                resolve,
                reject
            })
    );
};

/**
 * Reconnect to WebSub and resubscribe to the already added topics.
 * @returns {Promise}
 */
TwitchPubSub.prototype.reconnect = async function() {
    //clear the previous interval
    clearInterval(this.refreshIntervalId);
    await this.connect();
    for (let i in this.subscriptions) {
        let subscription = this.subscriptions[i];
        this.subscribe(
            subscription.types,
            subscription.dataId,
            subscription.authToken,
            true
        );
    }
};

/**
 * Subscribe to a topic based on the type.
 * @param {String[]} types The types array. Valid options: 'bits', 'subscription', 'commerce', 'whisper'
 * @param {String} id The channel/user ID.
 * @param {String} authToken The oauth token with the necessary scopes.
 * @returns {Promise} The subscription promise that will be resolved when it receives the response.
 */
TwitchPubSub.prototype.subscribe = function(types, id, authToken, isReconnect) {
    return new Promise((resolve, reject) => {
        if (!types) reject('Missing types parameter');
        if (!id) reject('Missing id parameter');
        if (!authToken) reject('Missing authToken parameter');

        let topics = [];
        for (let i in types) {
            let topic;
            switch (types[i]) {
                case 'bits':
                    topic = 'channel-bits-events-v1';
                    break;
                case 'subscription':
                    topic = 'channel-subscribe-events-v1';
                    break;
                case 'whisper':
                    topic = 'whispers';
                    break;
                default:
                    throw new Error('Unknown type.');
            }
            topic += '.' + id;
            topics.push(topic);
        }
        let key = _.uuidv4();
        let data = {
            type: 'LISTEN',
            nonce: key,
            data: {
                topics: topics,
                auth_token: authToken
            }
        };
        this.ws.send(JSON.stringify(data));
        this.logger.debug('Sending topic subscription for ' + topics);

        let subscription = {
            types,
            id,
            authToken,
            data: {
                resolve,
                reject
            }
        };
        this.waitingResponseMap.set(key, subscription);

        if (!isReconnect) {
            this.subscriptions.push({
                types,
                id,
                authToken
            });
        }
    });
};

function _onOpen() {
    this.logger.debug('Twitch PubSub connected.');
    this.isConnected = true;
    this.connectionPromise.resolve();
    delete this.connectionPromise;
}

function _onClose() {
    this.logger.debug('Twitch PubSub connection closed.');
    if (this.disconnectionPromise) {
        this.isConnected = false;
        this.disconnectionPromise.resolve();
        delete this.disconnectionPromise;
    } else {
        return this.reconnect();
    }
}

function _onPing() {
    this.logger.debug('WS PING received.');
}

function _onPong() {
    this.logger.debug('WS PONG received.');
}

function _onMessage(event) {
    this.logger.debug('New message received: ' + event.data);
    let message = JSON.parse(event.data);
    if (!message || !message.type) {
        throw new Error('Invalid message format.');
    } else if (message.type.toUpperCase() === 'PONG') {
        this.lastPong = new Date().getTime();
    } else if (message.type.toUpperCase() === 'RECONNECT') {
        this.logger.debug('Reconnecting in 30 seconds.');
        setTimeout(this.reconnect, 30000);
    } else if (message.type === 'RESPONSE') {
        _handleResponse.call(this, message);
    } else if (message.type === 'MESSAGE') {
        _handleMessage.call(this, message);
    }
}

function _onError(errorEvent) {
    this.logger.warn('Error received: ' + errorEvent.message);
}

function _handleResponse(message) {
    if (this.waitingResponseMap.has(message.nonce)) {
        if (message.type.toUpperCase() === 'RESPONSE') {
            let subscription = this.waitingResponseMap.get(message.nonce);
            if (!message.error || message.error.trim().length === 0) {
                subscription.data.resolve(message.nonce);
                subscription.state === 'connected';
                delete subscription.data;
            } else {
                subscription.data.reject(new Error(message.error));
                this.waitingResponseMap.delete(message.nonce);
            }
        }
    } else {
        this.logger.warn(
            'Connection for RESPONSE with nouce ' +
                message.nonce +
                ' not found.'
        );
    }
}

function _handleMessage(message) {
    let id = message.data.topic.split('.').slice(-1)[0];
    let topicArr = message.data.topic.split('.');
    let type;
    switch (topicArr[0]) {
        case 'channel-bits-events-v1':
            type = 'bits';
            break;
        case 'channel-subscribe-events-v1':
            type = 'subscription';
            break;
        case 'channel-commerce-events-v1':
            type = 'commerce';
            break;
        case 'whispers':
            type = 'whisper';
            break;
        default:
            this.logger.warn('Unknown topic ' + topicArr[0]);
    }

    if (type) {
        this.emit(type, id, message.data.message);
    }
}

function _refresh() {
    this.logger.debug('Refreshing the PubSub with a PING command.');
    this.ws.ping();
    this.ws.send('{"type": "PING"}');
    let pingTime = new Date().getTime();

    //check if a PONG will be received in the next 10 seconds, otherwise issue a reconnects
    //CLEAR TIMEOUT
    let _this = this;
    setTimeout(() => {
        if (_this.config.reconnect && _this.lastPong < pingTime) {
            _this.reconnect();
        }
    }, 10000);
}

/* test code */
if (process.env.NODE_ENV === 'test') {
    TwitchPubSub.prototype._onOpen = _onOpen;
    TwitchPubSub.prototype._onMessage = _onMessage;
    TwitchPubSub.prototype._handleResponse = _handleResponse;
    TwitchPubSub.prototype._refresh = _refresh;
}
/* end-test code */

util.inherits(TwitchPubSub, eventemitter);
module.exports = TwitchPubSub;
