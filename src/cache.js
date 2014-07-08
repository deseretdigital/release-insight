var NodeCache = require('node-cache');

var cache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );

exports = cache;