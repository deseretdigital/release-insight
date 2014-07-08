/*
 * GET home page.
 */

var insight = require('../src/insight');


exports.index = function(req, res){
    var template_engine = req.app.settings.template_engine;
    res.locals.session = req.session;


    res.render('index', { title: 'Express with '+template_engine, projects: insight.config.projects});
};

/*
 * GET project page
 */

exports.project = function(req, res){
    console.log("project route called");
    var template_engine = req.app.settings.template_engine;
    res.locals.session = req.session;

    insight.loadProject(req.params.name)
    .then(function(project){
        res.render('project', { title: 'Project: ' + project.display, project: project});
    })
    .fail(function(error){
        console.log(error.stack);
        res.render('error', { title: 'Error!', error: error});
    });
};