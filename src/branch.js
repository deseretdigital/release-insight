var Q = require('q'),
    _ = require('lodash'),
    github = require('./githubApi'),
    config = require('./config'),
    cache = require('./cache');

var Branch = function(repoName, details){
    this.repoName = repoName;
    this.name = details.name;
    this.details = details;
};

Branch.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    var cacheKey = 'branchData_' + this.repoName + '_' + this.name;

    var cacheData = cache.get(cacheKey)[cacheKey];

    if(cacheData)
    {
        that.data = cacheData;
        deferred.resolve();
    }
    else
    {
        github.repos.getBranch({
            user: config.github.orgName,
            repo: that.repoName,
            branch: that.name
        }, function(err, res){
            that.data = res;
            cache.set(cacheKey, res);
            deferred.resolve(res);
        });    
    }

    

    return deferred.promise;
};

Branch.prototype.isRelease = function(){
    var that = this;

    var dotCount = that.name.split(".")
        .map(function(val){ return +val + 1 }).length;
    
    if(dotCount > 1)
    {
        return true;
    }

    return false;
};

Branch.prototype.getReleaseValue = function(){
    var arr = this.name.split(".");
    
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

module.exports = Branch;