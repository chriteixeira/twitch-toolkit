'use strict';

const chai = require('chai');
const expect = chai.expect; // eslint-disable-line no-unused-vars

const twichApi = require('../src/twitchApi');

let config = {
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET
};

let api = new twichApi(config);

describe('twichApi.getAuthToken', () => {
    it('should return a token for authentication', function() {
        api.getAccessToken().then(result => {
            expect(result).to.be.a('string');
        });
    });
});

describe('twichApi.validateAccessToken', function() {
    it('should accept a valid token', function() {
        let token = process.env.TWITCH_CLIENT_PASSWORD.substring(6);
        return api.validateAccessToken(token).then(result => {
            expect(result).to.be.a('object');
            expect(result.login).to.be.equal(
                process.env.TWITCH_CLIENT_USERNAME
            );
        });
    });
});

describe('twichApi.getGames', function() {
    it('should return one game for single parameter', function() {
        return api.getGames({ name: 'Overwatch' }).then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
        });
    });
});

describe('twichApi.getStreams', function() {
    it('should return an array without parameters', function() {
        return api.getStreams().then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
        });
    });
    it('should return an array with parameters', function() {
        return api.getStreams().then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
        });
    });
});

describe('twichApi.getStreamsMetadata', function() {
    it('should return the stream metadata', function() {
        return api.getStreamsMetadata({ login: 'shad_ra' }).then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
            expect(result[0].user_id).to.be.equal('37402112');
        });
    });
});

describe('twichApi.getUsers', function() {
    it('should return an array with parameters', function() {
        return api.getUsers({ login: 'shad_ra' }).then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
            expect(result[0].login).to.be.equal('shad_ra');
        });
    });
});

describe('twichApi.getUsersFollows', function() {
    it('should return an array with parameters', function() {
        return api.getUsersFollows({ to_id: 21800871 }).then(result => {
            expect(result).to.be.a('array');
            expect(result).to.not.be.empty;
            expect(result[0]).to.be.a('object');
            expect(result[0].to_id).to.be.equal('21800871');
        });
    });
});
