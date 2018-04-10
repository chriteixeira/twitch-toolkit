'use strict';

const chai = require('chai');
const expect = chai.expect; // eslint-disable-line no-unused-vars

const twichApi = require('../src/twitchApi');

let config = {
    client_id: 'ezjpxifjp3eafj2mxaqsxxs1vho04e',
    client_secret: 'cej7vkttb1edsvn1yjk41pdokr5f53'
};

let api = new twichApi(config);

describe('twichApi.getGames', () => {
    it('should return one game for single parameter', async () => {
        let result = await api.getGames({ name: 'Overwatch' });
        expect(result).to.be.a('array');
        expect(result).to.not.be.empty;
        expect(result[0]).to.be.a('object');
    });
});

describe('twichApi.getStreams', () => {
    it('should return an array without parameters', async () => {
        let result = await api.getStreams();
        expect(result).to.be.a('array');
        expect(result).to.not.be.empty;
        expect(result[0]).to.be.a('object');
    });
    it('should return an array with parameters', async () => {
        let result = await api.getStreams();
        expect(result).to.be.a('array');
        expect(result).to.not.be.empty;
        expect(result[0]).to.be.a('object');
    });
});

describe('twichApi.getUsers', () => {
    it('should return an array with parameters', async () => {
        let result = await api.getUsers({ login: 'shad_ra' });
        expect(result).to.be.a('array');
        expect(result).to.not.be.empty;
        expect(result[0]).to.be.a('object');
        expect(result[0].login).to.be.equal('shad_ra');
    });
});


describe('twichApi.getUsersFollows', () => {
    it('should return an array with parameters', async () => {
        let result = await api.getUsersFollows({ to_id: 21800871 });
        expect(result).to.be.a('array');
        expect(result).to.not.be.empty;
        expect(result[0]).to.be.a('object');
        expect(result[0].to_id).to.be.equal('21800871');
    });
});
