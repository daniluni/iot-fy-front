
const {format} = require('timeago.js');
// const timeagoInstance = timeago();
const timeagoInstance = require('timeago.js');
const helpers = {};

helpers.timeago = (savedTimestamp) => {
    return timeagoInstance.format(savedTimestamp);
};

module.exports = helpers;
