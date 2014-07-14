var NodeCache = require('node-cache');

var cache = new NodeCache( { stdTTL: 60 * 10, checkperiod: 30 } );

module.exports = cache;