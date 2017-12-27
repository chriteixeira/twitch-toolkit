const winston = require('winston');


exports.create = (level) => {
    let logger = winston.createLogger({
        level: level,
        format: winston.format.json(),
        transports: [
            new winston.transports.Console(),
        ],
    });
    return logger;
};

