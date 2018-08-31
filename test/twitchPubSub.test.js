const chai = require('chai');
const expect = chai.expect; // eslint-disable-line no-unused-vars

const twitchPubSub = require('../src/twitchPubSub');

describe('twitchPubSub.connect', () => {
    let websub;

    it('Should connect to the WebSub without error', function (done) {
        websub = new twitchPubSub({
            reconnect: true
        });
        websub.connect()
            .then(() => done())
            .catch(err => done(err));
    });

    describe('twitchPubSub.subscribe', () => {
        it('Should be able subscribe to bits topic', function (done) {
            websub.subscribe(['bits'], process.env.TWITCH_PUBSUB_CHANNEL_ID, process.env.TWITCH_PUBSUB_AUTH_TOKEN)
                .then(() => {
                    done();
                }).catch(err => done(err));

        });

        it('Should be able subscribe to subscription topic', function (done) {
            websub.subscribe(['subscription'], process.env.TWITCH_PUBSUB_CHANNEL_ID, process.env.TWITCH_PUBSUB_AUTH_TOKEN)
                .then(() => {
                    done();
                }).catch(err => done(err));

        });

        it('Should be able subscribe to commerce topic', function (done) {
            websub.subscribe(['commerce'], process.env.TWITCH_PUBSUB_CHANNEL_ID, process.env.TWITCH_PUBSUB_AUTH_TOKEN)
                .then(() => {
                    done();
                }).catch(err => done(err));

        });

        it('Should be able subscribe to whisper topic', function (done) {
            websub.subscribe(['whisper'], process.env.TWITCH_PUBSUB_CHANNEL_ID, process.env.TWITCH_PUBSUB_AUTH_TOKEN)
                .then(() => {
                    done();
                }).catch(err => done(err));

        });

        it('Should be able subscribe to all topics', function (done) {
            websub.subscribe(['bits', 'subscription', 'commerce', 'whisper'], process.env.TWITCH_PUBSUB_CHANNEL_ID, process.env.TWITCH_PUBSUB_AUTH_TOKEN)
                .then(() => {
                    done();
                }).catch(err => done(err));

        });
    });


    describe('twitchPubSub.disconnect', () => {
        it('Should disconnect from the WebSub without error', function (done) {
            websub.disconnect()
                .then(() => done())
                .catch(err => done(err));
        });
    });
});


