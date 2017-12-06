'use strict';

const request = require('request-promise');

/**
 * Twitch API
 * @constructor
 * @param {object} config The configuration object to access the API.
 * @param {string} config.client_id The client_id to be used to access the API.
 * @param {string} config.client_secret The secret to be used to access the API that requires login. If this is not provided, the restricted methods will thrown an error.
 */
function TwitchApi(config) {
    this.config = config || {};
    this.accessToken = null;
}

TwitchApi.prototype.auth = async function () {
    try {
        var response = await request({
            url: 'https://api.twitch.tv/kraken/oauth2/token',
            method: 'POST',
            form: {
                client_id: this.config.client_id,
                client_secret: this.config.client_secret,
                grant_type: 'client_credentials',
                scope: 'user:edit user:read:email',
            },
            json: true
        });

        this.accessToken = response.access_token;

    } catch (err) {
        throw err;
    }
};

/**
 * Gets a Twitch game information by game ID or name. For a query to be valid, name and/or id must be specified.
 * This method requires no authentication.
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-games
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-games
 */
TwitchApi.prototype.getGames = async function (parameters) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/games', parameters);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information about active streams. Streams are returned sorted by number of current viewers, in descending order. Across multiple pages of results, there may be duplicate or missing streams, as viewers join and leave streams.
 * This method requires no authentication.
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams
 */
TwitchApi.prototype.getStreams = async function (options) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/streams', options);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets metadata information about active streams playing Overwatch or Hearthstone. Streams are sorted by number of current viewers, in descending order. Across multiple pages of results, there may be duplicate or missing streams, as viewers join and leave streams.
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams-metadata
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-streams-metadata
 */
TwitchApi.prototype.getStreamsMetadata = async function (options) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/streams/metadata', options);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information about one or more specified Twitch users. Users are identified by optional user IDs and/or login name. If neither a user ID nor a login name is specified, the user is looked up by Bearer token.
 * 
 * @todo add optional scope
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users
 */
TwitchApi.prototype.getUsers = async function (options) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/users', options);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets information on follow relationships between two Twitch users. Information returned is sorted in order, most recent follow first. This can return information like "who is lirik following," "who is following lirik,” or “is user X following user Y.”
 * This method requires no authentication.
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users-follows
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-users-follows
 */
TwitchApi.prototype.getUsersFollows = async function (options) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/users/follows', options);
    } catch (err) {
        throw err;
    }
};

/**
 * Gets video information by video ID (one or more), user ID (one only), or game ID (one only).
 * This method requires no authentication.
 * 
 * @param {object} parameters The parameters to the api call. The parameter object is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 */
TwitchApi.prototype.getVideos = async function (options) {
    try {
        return await performGetRequest(this, 'https://api.twitch.tv/helix/videos', options);
    } catch (err) {
        throw err;
    }
};

/**
 * Updates the description of the authenticated user.
 * This method requires authentication.
 * 
 * @param {string} description The description to be added to the channel.
 * @returns {Promise<Object[]>} The data object in the API response. The response is defined in the Twitch documentation: https://dev.twitch.tv/docs/api/reference#get-videos
 */
TwitchApi.prototype.updateUser = async function (description) {
    try {
        return await performPutRequest(this, 'https://api.twitch.tv/helix/users', { description });
    } catch (err) {
        throw err;
    }
};


/**
 * 
 * @param {object} api The API object.
 * @param {string} url  The request URL.
 * @param {object} qs The query string object with the parameters.
 */
async function performGetRequest(api, url, qs, requireAuth) {
    try {
        let headers = {
            'Client-ID': api.config.client_id
        };

        await validePeformAuth(requireAuth, api, headers);

        var response = await request({
            url: url,
            method: 'GET',
            headers: headers,
            qs: qs,
            json: true
        });

        if (!response || !response.data) {
            return [];
        } else {
            return response.data;
        }
    } catch (err) {
        throw err;
    }
}

async function performPutRequest(api, url, body) {
    try {
        let headers = {
            'Client-ID': api.config.client_id,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        await validePeformAuth(true, api, headers);

        var response = await request({
            url: url,
            method: 'PUT',
            headers: headers,
            body: body,
            json: true
        });

        if (response.data && response.data.length > 0) {
            return null;
        } else {
            return response;
        }
    } catch (err) {
        throw err;
    }
}

async function validePeformAuth(requireAuth, api, headers) {
    try {
        if (requireAuth) {
            if (!api.config.isAuthenticated) {
                await api.auth();
            }
            headers['Authorization'] = 'Bearer ' + api.accessToken;
        }
    } catch (err) {
        throw err;
    }
}

module.exports = TwitchApi;