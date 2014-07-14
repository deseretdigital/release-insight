var _ = require('lodash'),
    Q = require('q'),
    pivotal = require('./pivotalApi'),
    request = require('request');
    

var Story = function(data){
    this.data = data || {};
    this.preload = false;
};

Story.prototype.getId = function(){
    return this.data.id;
};

Story.prototype.getLabels = function(){
    var labels = [];

    if(this.data && this.data.labels)
    {
        _.forEach(this.data.labels, function(labelData){
            var name = labelData.name;
            name = name.replace(/\ /g, '-');
            name = name.replace(/\:/g, '');

            labels.push(name);
        });
    }

    return labels;
};

Story.prototype.addLabel = function(labelName){
    var deferred = Q.defer();
    var projectId = this.data.project_id.toString();
    var storyId = this.data.id.toString();

    var options = pivotal.getOptions();
    options.url += '/projects/' + projectId + '/stories/' + storyId + '/labels';
    options.json = { name: labelName };
    options.method = 'POST';

    console.log("calling pivotal API");
    request(options, function(error, response, body){
        console.log("pivotal api returned", error, response, body);
        var success = true;
        if(error)
        {
            success = false;
        }

        var StoryCollection = require('./storyCollection');
        // Delete from Cache
        StoryCollection.delete(storyId);

        deferred.resolve(success);
    });


    return deferred.promise;

};

module.exports = Story;