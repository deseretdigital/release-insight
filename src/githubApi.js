var GitHubApi = require("github"),
    config = require('./config');

var github = new GitHubApi({
    // required
    version: "3.0.0",
    // optional
    //debug: true,
    protocol: "https",
    timeout: 10000
});

github.authenticate({
    type: "oauth",
    token: config.github.token
});

module.exports = github;