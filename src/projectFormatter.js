var _ = require('lodash'),
    inspector = require('./inspector');

var ProjectFormatter = function(project){
    this.project = project;
    this.data = {};
};

ProjectFormatter.prototype.format = function(){
    this.data.pullRequests = this.formatPullRequests();
    this.data.master = this.formatMaster();
    this.data.releases = this.formatReleases();

    return this.data;
};


ProjectFormatter.prototype.formatPullRequests = function(){
    var that = this;
    var pullRequests = {};

    // We
    _.forEach(this.project.repos, function(repo){
        _.forEach(repo.pullRequests, function(pr){
            console.log('-------------------------------------------------------------------');
            console.log('-------------------------------------------------------------------');
            console.log('-------------------------------------------------------------------');
            inspector(pr);
            //console.log(pr.diff.data);
            var prData = {};
            prData.branchName   = pr.data.head.ref;
            prData.title        = pr.data.title;
            prData.url          = pr.data.html_url;
            prData.owner        = pr.data.base.repo.owner.login;
            prData.repo         = pr.data.base.repo.name;
            prData.number       = pr.data.number;
            prData.userLogin    = pr.data.user.login;
            prData.created      = pr.data.created_at;
            prData.updated      = pr.data.updated_at;


            if(typeof pullRequests[prData.branchName] == 'undefined')
            {
                var branch = {
                    name: prData.branchName,
                    branchPRs: [ prData ]
                };

                pullRequests[prData.branchName] = branch;
            }
        });
    });

    return pullRequests;
};

ProjectFormatter.prototype.formatMaster = function(){
    return {};
};

ProjectFormatter.prototype.formatReleases = function(){
    return {};
};

module.exports = ProjectFormatter;