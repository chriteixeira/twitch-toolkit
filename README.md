# twitch-toolkit
[![License](http://img.shields.io/:license-mit-blue.svg?style=flat)](http://doge.mit-license.org)
[![Build Status](https://travis-ci.org/chriteixeira/twitch-toolkit.svg?branch=master)](https://travis-ci.org/chriteixeira/twitch-toolkit)

A set of tools to integrate with Twitch API, Twitch Chat and Twitch WebHooks.

[![NPM](https://nodei.co/npm/twitch-toolkit.png?downloads=true&downloadRank=true)](https://nodei.co/npm/twitch-toolkit/)

## Installation

Using npm:
```shell
$ npm i --save twitch-toolkit
```

## Usage

The library is composed by three modules:
* **api**: Provides access to the Helix API.
* **chat**: Provides access to the chat events through [tmi.js](https://github.com/tmijs) .
* **websub**: Provides access to the websubs topics and events.

You can use the toolkit just by creating a new instance with the configuration object:

```javascript
const Twitch = require('twitch-toolkit');

let twitch = new Twitch(config);
```

The config object is described below:

| Attr          | Type                |  Description    |
| ------------- | ------------------- | --------------- |
| logger        | logger object       | The logger instance.    |
| debug         | Boolean             | A flag to enable the debug mode. `Default: false`    |
| client_id     | String              | The Twitch.tv client ID to be used to access the services.    |
| client_secret | String              | The Twitch.tv client secret to be used to use the private services.    |
| chatOptions   | Object              | The chat configuration object    |
| chatOptions.reconnect | Boolean |  A flag to enable the auto-reconnect mode. `Default: false`    |
| chatOptions.ignoreSelf | String | A flag to ignore the bots own messages. `Default: false`    |
| chatOptions.username | String | The bot's username.    |
| chatOptions.password | String | The bot's OAuth Token. You can get it at http://twitchapps.com/tmi/   |
| chatOptions.channels | Array[String]       | The list os channels the bot will join and listen. |
| chatOptions.chatCommands | Object | The object with the chatCommands, described below   |
| chatOptions.whisperCommands | Object | The object with the whisperCommands, described below   |
| chatOptions.wordTriggers | Object | The object with the wordTriggers, described below   |

### API

The API module will be created with the toolkit object and can be acessed by its name:
```javascript
let twitchAPI = twitch.api;
```

### Chat

The chat module will be created with the toolkit object and can be acessed by its name:
```javascript
let twitchChat = twitch.chat;
```
The module will be ready to use but the user won't join the chat until you explicitly connect to it:

```javascript
twitch.connect();
```

#### Chat Commands
#### Whisper Commands
#### Word Triggers

### WebSub
