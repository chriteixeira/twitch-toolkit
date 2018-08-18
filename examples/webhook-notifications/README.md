# webhook-notifications

A simple express server to subscribe and receive Twitch's WebHook notifications.

What's in this example:

* Usage of the toolkit's API and WebHook module.
* Endpoints to receive WebHook validation (GET) and payloads (POST).
* Usage of the Twitch API to get the user id by its name.
* Usage of the WebHook to receive follow notifications.
* Usage of the WebHook to know if the channel when up or down.

## Running

To run the example, first you need to install the dependecies:
```shell
$ npm install
```

After the installation, just execute the example code:

```shell
$ CLIENT_ID=*** CHANNEL_NAME=*** node index.js
```

Make sure to add the proper values for CLIENT_ID and CHANNEL_NAME.