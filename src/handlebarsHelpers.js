var _ = require('lodash'),
    StoryCollection = require('./storyCollection'),
    inspector = require('./inspector');

var helpers = {
    foo: function () { return 'FOO!'; },
    bar: function () { return 'BAR!'; },
    inspect: function(context){
        inspector(context);
    },
    size: function(obj){
        return _.size(obj);
    },
    shortenSha: function(sha) {
        return sha.substring(0,7);
    },
    commaList: function(list){
        var str = '';
        _.forEach(list, function(item){
            if(str.length > 0)
            {
                str += ', ';
            }

            str += item
        });

        return str;
    }
};

// This is a bigger function, lets split it out
helpers.showStory = function(storyId, options){
    var where = options.hash.where || 'missing_where';

    // Get the story syncronously from the cache since handlebars doesn't do async
    var story = StoryCollection.getFromCache(storyId);
    if(!story)
    {
        return '<div class="error">Error loading Story ' + storyId.toString() + '</div>';
    }

    console.log("Story before getLabels", storyId);

    var labels = story.getLabels();
    var storyClasses = [];
    var state = story.data.current_state;


    _.forEach(labels, function(label){
        storyClasses.push('label-' + label);
    });

    storyClasses.push('state-' + state);

    //inspector(options);
    //inspector(labels);
    //console.log("checking out options");
    //inspector(options);

    



    var html = '<div class="story ' + storyClasses.join(' ') + '"><div class="storyInside">';

    html += '<div class="state">' + story.data.current_state + '</div>';

    html += '<h4 class="title">'
        + '[<a href="' + story.data.url + '" target="_blank">#' + story.data.id + '</a>] ' 
        + story.data.name + '</h4>';
    
    html += '<div class="labels"><strong>Labels:</strong> ' + labels.join(', ') + '</div>';

    var people = '';

    _.forEach(labels, function(label){
        if(label.substring(0,12) == 'stakeholder-')
        {
            if(!people)
            {
                people = '<div class="stakeholders">';
            }

            var handle = label.replace('stakeholder-', '');

            people += '<img src="http://avatars.io/twitter/' + handle + '">';
        }
    });

    if(people)
    {
        people += '</div>';
    }

    html += people;

    /* QA Status */
    var qaMessage = '';
    var qaClass = '';
    var qaButton = '';
    var qaLabel = '';

    if(where == 'pullRequests')
    {
        qaLabel = 'qa-done-branch';
    }
    else if (where == 'master')
    {
        qaLabel = 'qa-done-master';
    }
    else if (where == 'release')
    {
        qaLabel = 'qa-done-www';
    }

    if(_.indexOf(labels, 'no-qa') >= 0){
        qaMessage = 'no-qa - QA Not Possible for this story';
        qaClass = 'qaNeutral';
    }   
    else if(state == 'accepted')
    {
        
        if(_.indexOf(labels, qaLabel) < 0){
            qaMessage = 'missing ' + qaLabel + ' - QA required for this story!';
            qaClass = 'qaAttention';
            qaButton = '<button class="pure-button button-success addLabel" data-label="' + qaLabel + '" data-story="' + storyId + '">Accept QA</button>';
        }
        else
        {
            qaMessage = 'found ' + qaLabel + ' - QA has been completed for this branch';
            qaClass = 'qaDone';
        }
    }

    if(qaMessage.length <= 0)
    {
        qaMessage = 'No QA Step Required Currently';
        qaClass = 'qaNeutral';
    }

    // End Inside
    html += '</div>';

    // QA Status
    html += '<div class="qaStatus ' + qaClass + '"><strong>QA:</strong> ' + qaMessage + ' ' + qaButton + '</div>';

    // End Story
    html += '</div>';

    return html;
};

module.exports = helpers;   