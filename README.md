# twitch-toolkit
[![License](http://img.shields.io/:license-mit-blue.svg?style=flat)](http://doge.mit-license.org)
[![Build Status](https://travis-ci.org/chriteixeira/twitch-toolkit.svg?branch=master)](https://travis-ci.org/chriteixeira/twitch-toolkit)

A set of tools to integrate with Twitch API, Twitch Chat and Twitch WebHooks. 

[![NPM](https://nodei.co/npm/twitch-toolkit.png?downloads=true&downloadRank=true)](https://nodei.co/npm/twitch-toolkit/)

To start to use this module, check the [project documentation](https://chriteixeira.github.io/twitch-toolkit/0.0.9/). 

## Installation

Using npm:
```shell
$ npm i --save twitch-toolkit
```

## Usage

The library is composed by three independent modules:
* **API**: Provides access to the Helix API.
* **Chat**: Provides access to the chat events through [tmi.js](https://github.com/tmijs) .
* **PubSub**: Provides access to the Twitch PubSub.
* **WebHook**: Provides access to the WebHook topics and events.

The toolkit exports each module and you can access it like this:

```javascript
const {API, Chat, WebHook} = require('twitch-toolkit');
```

Every module must be instanced with the required configs as described in the next sessions.

### API

The API module must be instanced with the following config object:

| Name      | Type   |  Description          | 
| ------------------- |---------|-------------  |
| client_id           | string | The client_id to be used to access the API. This is required. |
| client_secret       | string | The secret to be used to access the API that requires login. If this is not provided, the restricted methods will thrown an error. |

Example:
```javascript
const { API } = require('twitch-toolkit');
const twitchAPI = new API({client_id: 'id-string', client_secret: 'secret-string'})
```

The API methods are described in the [TwitchApi documentation page](https://chriteixeira.github.io/twitch-toolkit/0.0.9/TwitchApi.html)

### Chat

The API module must be instanced with the config objects described in the [constructor documentation](https://chriteixeira.github.io/twitch-toolkit/0.0.9/TwitchChatEmitter.html#TwitchChatEmitter)

Example:
```javascript
const { Chat } = require('twitch-toolkit');
const twitchChat = new Chat(options)
```

To connected to the channels with the specified user, you'll need to call the connect function:

```javascript
twitch.connect()
```

After that, you'll be able to listen to channel and chat events. You can also disconnect from the chat, if you wish:

```javascript
twitch.disconnect()
```

The methods and events are described in the [TwitchChatEmitter documentation page](https://chriteixeira.github.io/twitch-toolkit/0.0.9/TwitchChatEmitter.html)

### PubSub

The Twitch PubSub implementation, as described in https://dev.twitch.tv/docs/pubsub/ .

The API module must be instanced with the following config object:

| Name      | Type   |  Description          | 
| ----------|--------- |----------------------  |
| logger         | object | The logger object. |
| authToken         | string | The Twitch with OAuth token. |
| reconnect         | string | Reconnect to Twitch PubSub when disconnected from server. Default: false |

Example:
```javascript
const { Chat, PubSub } = require('twitch-toolkit');
const twitchPubSub = new PubSub({ reconnect: true });

twitchPubSub.connect()
```

The methods and events are described in the [PubSub documentation page](https://chriteixeira.github.io/twitch-toolkit/0.0.9/TwitchPubSub.html)


### Webhooks

The Twitch Webhooks implementation, as described in https://dev.twitch.tv/docs/api/webhooks-guide/ .

The API module must be instanced with the following config object:

| Name      | Type   |  Description          | 
| ----------|--------- |----------------------  |
| client_id           | string | The client ID of the user to be passed to the Hub (un)subscribe requests. This is required. |
| callbackUrl         | string | The callback URL that will receive the Hub requests. These requests should be forwarded to the handleRequest method to properly handle these data. This is required. |
| logger         | object | The logger object. |

Example:
```javascript
const { WebHook } = require('twitch-toolkit');
const twitchWebHook = new WebHook({
            client_id: 'id-string',
            callbackUrl: 'http://domain/path/to/cbUrl'
        });
```

The Webhook/WebSub requires a public endpoint on the running server/application to receive the data from the hub. Without this, its impossible to make this work.

The methods and events are described in the [WebHook documentation page](https://chriteixeira.github.io/twitch-toolkit/0.0.9/TwitchWebHook.html)

## Tests

The module uses [Mocha](https://mochajs.org/) with [Chai](http://www.chaijs.com/) for unit tests and [Istanbul](https://istanbul.js.org/) for test coverage reports.

To run the mocha tests:

```shell
$ npm run test
```

To run tests in debug mode (--inspect-brk)

```shell
$ npm run test:debug
```

To run the tests with the coverage report:

```shell
$ npm run test:coverage
```

To properly run the tests, the following Environment Variables must be set:

| Var Name      |  Value          |
| ------------- |---------------- |
| TWITCH_CLIENT_ID | The Client-ID to be used to make the API calls. |
| TWITCH_CLIENT_SECRET | The Client Secret to be used to make the API calls. |
| TWITCH_CLIENT_USERNAME | The Username related to the Client-ID |
| TWITCH_CLIENT_PASSWORD | The OAUTH password. It can be generated [here](https://twitchapps.com/tmi/). |
| TWITCH_PUBSUB_CHANNEL_ID | The ID for the channel used in the PubSub tests. |
| TWITCH_PUBSUB_AUTH_TOKEN | The OAUTH token for the PubSub with the proper scopes. |

## License

Licensed under the [MIT](https://github.com/chriteixeira/twitch-toolkit/blob/master/LICENSE) License.
