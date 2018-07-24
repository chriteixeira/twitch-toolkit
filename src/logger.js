const winston = require('winston');

let logger;

exports.getLogger = () => {
    if (!logger) {
        logger = winston.createLogger({
            level: process.env.LOG_LEVEL,
            format: winston.format.json(),
            transports: [new winston.transports.Console()]
        });
    }
    return logger;
};
