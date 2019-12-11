const local = require('./local.js');
const remote = require('./remote.js');

module.exports = [].concat(local, remote);
