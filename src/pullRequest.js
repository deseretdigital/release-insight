var Q = require('q'),
    github = require('./githubApi'),
    StoryParser = require('./storyParser'),
    _ = require('lodash'),
    config = require('./config'),
    cache = require('./cache');

var PullRequest = function(data){
    this.data = data;
    this.lastStatus = {
        state: 'no-ci',
        description: 'No status found yes, likely Travis Hasn\'t ran yet.',
        target_url: ''

    };
};

PullRequest.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    github.statuses.get({
        user: config.github.orgName,
        repo: this.data.head.repo.name,
        sha: this.data.head.sha
    }, function(err, res){
        //console.log('status get');
        //console.log(res);
        that.lastStatus = res[0];
        deferred.resolve(res);
    });

    return deferred.promise;
};

PullRequest.prototype.getStatusCacheKey = function(){

};

PullRequest.prototype.getStoryIds = function(){
    var ids = {};

    //console.log("Checking if diff");
    if(this.diff)
    {
        //console.log("getting stories from diff");
        ids = this.diff.getStoryIds();
    }

    var parser = new StoryParser();
    var titleIds = parser.parse(this.data.title);

    //console.log("parsed", titleIds);

    _.forEach(titleIds, function(id){
        //console.log(id);
        ids[id] = id;
    });

    //console.log("returning ids", ids);

    return ids;
};

module.exports = PullRequest;