const { Chat } = require('../../index');

let startDate = new Date();

let chat = new Chat({
    channels: ['#' + process.env.CHANNEL],
    username: process.env.USERNAME,
    password: process.env.PASSWORD,

    //The triggers with command and words of interest.
    triggers: [
        {
            //Discord command in chat. Will auto respond with a configured message
            name: 'discord',
            type: 'command',
            channel: process.env.CHANNEL,
            chatTrigger: true,
            responseText: 'Join our discord server at ***',
            minDelay: 10000
        },
        {
            //Uptime command. Will trigger an event to send the bot uptime in chat.
            name: 'uptime',
            type: 'command',
            channel: process.env.CHANNEL,
            chatTrigger: true,
            eventName: 'uptime_event'
        },
        {
            //Hello message. Will send a response when someone says hello.
            name: 'hello',
            type: 'word',
            channel: process.env.CHANNEL,
            chatTrigger: true,
            responseText: 'Hello, welcome to the chat!'
        }
    ],

    //The timed messages
    timedMessages: [
        {
            message:
                'Hello, do you like the stream? Dont forget to hit the follow button!',
            channel: process.env.CHANNEL,
            minDelay: 60,
            minChatMessages: 2
        },
        {
            message:
                'Hello. Visit our website at https://github.com/chriteixeira/twitch-toolkit',
            channel: process.env.CHANNEL,
            minDelay: 90
        }
    ]
});

chat.on('chat', function(channel, userstate, message) {
    console.log('New message from ' + userstate.username + ': ' + message);
});

chat.on('whisper', function(channel, userstate, message) {
    console.log('New whisper from ' + userstate.username + ': ' + message);
});

chat.on('uptime_event', function(channel, userstate, message) {
    console.log(
        'Uptime command used by ' +
            userstate.username +
            ' with message: ' +
            message
    );
    chat.say(
        channel,
        '@' +
            userstate.username +
            ' Bot is running for ' +
            (new Date().getTime() - startDate.getTime()) / 1000 +
            ' seconds!'
    );
});

console.log('Connecting to chat...');
chat.connect();
console.log('Connected.');

//Termination events
process.on('SIGINT', destroy.bind(this));
process.on('SIGUSR1', destroy.bind(this));
process.on('SIGUSR2', destroy.bind(this));

async function destroy() {
    console.log('Disconnecting chat...');
    await chat.disconnect();
    console.log('Disconnected.');
    process.exit();
}
