var Q = require('q'),
    _ = require('lodash'),
    github = require('./githubApi'),
    config = require('./config')
    StoryParser = require('./storyParser'),
    inspector = require('./inspector');

var Diff = function(repoName, baseName, headName){
    this.repoName = repoName;
    this.baseName = baseName;
    this.headName = headName;
};

Diff.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    github.repos.compareCommits({
        user: config.github.orgName,
        repo: this.repoName,
        base: this.baseName,
        head: this.headName
    }, function(err, res){
        console.log("diff err " + that.repoName + " " + that.baseName + " " + that.headName);
        inspector(err);
        console.log("diff res");
        inspector(res);
        that.data = res;
        deferred.resolve(res);
    });

    return deferred.promise;
};

Diff.prototype.getStoryIds = function(){
    var parser = new StoryParser();
    var storyIds = {};

    console.log("Commit Data?!");

    inspector(this.data);

    console.log('wut');

    _.forEach(this.data.commits, function(commitData){
        console.log(".");
        var ids = parser.parse(commitData.commit.message);

        _.forEach(ids, function(id){
            storyIds[id] = id;
        });
    });

    return storyIds;
};

module.exports = Diff;