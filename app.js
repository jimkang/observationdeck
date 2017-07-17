var RouteState = require('route-state');
// var renderProjectEditor = require('./dom/render-project-editor');
// var listEmAll = require('list-em-all');
var sb = require('standard-bail')();
var handleError = require('handle-error-web');
var GitHubProjectsSource = require('./github-projects-source');
var request = require('basic-browser-request');
var config = require('./config');
var findToken = require('./find-token');
var qs = require('qs');
// var curry = require('lodash.curry');

var routeState;
var projectsToCareAbout = ['transform-word-bot', 'attnbot', 'slack-gis'];
var streamEndEventReceived = false;

((function go() {
  var queryStringParsed = qs.parse(window.location.search.slice(1));
  findToken(
    {
      routeDict: queryStringParsed,
      store: window.localStorage,
      currentDate: new Date()
    },
    decideOnToken
  );

  function decideOnToken(error, retrievedToken) {
    if (error) {
      if (error.message === 'No token or code found.') {
        redirectToGitHubAuth();
      }
      else {
        handleError(error);
      }
    }
    else {
      routeState = RouteState({
        followRoute: followRoute,
        windowObject: window
      });
      routeState.addToRoute({token: retrievedToken});
    }
  }

})());

function followRoute(routeDict) {
  console.log(routeDict);
  if (routeDict.user && routeDict.userEmail) {
    projectsFlow(routeDict);
  }
  else {
    // githubUserInfoFlow(sb(curry(projectsFlow)(routeDict), handleError));
    routeState.addToRoute({
      user: document.getElementById('github-username').value,
      userEmail: document.getElementById('github-user-email').value
    });
  }
}


function projectsFlow(routeDict) {
  var collectedDeeds = {};
  var collectedProjects = {};

  var githubProjectsSource = GitHubProjectsSource({
    user: routeDict.user,
    githubToken: routeDict.token,
    username: routeDict.user,
    userEmail: routeDict.userEmail,
    request: request,
    onNonFatalError: handleError,
    onDeed: collectDeed,
    onProject: collectProject,
    filterProject: weCareAboutThisProject,
    dbName: 'observatory-deeds'
  });

  streamEndEventReceived = false;
  githubProjectsSource.startStream({sources: ['local', 'API']}, onStreamEnd);

  function collectDeed(deed, source) {
    if (streamEndEventReceived) {
      console.log('Received deed after stream end!');
    }
    console.log('Received deed:', deed, 'from', source);
    collectedDeeds[deed.id] = deed;
  }

  function collectProject(project, source) {
    if (streamEndEventReceived) {
      console.log('Received project after stream end!');
    }
    console.log('Received project:', project, 'from', source);
    collectedProjects[project.id] = project;
  }

  function onStreamEnd(error) {
    streamEndEventReceived = true;
    if (error) {
      handleError(error);
    }
    else {
      console.log('Finished streaming.');
      // console.log('projects', collectedProjects);
      // console.log('deeds', collectedDeeds);
      console.log('project count', Object.keys(collectedProjects).length);
      console.log('deed count', Object.keys(collectedDeeds).length);
    }
  }
}

// function listFlow() {
//   listEmAll.loadList({url: 'projects.yaml'}, sb(callRenderList, handleError));
// }

// function callRenderList(projects) {
//   listEmAll.render({
//     thingList: projects.filter(projectIsValid),
//     rootId: 'list', 
//     thingClass: 'project'
//   });
// }

// function newProjectFlow() {
//   renderProjectEditor();
// }

// function projectIsValid(project) {
//   return !project.disown && !project.parent;
// }

function weCareAboutThisProject(project) {
  return true;
  // return projectsToCareAbout.indexOf(project.name) !== -1;
}

function redirectToGitHubAuth() {
  var clientId = config.github.clientId;
  if (window.location.hostname === 'localhost') {
    clientId = config.githubTest.clientId;
  }
  var authURI = 'https://github.com/login/oauth/authorize?' +
    'client_id=' + clientId +
    '&scope=repo';

  window.location.href = authURI;
}
