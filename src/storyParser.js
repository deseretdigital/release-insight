var _ = require('lodash');

var pattern = /\[\#(\d+)\]/g;

var StoryParser = function(){

};

StoryParser.prototype.parse = function(text){
    var storyIds = {};

    var ids = text.match(pattern);

    _.forEach(ids, function(id){
        id = id.replace(/[\#\[\]]/g, "");
        storyIds[id] = id;
    });

    return storyIds;
};

module.exports = StoryParser;