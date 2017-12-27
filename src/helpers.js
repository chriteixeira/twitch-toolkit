'use strict';

exports.getFirstWord = (string) => {
    if (string == null) throw new Error('string parameter is null.');
    if (string.indexOf(' ') === -1) {
        return string;
    } else {
        return string.substring(0, string.indexOf(' '));
    }
};

exports.replaceAllOccurrences = (string, searchValue, newValue) => {
    if (string == null) throw new Error('string parameter is null.');
    if (searchValue == null) throw new Error('searchValue parameter is null.');
    if (newValue == null) throw new Error('newValue parameter is null.');
    return string.replace(new RegExp(searchValue, 'g'), newValue);
};

exports.iterateObject = (object, callback) => {
    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            callback(object[key], key);
        }
    }
};

exports.uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

exports.generateRandomKey = () => {
    return (Math.random().toString(36) + '00000000000000000').slice(2, 8 + 2);
};