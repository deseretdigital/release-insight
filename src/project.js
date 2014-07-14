var _ = require('lodash'),
    Q = require('q'),
    insight = require('./insight'),
    Repo = require('./repo'),
    config = require('./config'),
    moment = require('moment'),
    pivotal = require('./pivotalApi'),
    request = require('request'),
    Story = require('./story'),
    StoryCollection = require('./storyCollection'),
    util = require("util"),
    inspector = require('./inspector'),
    cache = require('./cache');
    

var Project = function(data){
    var that = this;

    // Save a copy of config data here
    this.config = data;

    // Init
    this.repos = [];
    this.storyIds = [];
    this.stories = [];

    _.forEach(data, function(val, key){
        that[key] = val;
    });
};

Project.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    var promises = [];

    _.forEach(this.repoNames, function(name){
        console.log("promise repo " + name);
        var repo = new Repo(name);
        that.repos.push(repo);
        var promise = repo.load();
        promises.push(promise);
    });

    promises.push(this.preloadPivotalStories());

    console.log("first set of promises", promises);

    Q.all(promises).then(function(){
        that.parseForPivotalStories();
        return that.loadPivotalStoryData();
    }).then(function(){
        deferred.resolve();
    });

    return deferred.promise;
}

Project.prototype.preloadPivotalStories = function(){
    var deferred = Q.defer();
    var promises = [];
    var that = this;

    _.forEach(this.pivotalProjectIds, function(projectId){
        var promise = that.preloadPivotalProjectStories(projectId);
        promises.push(promise);
    });      

    console.log("two promises", promises);

    Q.all(promises).then(function(){
        console.log("Final pivotal stories resolve");
        deferred.resolve();
    });

    return deferred.promise;
};

Project.prototype.preloadPivotalProjectStories = function(projectId)
{
    var deferred = Q.defer();

    // Cache results
    var cacheKey = 'preload_stories_' + projectId.toString();
    var cacheResult = cache.get(cacheKey);
    if(cacheResult[cacheKey])
    {
        console.log("PRELOAD CACHE FOUND FOR " + projectId);
        deferred.resolve();
    }
    else
    {
        var timeLimit = moment().subtract('days', 30).valueOf(); // Get in milliseconds

        var options = pivotal.getOptions();
        options.url += '/projects/' + projectId + '/stories';
        options.qs = {
            date_format: 'millis',
            limit: 500,
            updated_after: timeLimit.toString()
        };

        request(options, function(error, response, body){
            //console.log("body", body);
            _.forEach(body, function(storyData){

                //console.log("storyData", storyData);
                var story = new Story(storyData);
                story.preload = true;
                StoryCollection.store(story);
            });

            console.log("resolved!");
            cache.set(cacheKey, 1);
            deferred.resolve();
        });
    }

    return deferred.promise;
};

Project.prototype.parseForPivotalStories = function(){
    var storyIds = {};
    var that = this;
    _.forEach(this.repos, function(repo){
        console.log("Parse for pivotal stories " + repo.name);
        var ids = repo.parsePivotalStories();

        _.forEach(ids, function(id){
            storyIds[id] = id;
        });
    });

    this.storyIds = storyIds;
};

Project.prototype.loadPivotalStoryData = function()
{
    var deferred = Q.defer();
    var promises = [];
    var that = this;

    _.forEach(this.storyIds, function(storyId){
        var storyPromise = StoryCollection.retrieve(storyId);
        var promise = storyPromise.then(function(story){
            //console.log("Story resolved " + story.getId());
            that.stories.push(story);
            return story;
        });

        promises.push(promise);
    });

    Q.all(promises).then(function(){
        //console.log("Found all stories woohoo!", that.stories);
        deferred.resolve(that.stories);
    });

    return deferred.promise;
}

module.exports = Project;