'use strict';

exports.getFirstWord = (string) => {
    if (string.indexOf(' ') >= 0) {
        return string;
    } else {
        return string.substring(0, string.indexOf(' '));
    }
};

exports.replaceAllOccurrences = (string, searchValue, newValue) => {
    return string.replace(new RegExp(searchValue, 'g'), newValue);
};
