var Q = require('q'),
    Project = require('./project'),
    _ = require('lodash'),
    GitHubApi = require('github'),
    moment = require('moment');

var insight = {
    "config": require('./config'),
    "cache": require('./cache'),
    "pivotalStore": require('./pivotalStore')
};

// Configure GitHub Api
var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    debug: true,
    protocol: "https",
    timeout: 5000
});

github.authenticate({
    type: "oauth",
    token: insight.config.github.token
});

insight.github = github;

insight.loadProject = function(name){
    var deferred = Q.defer(); 
    var projectData = null;

    _.forEach(insight.config.projects, function(data){
        if (data.name == name)
        {
            projectData = data;
        }
    });

    if(!projectData)
    {
        throw new Error("Project not found!");
        return;
    }

    var project = new Project(projectData);


    var start = moment();
    project.load().then(function(){
        var end = moment();
        //console.log(end.diff(start));
        deferred.resolve(project);
    });
    

    return deferred.promise;
};

insight.refreshProjects = function(){
    var deferred = Q.defer();
    var promises = [];

    _.forEach(insight.config.projects, function(projectData){
        var project = new Project(projectData);
        promises.push(project.load());
    });

    Q.all(promises).then(function(){
        deferred.resolve();
    });

    return deferred.promise;
};

module.exports = insight;