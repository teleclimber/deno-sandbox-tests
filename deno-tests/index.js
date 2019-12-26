const local = require('./local.js');
const remote = require('./remote.js');
const read = require('./read.js');
const net = require('./net.js');

module.exports = [].concat(local, remote, read, net);