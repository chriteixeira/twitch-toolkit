'use strict';

const helpers = require('./helpers');
const request = require('request-promise');

//var textVars = ['@user'];

function TwitchApi(config) {

    this.config = config || {};
    this.config.options = config.option || {};
    this.config.commands = config.commands || {};
    this.config.text = config.text || {};
}

TwitchApi.prototype.connect = function () {
    let _this = this;
    
};

//TwitchChatEmmiter.prototype.addCommand = function
//TwitchChatEmmiter.prototype.addCommand = function

module.exports = TwitchApi;