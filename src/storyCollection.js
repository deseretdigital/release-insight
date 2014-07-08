var Q = require('q'),
    request = require('request'),
    pivotal = require('./pivotalApi'),
    Story = require('./story');

var StoryCollection = function(){
    this.stories = {};
};

StoryCollection.prototype.store = function(story){
    this.stories[story.getId()] = story;
};

StoryCollection.prototype.retrieve = function(storyId){
    var deferred = Q.defer();

    if(typeof this.stories[storyId] != 'undefined')
    {
        deferred.resolve(this.stories[storyId]);
    }
    else
    {
        var options = pivotal.getOptions();
        options.url += '/stories/' + storyId.toString();
        request(options, function(error, response, body){
            var story = new Story(response);
            this.stories[story.getId()] = story;
            deferred.resolve(story);
        });
    }

    return deferred.promise;
};


var collection = new StoryCollection();
module.exports = collection;