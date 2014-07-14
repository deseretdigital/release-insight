var Q = require('q'),
    request = require('request'),
    pivotal = require('./pivotalApi'),
    Story = require('./story'),
    cache = require('./cache');

var StoryCollection = function(){
    
};

StoryCollection.prototype.store = function(story){
    if(!story.data.id)
    {
        return false;
    }

    var key = this.getCacheKey(story.getId());
    //console.log("storing " + story.getId(), story);
    return cache.set(key, story.data, 20 * 2);
};

StoryCollection.prototype.retrieve = function(storyId){
    var that = this;
    var deferred = Q.defer();
    var story = this.getFromCache(storyId);

    if(story)
    {
        //console.log("Already found " + storyId, story);
        deferred.resolve(story);
    }
    else
    {
        //console.log("Looking up " + storyId);
        var options = pivotal.getOptions();
        options.url += '/stories/' + storyId.toString();
        request(options, function(error, response, body){
            var story = null;
            if(!error){
                story = new Story(body);
                that.store(story);    
            }
            //console.log("Found " + storyId);
            
            deferred.resolve(story);
        });
    }

    return deferred.promise;
};

StoryCollection.prototype.delete = function(storyId)
{
    var key = this.getCacheKey(storyId);
    cache.del(key);
};

StoryCollection.prototype.getFromCache = function(storyId){
    var key = this.getCacheKey(storyId);
    var storyData = cache.get(key);
    var story = false;
    if(storyData[key]){
        story = new Story(storyData[key]);
    }
    //console.log("retrieving " + storyId, story);
    return story;
};

StoryCollection.prototype.getCacheKey = function(storyId){
    return 'story_' + storyId.toString();
};


var collection = new StoryCollection();
module.exports = collection;