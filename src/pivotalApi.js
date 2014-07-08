var config = require('./config');

var getOptions = function(){
    return {
        url: 'https://www.pivotaltracker.com/services/v5',
        json: true,
        headers: {
            'X-TrackerToken': config.pivotal.token
        }
    };
};

module.exports = {
    getOptions: getOptions
};
