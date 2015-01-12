var _ = require('lodash'),
    inspector = require('./inspector'),
    Q = require('q'),
    StoryCollection = require('./storyCollection');

var ProjectFormatter = function(project){
    this.project = project;
    this.data = {};
};

ProjectFormatter.prototype.format = function(){
    var that = this;
    var deferred = Q.defer();

    var promises = [];

    promises.push(this.formatPullRequests().then(function(data){
        that.data.pullRequests = data;
    }));

    promises.push(this.formatMaster().then(function(data){
        that.data.master = data;
    }));

    promises.push(this.formatReleases().then(function(data){
        that.data.releases = data;
    }));

    this.data.config = this.project.config;

    Q.all(promises).then(function(){
        return that.verifyAllStoriesLoaded();
    }).then(function(){
        deferred.resolve(that.data);
    });

    return deferred.promise;
};

ProjectFormatter.prototype.verifyAllStoriesLoaded = function(){
    var deferred = Q.defer();
    var promises = [];

    console.log("Verifying all stories");

    this.verifyForStory(promises, this.data);

    Q.all(promises).then(function(){
        deferred.resolve();
    });


    return deferred.promise;
}

ProjectFormatter.prototype.verifyForStory = function(promises, value){
    var that = this;
    var _int = 0;

    //console.log("Verify Story Called, ", value);

    try {
        _int = parseInt(value);
    } catch (err){}

    if(_int > 10000000 && _int < 100000000)
    {
        //console.log("FOUND STORY! " + _int.toString());
        promises.push(StoryCollection.retrieve(_int));
    }
    else if(_.isString(value))
    {
        //console.log("IS STRING");
        return;
    }
    else if (_.isArray(value) || _.isObject(value))
    {
        //console.log("IS ARRAY OR OBJECT");
        _.forEach(value, function(subValue){
            that.verifyForStory(promises, subValue);
        });    
    }
    else 
    {
        //console.log("I DONT KNOW WHAT YOU ARE!", value);
    }
};


ProjectFormatter.prototype.formatPullRequests = function(){
    var deferred = Q.defer();

    var that = this;
    var pullRequests = {};

    // We
    _.forEach(this.project.repos, function(repo){
        _.forEach(repo.pullRequests, function(pr){
            //console.log(pr.diff.data);
            var prData = {};
            prData.branchName   = pr.data.head.ref;
            prData.title        = pr.data.title;
            prData.url          = pr.data.html_url;
            prData.owner        = pr.data.base.repo.owner.login;
            prData.repo         = pr.data.base.repo.name;
            prData.number       = pr.data.number;
            prData.userLogin    = pr.data.user.login;
            prData.createdAgo      = moment(pr.data.created_at).fromNow();
            prData.updatedAgo      = moment(pr.data.updated_at).fromNow();

            try {
                prData.statusState = pr.lastStatus.state;
                prData.statusDescription = pr.lastStatus.description;
                prData.statusUrl = pr.lastStatus.target_url;
            } catch (err){}

            var storyIds = pr.getStoryIds();

            if(pr.diff)
            {
                prData.diff = pr.diff.formatDiff();
            }
            else
            {
                prData.diff = { err: "no diff found!" };
            }

            if(!pullRequests[prData.branchName])
            {
                var branch = {
                    name: prData.branchName,
                    stageUrl: that.project.config.stageUrlPrefix + prData.branchName + that.project.config.stageUrlPostfix,
                    branchPullReqs: [ prData ],
                    storyIds: storyIds
                };

                pullRequests[prData.branchName] = branch;
            }
            else
            {
                pullRequests[prData.branchName].branchPullReqs.push(prData);

                _.forEach(storyIds, function(id){
                    pullRequests[prData.branchName].storyIds[id] = id;
                });
            }
        });
    });

    deferred.resolve(pullRequests);
    return deferred.promise;
};

ProjectFormatter.prototype.formatMaster = function(){
    var that = this;
    var deferred = Q.defer();

    var promises = [];

    var master = {
        storyIds: {},
        commits: {},
        stageUrl: this.project.config.stageMasterUrl
    };


    _.forEach(this.project.repos, function(repo){
        var repoStories = repo.masterDiff.getStoryIds();
        _.forEach(repoStories, function(storyId){
            master.storyIds[storyId] = storyId;
        });

        master.commits[repo.name] = (typeof(repo.masterDiff.data) != 'undefined' ? repo.masterDiff.data.commits : {});
    });

    // Make sure they are loaded
    _.forEach(master.storyIds, function(storyId){
        promises.push(StoryCollection.retrieve(storyId));
    });

    Q.all(promises).then(function(){
        console.log("Resolved get stories!");
        deferred.resolve(master);
    });

    return deferred.promise;
};

ProjectFormatter.prototype.formatReleases = function(){
    var that = this;
    var deferred = Q.defer();

    var releases = {};

    _.forEach(that.project.repos, function(repo){
        console.log("Checking repo " + repo.name + " for release branches");
        _.forEach(repo.releaseBranches, function(release){
            var releaseData;

            // Only show diffable releases
            if(!release.diff)
            {
                return;
            }

            if(releases[release.name])
            {
                releaseData = releases[release.name];
            }
            else
            {
                releaseData = {
                    storyIds: {},
                    commits: {}
                };

                releases[release.name] = releaseData;
            }


            var storyIds = release.diff.getStoryIds();
            _.forEach(storyIds, function(storyId){
                releaseData.storyIds[storyId] = storyId;
            });

            releaseData.commits[repo.name] = release.diff.commits;
        });
    });

    deferred.resolve(releases);

    return deferred.promise;
};

module.exports = ProjectFormatter;