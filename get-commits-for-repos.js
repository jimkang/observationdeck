var getCommitQuery = require('./get-commit-query');
var sb = require('standard-bail')();
var isAGitHubRateLimitErrorMessage = require('./is-a-github-rate-limit-error-message');
var callNextTick = require('call-next-tick');
var pathExists = require('object-path-exists');
var getGQLReqOpts = require('./get-gql-req-opts');
var pluck = require('lodash.pluck');
var curry = require('lodash.curry');
var findWhere = require('lodash.findwhere');
var compact = require('lodash.compact');

function GetCommitsForRepos({
    baseURL = 'https://api.github.com',
    token,
    userEmail,
    request,
    userAgent
  }) {

  const apiURL = baseURL + '/graphql';
  return getCommitsForRepos;

  function getCommitsForRepos(
    {
      onCommitsForRepo,
      onNonFatalError,
      repos // Objects with a `name` property.
    },
    done) {

    var reposThatHaveCommitsToGet = repos.slice();
    reposThatHaveCommitsToGet.forEach(addDateFilterProperties);
    postNextQuery();

    function postNextQuery() {
      var query = getCommitQuery(
        reposThatHaveCommitsToGet, userEmail
      );
      // console.log('query', query);
      request(
        getGQLReqOpts({apiURL: apiURL, token: token, userAgent: userAgent, query: query}),
        sb(handleCommitResponse, done)
      );
    }

    function handleCommitResponse(res, body, done) {
      if (!body) {
        passNonFatalError(new Error('Empty body received from commit reqeust.'));
      }
      else if (body.errors) {
        if (body.errors.some(isAGitHubRateLimitErrorMessage)) {
          // No point in continuing.
          callNextTick(done, new Error('Rate limit error'));
          return;
        }
        passNonFatalError(new Error(JSON.stringify(body.errors, null, 2)));
      }
      else if (!pathExists(body, ['data', 'viewer'])) {
        passNonFatalError(
          new Error('Could not get data/viewer from commit query response body.')
        );
      }
      else {
        extractCommitsFromQueryResult(
          body.data.viewer, reposThatHaveCommitsToGet, onCommitsForRepo
        );
      }

      if (compact(pluck(reposThatHaveCommitsToGet, 'lastCursor')).length > 0) {
        callNextTick(postNextQuery);
      }
      else {
        callNextTick(done);
      }
    }

    function passNonFatalError(error) {
      if (onNonFatalError) {
        onNonFatalError(error);
      }
    }
  }
}

function extractCommitsFromQueryResult(
  viewer, reposThatHaveCommitsToGet, onCommitsForRepo) {

  for (var queryId in viewer) {
    let queryResult = viewer[queryId];
    if (queryResult) {
      let repoName = queryResult.defaultBranchRef.repository.name;
      let pageInfo = queryResult.defaultBranchRef.target.history.pageInfo;
      let repo = findWhere(reposThatHaveCommitsToGet, {name: repoName});
      if (pageInfo.hasNextPage) {
        repo.lastCursor = pageInfo.endCursor;
      }
      else {
        delete repo.lastCursor;
      }

      let commits = pluck(queryResult.defaultBranchRef.target.history.edges, 'node');
      commits.forEach(curry(appendRepoNameToCommit)(repo.name));
      onCommitsForRepo(repo.name, commits);
    }
  }
}

function appendRepoNameToCommit(name, commit) {
  commit.repoName = name;
}

function addDateFilterProperties(repo) {
  if (repo.commits && repo.commits.length > 0) {
    var oldestToNewestDates = pluck(repo.commits, 'committedDate').sort();
    repo.until = adjustDateString(oldestToNewestDates[0], -1);
  }
}

function adjustDateString(isoString, adjustmentInSeconds) {
  return (new Date((new Date(isoString)).getTime() + adjustmentInSeconds * 1000))
    .toISOString();
}

module.exports = GetCommitsForRepos;
