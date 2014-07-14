/*
 * GET home page.
 */

var insight = require('../src/insight'),
    ProjectFormatter = require('../src/projectFormatter'),
    StoryCollection = require('../src/storyCollection');


exports.index = function(req, res){
    res.locals.session = req.session;


    res.render('index', { title: 'Express with Handlebars', projects: insight.config.projects});
};

/*
 * GET project page
 */

exports.project = function(req, res){
    console.log("project route called");
    // Set the current class

    for(var i = 0; i < insight.config.projects.length; i++)
    {
        if(req.params.name == insight.config.projects[i].name)
        {
            insight.config.projects[i].classes = 'menu-item-divided pure-menu-selected';
        }
        else
        {
            insight.config.projects[i].classes = '';
        }
    }

    var theProject;

    insight.loadProject(req.params.name)
    .then(function(project){
        theProject = project;
        var formatter = new ProjectFormatter(project);
        return formatter.format();
        
    })
    .then(function(projectData){
        res.render('project', { title: 'Project: ' + theProject.display, project: projectData, projects: insight.config.projects});
    })
    .fail(function(error){
        console.log(error.stack);
        res.render('error', { title: 'Error!', error: error, projects: insight.config.projects});
    });
};

exports.apiAddLabel = function(req, res){
    
    console.log("apiAddLabel called");
    var storyId = req.query.story;
    var labelName = req.query.label;
    console.log("storyId", storyId);
    console.log("labelName", labelName);


    var storyPromise = StoryCollection.retrieve(storyId);

    storyPromise.then(function(story){
        console.log("storyRetrieved ", story);
        var labelPromise = story.addLabel(labelName);
        return labelPromise;
    }).then(function(success){
        console.log("success!");
        res.setHeader('Content-Type', 'application/json');    
        res.end(JSON.stringify({ success: success }, null, 3));
    });

    
    
};