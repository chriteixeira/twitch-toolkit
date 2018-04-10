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
const twitch = require('twitch-toolkit');

var twitch = new Twitch(config);
```

The config object is described below:

| Attr          | Type                |  Description    |
| ------------- | ------------------- | --------------- |
| logger        | object            | The logger instance.    |
| debug         | bool             | A flag to enable the debug mode. `Default: false`    |
| client_id     | string              | The Twitch.tv client ID to be used to access the services.    |
| client_secret | string              | The Twitch.tv client secret to be used to use the private services.    |
| chatOptions   | object              | The chat configuration object    |
| chatOptions.reconnect | bool |  A flag to enable the auto-reconnect mode. `Default: false`    |
| chatOptions.ignoreSelf | bool | A flag to ignore the bots own messages. `Default: false`    |
| chatOptions.username | string | The bot's username.    |
| chatOptions.password | string | The bot's OAuth Token. You can get it at http://twitchapps.com/tmi/   |
| chatOptions.channels | array[string]       | The list os channels the bot will join and listen. |
| chatOptions.chatCommands | object | The object with the chatCommands, described below   |
| chatOptions.whisperCommands | object | The object with the whisperCommands, described below   |
| chatOptions.wordTriggers | object | The object with the wordTriggers, described below   |

### API

The API module will be created with the toolkit object and can be acessed by its name:
```javascript
var twitchAPI = twitch.api;
```

### Chat

The chat module will be created with the toolkit new instance but, the user will only join and list to the chat when connect is executed: 

```javascript
var twitchChat = twitch.chat;

twitch.connect();
```

After that, you'll be able to listen to channel and chat events. You can also disconnect from the chat, if you wish:
```javascript
twitch.disconnect
```

#### Chat Commands
#### Whisper Commands
#### Word Triggers

### WebSub
