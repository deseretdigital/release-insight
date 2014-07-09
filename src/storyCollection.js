var Q = require('q'),
    request = require('request'),
    pivotal = require('./pivotalApi'),
    Story = require('./story');

var StoryCollection = function(){
    this.stories = {};
};

StoryCollection.prototype.store = function(story){
    this.stories[story.getId().toString()] = story;
};

StoryCollection.prototype.retrieve = function(storyId){
    var that = this;
    var deferred = Q.defer();

    storyId = storyId.toString();

    if(typeof this.stories[storyId] != 'undefined')
    {
        console.log("Already found " + storyId);
        deferred.resolve(this.stories[storyId]);
    }
    else
    {
        console.log("Looking up " + storyId);
        var options = pivotal.getOptions();
        options.url += '/stories/' + storyId.toString();
        request(options, function(error, response, body){
            console.log("Found " + storyId);
            var story = new Story(body);
            that.stories[story.getId()] = story;
            deferred.resolve(story);
        });
    }

    return deferred.promise;
};


var collection = new StoryCollection();
module.exports = collection;