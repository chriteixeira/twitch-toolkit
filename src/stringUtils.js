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
