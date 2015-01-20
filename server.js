/**
 * Module dependencies.
 */

//change your template engine and hostname here ('ejs' or 'dust')
var template_engine = 'dust'
    , domain = 'localhost';

var express = require('express')
    , http = require('http')
    , store = new express.session.MemoryStore
    , routes = require('./routes')
    , path = require('path')
    , handlebarsHelpers = require('./src/handlebarsHelpers')
    , insight = require('./src/insight');

var flash = require('connect-flash');

var app = express();

/* Template Setup */

var exphbs  = require('express3-handlebars');

var inspector = require('./src/inspector');

app.engine('.hbs', exphbs({
    // Specify helpers which are only registered on this instance.
    helpers: handlebarsHelpers,
    extname: ".hbs",
    defaultLayout: "layout",
    layoutsDir: "views/layouts/",
    partialsDir: "views/partials/"
}));


app.configure(function(){
    app.set('domain', domain);
    app.set('port', process.env.PORT || 8080);
    app.set('views', __dirname + '/views');
    app.set('view engine', '.hbs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('wigglybits'));
    app.use(express.session({ secret: 'whatever', store: store }));
    app.use(express.session());
    app.use(app.router);
    app.use(flash());
    app.use(express.static(path.join(__dirname, 'public')));

    //middleware
    app.use(function(req, res, next){
        if ( req.session.user ) {
            req.session.logged_in = true;
        }
        res.locals.message = req.flash();
        res.locals.session = req.session;
        res.locals.q = req.body;
        res.locals.err = false; 
        next();
    });

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.locals.inspect = require('util').inspect;

app.get('/', routes.index);
app.get('/project/:name', routes.project);
app.get('/api/story/add-label', routes.apiAddLabel);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

function keepingItFresh(){
    console.log('************** Keeping stuff Fresh *******************');
    insight.refreshProjects().then(function(){
        console.log('************** Refreshing Finished *******************');
    });
};

keepingItFresh();

/* Freshness Loop */
setTimeout(function(){
    keepingItFresh();
}, 60 * 10 * 1000 + 5000); // every 10 minutes and 5 seconds
