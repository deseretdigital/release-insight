var _ = require('lodash');

var helpers = {
    foo: function () { return 'FOO!'; },
    bar: function () { return 'BAR!'; },
    inspect: function(context){
        inspector(context);
    },
    size: function(obj){
        return _.size(obj);
    }
};

module.exports = helpers;   