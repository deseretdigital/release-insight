var Q = require('q'),
    _ = require('lodash'),
    insight = require('./insight'),
    github = require("./githubApi"),
    config = require("./config"),
    PullRequest = require("./pullRequest"),
    Branch = require('./branch'),
    Diff = require('./diff'),
    inspector = require('./inspector');

var releaseSortAlgo = function(a, b)
{
    if(a.getReleaseValue() < b.getReleaseValue())
    {
        return -1;
    }
    else if(a.getReleaseValue() > b.getReleaseValue())
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

var Repo = function(name){
    this.name = name;
    this.pullRequests = [];
    this.branches = [];
    this.releaseBranches = [];
};

Repo.prototype.getName = function(){
    return this.name;
};

Repo.prototype.loadPullRequests = function(){
    var deferred = Q.defer();
    var that = this;

    github.pullRequests.getAll({
        user: config.github.orgName,
        repo: that.name
    }, function(err, res){
        //console.log("pull requests", res);

        _.forEach(res, function(pullRequestData){
            var pr = new PullRequest(pullRequestData);
            that.pullRequests.push(pr);            
        });

        deferred.resolve(res); 
    });

    return deferred.promise;
};


Repo.prototype.loadBranches = function(){
    var deferred = Q.defer();
    var that = this;

    github.repos.getBranches({
        user: config.github.orgName,
        repo: that.name
    }, function(err, res){
        Q.all(_.map(res, function(branchDetails){
            var branch = new Branch(that.name, branchDetails);
            that.branches.push(branch);

            // Returns a promise
            return branch.load();
        }))
        .then(function(){
            deferred.resolve(res);
        });
    });

    return deferred.promise;
};

Repo.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    // Load Pull Requests and Branches
    Q.allSettled([
        this.loadPullRequests(),
        this.loadBranches()
    ]).then(function(){
        console.log("pre sort");
        // Sort through branch data
        that.sortReleaseBranches();
        
        console.log("post sort");
        // Get Diff Data
        return that.loadDiffs();
    }).then(function(){
        console.log("repo resolved " + that.name);
        deferred.resolve(that);
    });

    return deferred.promise;
}

Repo.prototype.sortReleaseBranches = function(){
    var that = this;

    _.forEach(this.branches, function(branch){
        if(branch.isRelease())
        {
            that.releaseBranches.push(branch);
        }
    });

    // Sort and reverse
    that.releaseBranches = that.releaseBranches.sort(releaseSortAlgo).reverse();
};

Repo.prototype.loadDiffs = function(){
    var deferred = Q.defer();

    var promises = [];

    console.log("loadDiffs called")

    // Load Master to latest release diff
    this.masterDiff = new Diff(this.name, this.releaseBranches[0].name, 'master');
    promises.push(this.masterDiff.load());

    // Loop through all but the last release branch
    for(var i = 0; i < this.releaseBranches.length - 1; i++)
    {
        var currentBranch = this.releaseBranches[i];
        var prevBranch = this.releaseBranches[i + 1];

        currentBranch.diff = new Diff(this.name, prevBranch.name, currentBranch.name);
        promises.push(currentBranch.diff.load());
    }

    // Loop through all the pull requests
    for(var i = 0; i < this.pullRequests.length; i++)
    {
        var pr = this.pullRequests[i];
        console.log("Getting Pull Request ", pr);
        this.pullRequests[i].diff = new Diff(this.name, pr.data.base.ref, pr.data.head.ref);
        promises.push(this.pullRequests[i].diff.load());
    }

    Q.allSettled(promises).then(function(){
        deferred.resolve();
    });

    return deferred.promise;
};

Repo.prototype.parsePivotalStories = function(){
    var storyIds = this.masterDiff.getStoryIds();
    _.forEach(this.releaseBranches, function(branch){
        if(branch.diff)
        {
            var ids = branch.diff.getStoryIds();
            _.forEach(ids, function(id){
                storyIds[id] = id;
            });
        }
    });

    return storyIds;
};

module.exports = Repo;