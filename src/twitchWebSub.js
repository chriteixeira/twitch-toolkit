'use strict';

const request = require('request-promise');
const util = require('util');
const eventemitter = require('eventemitter3');
const _ = require('./helpers');

const API_BASE_URL = 'https://api.twitch.tv/helix';

function TwitchWebSub(config, logger) {
    eventemitter.call(this);
    this.config = config;
    this.logger = logger;

    this.secret = _.uuidv4();
    this.subscribersMap = {};
}

TwitchWebSub.prototype.topicUserFollowsSubscribe = async function(
    fromId,
    toId
) {
    try {
        let topic = API_BASE_URL + '/users/follows?';
        if (fromId && toId) {
            topic += 'from_id=' + fromId + '&to_id=' + toId;
        } else if (fromId) {
            topic += 'from_id=' + fromId;
        } else if (toId) {
            topic += 'to_id=' + toId;
        }
        return this.subscribe(topic, 'user_follows');
    } catch (err) {
        throw err;
    }
};

TwitchWebSub.prototype.topicStreamUpDownSubscribe = async function(
    streamUserId
) {
    try {
        let topic = API_BASE_URL + '/streams?user_id=' + streamUserId;
        return this.subscribe(topic, 'stream_up_down');
    } catch (err) {
        throw err;
    }
};

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
                this.emit(item.eventName, data);
            } else {
                response.sendStatus(400);
            }
        }
    } catch (err) {
        response.sendStatus(500);
        throw err;
    }
};

TwitchWebSub.prototype.unsubscribe = async function(id) {
    try {
        this.logger.debug('Requesting WebSub unsubscription with id: ' + id);
        if (this.subscribersMap[id]) {
            let item = this.subscribersMap[id];
            await request({
                url: API_BASE_URL + '/webhooks/hub',
                method: 'POST',
                form: {
                    'hub.callback':
                        this.options.callbackUrl + '?item.id=' + item.id,
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
        this.logger.info('TwitchWebSub destroyed.');
    } catch (err) {
        throw err;
    }
};

util.inherits(TwitchWebSub, eventemitter);
module.exports = TwitchWebSub;
