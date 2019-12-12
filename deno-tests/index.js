const local = require('./local.js');
const remote = require('./remote.js');
const read = require('./read.js');

module.exports = [].concat(local, remote, read);