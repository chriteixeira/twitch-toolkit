'use strict';
const { API, WebHook } = require('twitch-toolkit');

const express = require('express');
const bodyParser = require('body-parser');
const ngrok = require('ngrok');

const port = process.env.PORT || 3000;
const app = express();

//Add the body parser middleware
app.use(bodyParser.json());

//Connect to ngrok to create a external url to the local server
ngrok
    .connect(port)
    .then(externalUrl => {
        console.log('Connected to ngrok at ' + externalUrl);
        startServer(externalUrl);
    })
    .catch(err => {
        throw err;
    });

async function startServer(externalUrl) {
    try {
        //Create the Twitch Webhook object
        let webHook = new WebHook({
            clientId: process.env.CLIENT_ID,
            callbackUrl: externalUrl + '/webhook'
        });

        //Create the twitch API object
        let api = new API({
            clientId: process.env.CLIENT_ID
        });

        //Get the user id from the username
        let users = await api.getUsers({
            login: process.env.CHANNEL_NAME
        });
        console.log(
            'userID for login ' +
                process.env.CHANNEL_NAME +
                ' is ' +
                users[0].id
        );

        //Create the get and post routes to the /webhook path
        app.get('/webhook', function(req, res) {
            console.log('Receiving a GET request on /webhook');
            let result = webHook.handleRequest('GET', req.headers, req.query);
            res.status(result.status).send(result.data);
        });
        app.post('/webhook', function(req, res) {
            console.log('Receiving a POST request on /webhook');
            let result = webHook.handleRequest(
                'POST',
                req.headers,
                req.query,
                req.body
            );
            res.sendStatus(result.status);
        });

        //Add stream Up/Down event listener.
        webHook.on('stream_up_down', function(data) {
            if (data.length !== 0) {
                console.log('Stream is up!');
            } else {
                console.log('Stream just went down!');
            }
        });

        //Add user follow event listener.
        webHook.on('user_follows', function(data) {
            for (let i in data) {
                console.log('New Follower with id ' + data[i]['from_id']);
            }
        });

        //Subscribe to the topics
        webHook.topicUserFollowsSubscribe(null, users[0].id);
        webHook.topicStreamUpDownSubscribe(users[0].id);

        app.listen(port, () => console.log('App listening on port ' + port));
    } catch (err) {
        console.log(err);
    }
}
