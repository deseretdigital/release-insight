/*
 * GET home page.
 */

var insight = require('../src/insight'),
    ProjectFormatter = require('../src/projectFormatter');


exports.index = function(req, res){
    res.locals.session = req.session;


    res.render('index', { title: 'Express with Handlebars', projects: insight.config.projects});
};

/*
 * GET project page
 */

exports.project = function(req, res){
    console.log("project route called");
    var template_engine = req.app.settings.template_engine;
    res.locals.session = req.session;

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

    insight.loadProject(req.params.name)
    .then(function(project){
        var formatter = new ProjectFormatter(project);
        var data = formatter.format();
        res.render('project', { title: 'Project: ' + project.display, project: data, projects: insight.config.projects});
    })
    .fail(function(error){
        console.log(error.stack);
        res.render('error', { title: 'Error!', error: error, projects: insight.config.projects});
    });
};