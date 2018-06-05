'use strict';

const request = require('request-promise');
const util = require('util');
const eventemitter = require('eventemitter3');
const _ = require('./helpers');

const API_BASE_URL = 'https://api.twitch.tv/helix';

/**
 * @class TwitchWebSub
 * The Twitch Webhooks implementation, as described in https://dev.twitch.tv/docs/api/webhooks-guide/ .
 * The Webhook/WebSub requires a public endpoint on the running express server/application to receive the data from the hub. Without this, its impossible to make this work.
 *
 * @param {object} config The config object.
 * @param {string} config.client_id The client ID of the user to be passed to the Hub (un)subscribe requests.
 * @param {string} config.callbackUrl The callback URL that will receive the Hub requests. These requests should be forwarded to the handleRequest method to properly handle these data.
 * @param {object} logger The logger object.
 */
function TwitchWebSub(config, logger) {
    eventemitter.call(this);
    this.config = config;
    this.logger = logger;

    this.secret = _.uuidv4();
    this.subscribersMap = {};
}

/**
 * Notifies when a follows event occurs. The response mimics the Get Users Follows endpoint. (https://dev.twitch.tv/docs/api/reference/#get-users-follows)
 *
 * @param {number} fromId The ID of the user who starts following someone.
 * @param {number} toId The ID of the user who has a new follower.
 * @return {string} The subscription ID, used to identify the active topic.
 */
TwitchWebSub.prototype.topicUserFollowsSubscribe = async function(
    fromId,
    toId
) {
    /**
     * Stream User Follows Event
     * @event TwitchWebSub#user_follows
     * @param {object} data The data object received from the Hub.
     * @param {string} id The subscription ID.
     */
    try {
        let topic = API_BASE_URL + '/users/follows?first=1';
        if (fromId) {
            topic += '&from_id=' + fromId;
        } else if (toId) {
            topic += '&to_id=' + toId;
        }
        return this.subscribe(topic, 'user_follows');
    } catch (err) {
        throw err;
    }
};

/**
 * Notifies when a stream goes online or offline. The response mimics the Get Streams endpoint. (https://dev.twitch.tv/docs/api/reference/#get-streams)
 *
 * @param {number} streamUserId The ID of the user whose stream is monitored.
 * @return {string} The subscription ID, used to identify the active topic.
 */
TwitchWebSub.prototype.topicStreamUpDownSubscribe = async function(
    streamUserId
) {
    /**
     * Stream Up/Down Event
     * @event TwitchWebSub#stream_up_down
     * @param {object} data The data object received from the Hub.
     * @param {string} id The subscription ID.
     */
    try {
        let topic = API_BASE_URL + '/streams?user_id=' + streamUserId;
        return this.subscribe(topic, 'stream_up_down');
    } catch (err) {
        throw err;
    }
};

/**
 * Subscribe to a specific topic that will fires an event when new data is received from the hub.
 * The event handler will receive the data object and the subscription ID.
 * @param {string} topic The topic name/URL.
 * @param {string} eventName The event name that will be fired when new data is received.
 * @return {string} The subscription ID, used to identify the active topic.
 */
TwitchWebSub.prototype.subscribe = async function(topic, eventName) {
    try {
        this.logger.debug('Subscribing WebSub with topic: ' + topic);
        let item = {
            id: _.uuidv4(),
            topic: topic,
            eventName: eventName,
            subscribedAt: new Date(),
            secret: _.generateRandomKey()
        };

        await request({
            url: API_BASE_URL + '/webhooks/hub',
            method: 'POST',
            headers: {
                'Client-ID': this.config.client_id,
                'Content-Type': 'application/json'
            },
            form: {
                'hub.callback': this.config.callbackUrl + '?item.id=' + item.id,
                'hub.mode': 'subscribe',
                'hub.topic': topic,
                'hub.lease_seconds': 864000,
                'hub.secret': item.secret
            },
            json: true
        });

        this.subscribersMap[item.id] = item;
        return item.id;
    } catch (err) {
        throw err;
    }
};

/**
 * This method will handle the request received by the express server and validate the subscriptions or properly emit the events with the received data.
 * @param {object} request The express request object.
 * @param {object} response The express response object.
 */
TwitchWebSub.prototype.handleRequest = function(request, response) {
    try {
        this.logger.debug('Receiving new WebSub request');
        if (request.query['hub.challenge']) {
            response.send(request.query['hub.challenge']);
        } else {
            let id = request.query['item.id'];
            if (id && this.subscribersMap[id]) {
                let item = this.subscribersMap[id];
                let data = request.body ? request.body.data : null;

                //TODO Validate secret
                response.sendStatus(200);
                this.emit(item.eventName, data, id);
            } else {
                response.sendStatus(400);
            }
        }
    } catch (err) {
        response.sendStatus(500);
        throw err;
    }
};

/**
 * Unsubscribe from a topic by its ID.
 * @param {string} id The subscription ID.
 */
TwitchWebSub.prototype.unsubscribe = async function(id) {
    try {
        this.logger.debug('Requesting WebSub unsubscription with id: ' + id);
        if (this.subscribersMap[id]) {
            let item = this.subscribersMap[id];
            await request({
                url: API_BASE_URL + '/webhooks/hub',
                method: 'POST',
                headers: {
                    'Client-ID': this.config.client_id,
                    'Content-Type': 'application/json'
                },
                form: {
                    'hub.callback':
                        this.config.callbackUrl + '?item.id=' + item.id,
                    'hub.mode': 'unsubscribe',
                    'hub.topic': item.topic,
                    'hub.secret': item.secret
                },
                json: true
            });
            this.logger.debug('WebSub unsubscribed: ' + id);
        } else {
            this.logger.warn('Unable to find subscription with id ' + id);
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Destroy the WebSub, unsubscribing every active subscription.
 */
TwitchWebSub.prototype.destroy = async function() {
    try {
        this.logger.info('Destroying TwitchWebSub...');
        for (const key in this.subscribersMap) {
            if (this.subscribersMap.hasOwnProperty(key)) {
                let item = this.subscribersMap[key];
                this.logger.debug(
                    'Unsubscribing user with topic: ' + item.topic
                );
                await this.unsubscribe(item.id);
            }
        }
        this.subscribersMap = {};
        this.logger.info('TwitchWebSub destroyed.');
    } catch (err) {
        throw err;
    }
};

util.inherits(TwitchWebSub, eventemitter);
module.exports = TwitchWebSub;
