var Q = require('q'),
    _ = require('lodash'),
    github = require('./githubApi'),
    config = require('./config')
    StoryParser = require('./storyParser'),
    inspector = require('./inspector'),
    cache = require('./cache'),
    moment = require('moment');

var Diff = function(repoName, baseName, headName){
    this.repoName = repoName;
    this.baseName = baseName;
    this.headName = headName;
};

Diff.prototype.load = function(){
    var deferred = Q.defer();
    var that = this;

    var data = this.getCache();

    if(_.size(data) > 1)
    {
        //console.log("CACHE HIT!!!");
        that.data = data;
        deferred.resolve(data);
    }
    else
    {
        github.repos.compareCommits({
            user: config.github.orgName,
            repo: this.repoName,
            base: this.baseName,
            head: this.headName
        }, function(err, res){
            if(err)
            {
                console.log("diff err " + that.repoName + " " + that.baseName + " " + that.headName, err);    
            }
            if(res)
            {
                //console.log("diff res " + that.repoName + " " + that.baseName + " " + that.headName);
            }
            
            that.data = res;
            that.setCache(res);
            deferred.resolve(res);
        });
    }

    return deferred.promise;
};

Diff.prototype.getStoryIds = function(){
    var parser = new StoryParser();
    var storyIds = {};

    _.forEach(this.data.commits, function(commitData){
        var ids = parser.parse(commitData.commit.message);

        _.forEach(ids, function(id){
            storyIds[id] = id;
        });
    });

    return storyIds;
};

Diff.prototype.formatDiff = function (){
    var obj = {
        status: this.data.status,
        aheadBy: this.data.ahead_by,
        behindBy: this.data.behind_by,
        totalCommits: this.data.total_commits,
        additions: 0,
        deletions: 0,
        changes: 0,
        files: [],
        authors: [],
        commits: []
    };

    _.forEach(this.data.files, function(file){
        obj.files.push(file.filename);
        obj.additions   += file.additions;
        obj.deletions   += file.deletions;
        obj.changes     += file.changes;

    });

    _.forEach(this.data.commits, function(commitData){
        var name        = commitData.commit.author.name;
        var hash        = commitData.sha.substring(0,7);
        var url         = commitData.html_url;
        var message     = commitData.commit.message;  
        var ago         = moment(commitData.commit.author.date).fromNow();

        if(_.indexOf(obj.authors, name) < 0)
        {
            obj.authors.push(name);
        }

        obj.commits.push({
            name: name,
            hash: hash,
            url: url,
            message: message,
            ago: ago
        });
    });

    return obj;
};

Diff.prototype.getCacheKey = function(){
    return 'diff_' + config.github.orgName + '_' + this.repoName + '_' + this.baseName + '_' + this.headName;
};

Diff.prototype.getCache = function(){
    var key = this.getCacheKey();
    var cacheObj = cache.get(key);
    return cacheObj[key];
};

Diff.prototype.setCache = function(obj){
    var key = this.getCacheKey();
    return cache.set(key, obj, 60 * 10);
};

module.exports = Diff;