//describe('twitchPubSub._onMessage', () => {});
describe('twitchPubSub._onMessage', () => {
    it('Should emit the bits event ', function (done) {
        let websub = new twitchPubSub({});
        let message = {
            'type': 'MESSAGE',
            'data': {
                'topic': 'channel-bits-events-v1.44322889',
                'message': {
                    'data': {
                        'user_name': 'dallasnchains',
                        'channel_name': 'dallas',
                        'user_id': '129454141',
                        'channel_id': '44322889',
                        'time': '2017-02-09T13:23:58.168Z',
                        'chat_message': 'cheer10000 New badge hype!',
                        'bits_used': 10000,
                        'total_bits_used': 25000,
                        'context': 'cheer',
                        'badge_entitlement': {
                            'new_version': 25000,
                            'previous_version': 10000
                        }
                    },
                    'version': '1.0',
                    'message_type': 'bits_event',
                    'message_id': '8145728a4-35f0-4cf7-9dc0-f2ef24de1eb6'
                }
            }
        };
        websub.on('bits.44322889', (data) => {
            if (JSON.stringify(message.data.message.data) === JSON.stringify(data)) {
                done();
            } else {
                done(new Error('Bits message doesnt match.'));
            }
        });

        websub._onMessage({
            data: JSON.stringify(message)
        });
    });

    it('Should emit the subscription event ', function (done) {
        let websub = new twitchPubSub({});
        let message = {
            'type': 'MESSAGE',
            'data': {
                'topic': 'channel-subscribe-events-v1.44322889',
                'message': {
                    'user_name': 'dallas',
                    'display_name': 'dallas',
                    'channel_name': 'twitch',
                    'user_id': '44322889',
                    'channel_id': '12826',
                    'time': '2015-12-19T16:39:57-08:00',
                    'sub_plan': 'Prime' / '1000' / '2000' / '3000',
                    'sub_plan_name': 'Channel Subscription (mr_woodchuck)',
                    'months': 9,
                    'context': 'sub' / 'resub',
                    'sub_message': {
                        'message': 'A Twitch baby is born! KappaHD',
                        'emotes': [{
                            'start': 23,
                            'end': 7,
                            'id': 2867
                        }]
                    }
                }
            }
        };
        websub.on('subscription.44322889', (data) => {
            if (JSON.stringify(message.data.message.data) === JSON.stringify(data)) {
                done();
            } else {
                done(new Error('Subscription message doesnt match.'));
            }
        });

        websub._onMessage({
            data: JSON.stringify(message)
        });
    });

    it('Should emit the commerce event ', function (done) {
        let websub = new twitchPubSub({});
        let message = {
            'type': 'MESSAGE',
            'data': {
                'topic': 'channel-commerce-events-v1.44322889',
                'message': {
                    'user_name': 'dallas',
                    'display_name': 'dallas',
                    'channel_name': 'twitch',
                    'user_id': '44322889',
                    'channel_id': '12826',
                    'time': '2015-12-19T16:39:57-08:00',
                    'item_image_url': 'https://...',
                    'item_description': 'This is a friendly description!',
                    'supports_channel': true / false,
                    'purchase_message': {
                        'message': 'A Twitch game is born! Kappa',
                        'emotes': [{
                            'start': 23,
                            'end': 7,
                            'id': 2867
                        }]
                    }
                }
            }
        };
        websub.on('commerce.44322889', (data) => {
            if (JSON.stringify(message.data.message.data) === JSON.stringify(data)) {
                done();
            } else {
                done(new Error('Commerce message doesnt match.'));
            }
        });

        websub._onMessage({
            data: JSON.stringify(message)
        });
    });

    it('Should emit the whisper event ', function (done) {
        let websub = new twitchPubSub({});
        let message = {
            'type': 'MESSAGE',
            'data': {
                'topic': 'whispers.44322889',
                'message': {
                    'type': 'whisper_received',
                    'data': {
                        'id': 41
                    },
                    'thread_id': '129454141_44322889',
                    'body': 'hello',
                    'sent_ts': 1479160009,
                    'from_id': 39141793,
                    'tags': {
                        'login': 'dallas',
                        'display_name': 'dallas',
                        'color': '#8A2BE2',
                        'emotes': [

                        ],
                        'badges': [{
                            'id': 'staff',
                            'version': '1'
                        }]
                    },
                    'recipient': {
                        'id': 129454141,
                        'username': 'dallasnchains',
                        'display_name': 'dallasnchains',
                        'color': '',
                        'badges': []
                    },
                    'nonce': '6GVBTfBXNj7d71BULYKjpiKapegDI1'
                },
                'data_object': {
                    'id': 41,
                    'thread_id': '129454141_44322889',
                    'body': 'hello',
                    'sent_ts': 1479160009,
                    'from_id': 44322889,
                    'tags': {
                        'login': 'dallas',
                        'display_name': 'dallas',
                        'color': '#8A2BE2',
                        'emotes': [],
                        'badges': [{
                            'id': 'staff',
                            'version': '1'
                        }]
                    },
                    'recipient': {
                        'id': 129454141,
                        'username': 'dallasnchains',
                        'display_name': 'dallasnchains',
                        'color': '',
                        'badges': []
                    },
                    'nonce': '6GVBTfBXNj7d71BULYKjpiKapegDI1'
                }
            }
        };
        websub.on('whisper.44322889', (data) => {
            if (JSON.stringify(message.data.message.data) === JSON.stringify(data)) {
                done();
            } else {
                done(new Error('Whisper message doesnt match.'));
            }
        });

        websub._onMessage({
            data: JSON.stringify(message)
        });
    });
});