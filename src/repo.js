var Q = require('q'),
    _ = require('lodash'),
    insight = require('./insight'),
    github = require("./githubApi"),
    config = require("./config"),
    PullRequest = require("./pullRequest"),
    Branch = require('./branch'),
    Diff = require('./diff'),
    inspector = require('./inspector'),
    StoryParser = require('./storyParser'),
    cache = require('./cache');

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

    var promises = [];

    var pullRequestsData = this.getPullRequestsCache();
    if(pullRequestsData)
    {
        console.log("CACHE HIT -- loadPullRequests");
        _.forEach(pullRequestsData, function(pullRequestData){
            var promise = that.createPullRequest(pullRequestData);
            promises.push(promise);
        });

        Q.all(promises).then(function(){
            deferred.resolve();
        });
    }
    else
    {
        github.pullRequests.getAll({
            user: config.github.orgName,
            repo: that.name
        }, function(err, res){
            that.setPullRequestsCache(pullRequestsData);

            _.forEach(res, function(pullRequestData){
                //console.log('pullRequestData', pullRequestData);
                var promise = that.createPullRequest(pullRequestData).then(function(){ console.log('createPullRequest resolved'); });
                promises.push(promise);
            });

            Q.all(promises).then(function(){
                deferred.resolve();
            });
        });
    }

    return deferred.promise;
};

Repo.prototype.createPullRequest = function(prData){
    var pr = new PullRequest(prData);
    var promise = pr.load().then(function(){
        //console.log("pull request LOADED!");
    });
    this.pullRequests.push(pr);  

    return promise;
};

Repo.prototype.getPullRequestsCache = function(){
    var key = this.getPullRequestsCacheKey();

    var result = cache.get(key);
    return result[key];
};  

Repo.prototype.setPullRequestsCache = function(pullRequestData){
    var key = this.getPullRequestsCacheKey();

    cache.set(key, pullRequestData);
};

Repo.prototype.getPullRequestsCacheKey = function(){
    return 'pullRequests_' + this.name;
};


Repo.prototype.loadBranches = function(){
    var deferred = Q.defer();
    var that = this;

    var promises = [];

    console.log("loadBranches " + that.name);

    var cachedData = this.getBranchesCache();
    if(cachedData)
    {
        _.map(cachedData, function(branchDetails){
            var promise = that.createBranch(branchDetails);
            promises.push(promise);;
        });

        Q.all(promises).then(function(){
            console.log("PROMISES RESOLVED DAMN IT!")
            deferred.resolve();
        });
    }
    else
    {
        github.repos.getBranches({
            user: config.github.orgName,
            repo: that.name
        }, function(err, res){
            console.log("pre setBranchesCaches");
            that.setBranchesCache(res);

            _.map(res, function(branchDetails){
                var promise = that.createBranch(branchDetails);
                promise.then(function(){
                    console.log("individual branch resolved");
                });
                promises.push(promise);
            });

            Q.all(promises).then(function(){
                console.log("PROMISES RESOLVED DAMN IT!")
                deferred.resolve();
            });
        });
    }

    return deferred.promise;
};

Repo.prototype.createBranch = function(branchDetails){
    console.log('createBranch', branchDetails);
    var branch = new Branch(this.name, branchDetails);
    this.branches.push(branch);

    // Returns a promise
    var promise = branch.load();
    return promise;
};

Repo.prototype.getBranchesCache = function(){
    var key = this.getBranchesCacheKey();

    var result = cache.get(key);
    return result[key];
};  

Repo.prototype.setBranchesCache = function(branchesData){
    var key = this.getBranchesCacheKey();

    cache.set(key, branchesData);
};

Repo.prototype.getBranchesCacheKey = function(){
    return 'repoBranches_' + this.name;
};

Repo.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    // Load Pull Requests and Branches
    Q.allSettled([
        this.loadPullRequests().then(function(){ console.log("load pull requests resolved!") }),
        this.loadBranches().then(function(){ console.log('load Branches Resolved!'); })
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
    var that = this;
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
        this.pullRequests[i].diff = new Diff(this.name, pr.data.base.ref, pr.data.head.ref);
        promises.push(this.pullRequests[i].diff.load());
    }

    Q.allSettled(promises).then(function(){
        deferred.resolve();
    });

    /* setTimeout(function(){
        console.log('==============================================');
        console.log('**********************************************');
        console.log('==============================================');
        inspector(that.pullRequests[0].diff);
        console.log('==============================================');
        console.log('**********************************************');
        console.log('==============================================');
    }, 5000);  */

    return deferred.promise;
};

Repo.prototype.parsePivotalStories = function(){
    //console.log("called in");
    var storyIds = this.masterDiff.getStoryIds();
    var parser = new StoryParser();
    _.forEach(this.releaseBranches, function(branch){
        if(branch.diff)
        {
            var ids = branch.diff.getStoryIds();
            _.forEach(ids, function(id){
                storyIds[id] = id;
            });
        }
    });

    _.forEach(this.pullRequests, function(pr){
        //console.log("Calling pr.getStoryIds");
        var ids = pr.getStoryIds();
        _.forEach(ids, function(id){
            storyIds[id] = id;
        });
    });

    

    return storyIds;
};

module.exports = Repo;