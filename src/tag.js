var Q = require('q'),
    _ = require('lodash'),
    github = require('./githubApi'),
    config = require('./config'),
    cache = require('./cache');

var Tag = function(repoName, details, branch){
    this.repoName = repoName;
    this.name = details.name;
    this.details = details;
    this.branch = _.cloneDeep(branch);
    this.branch.commit = {};
};

Tag.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    var cacheKey = 'tagData_' + this.repoName + '_' + this.name;

    var cacheData = cache.get(cacheKey)[cacheKey];

    if(cacheData)
    {
        that.data = cacheData;
        deferred.resolve();
    }
    else
    {
        github.gitdata.getCommit({
            user: config.github.orgName,
            repo: that.repoName,
            sha: that.details.commit.sha
        }, function(err, res){
            that.branch.commit = res;
            res = that.branch;
            res.name = that.name;
            that.data = res;
            cache.set(cacheKey, res);
            deferred.resolve(res);
        });    
    }

    return deferred.promise;
};

Tag.prototype.isRelease = function(){
    var that = this;

    var namePart = this.name.match(/[0-9.]+/);
    namePart = (namePart && namePart.length > 0 ? namePart[0] : '');
    var dotCount = namePart.split(".")
        .map(function(val){ return + val + 1 }).length;
    
    if(dotCount > 1)
    {
        return true;
    }

    return false;
};

Tag.prototype.getReleaseValue = function(){
    var namePart = this.name.match(/[0-9.]+/);
    namePart = (namePart && namePart.length > 0 ? namePart[0] : '');
    var arr = namePart.split(".");
    
    for(var i = 0; i < 4; i++)
    {
        if(parseInt(arr[i]) > 0)
        {
            arr[i] = parseInt(arr[i]);
        }
        else
        {
            arr[i] = 0;
        }
    }

    var val = (arr[0] * 1000000000)
        + (arr[1] * 1000000)
        + (arr[2] * 1000)
        + (arr[3] * 1);
    return val;
};

module.exports = Tag;