/* global window */

var test = require('tape');
var ProjectsSource = require('../../projects-source');
var assertNoError = require('assert-no-error');
var queue = require('d3-queue').queue;
var values = require('lodash.values');
var config = require('../../config');
var request = require('basic-browser-request');
var defaults = require('lodash.defaults');
var pluck = require('lodash.pluck');

var streamEndEventReceived = false;
var projectsToCareAbout = ['iemxrre', 'attnbot', 'slack-gis'];
// projectsToCareAbout = undefined;
// Set projectsToCareAbout to undefined to test it against *every* project.
// Warning: That's a long test.

var defaultCtorOpts = {
  user: 'jimkang',
  githubToken: config.githubTestToken,
  username: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  request: request,
  onNonFatalError: logNonFatalError
};

// test('Pause', (t) => {window.c = t.end; console.log('After setting breakpoints, type c() to continue.');});
test('Stream from API.', apiDeedStreamTest);

function apiDeedStreamTest(t) {
  var shouldListenToEvents = false;
  var emittedDeeds = {};
  var emittedProjects = {};

  var projectsSource = ProjectsSource(defaults(
    {
      onDeed: collectDeed,
      onProject: collectProject,
      filterProject: projectsToCareAbout ? weCareAboutThisProject : undefined,
      dbName: 'api-deed-stream-test'
    },
    defaultCtorOpts
  ));

  shouldListenToEvents = true;
  projectsSource.startStream({sources: ['local', 'API']}, checkStreamEnd);

  function collectDeed(deed) {
    t.ok(!streamEndEventReceived, 'Did not receive deed event after end of stream.');
    if (shouldListenToEvents) {
      emittedDeeds[deed.id] = deed;
    }
  }

  function collectProject(project) {
    t.ok(!streamEndEventReceived, 'Did not receive project event after end of stream.');
    if (shouldListenToEvents) {
      emittedProjects[project.id] = project;
    }
  }

  function checkStreamEnd(error) {
    streamEndEventReceived = true;
    assertNoError(t.ok, error, 'No error while streaming local stuff.');
    // var uniqueDeedsEmitted = Object.keys(emittedDeeds).length;
    // console.log('uniqueDeedsEmitted:', uniqueDeedsEmitted);

    // t.ok(
    //   uniqueDeedsEmitted > existingDeeds.length,
    //   'Correct number of deeds was emitted.'
    // );
    values(emittedDeeds).forEach(checkDeed);
    
    if (projectsToCareAbout) {
      t.equal(
        Object.keys(emittedProjects).length,
        projectsToCareAbout.length,
        'Correct number of projects was emitted.'
      );
    }
    values(emittedProjects).forEach(checkProject);

    // Allow a chance for events to be erroneously emitted after the
    // stream end event.
    setTimeout(t.end, 1000);
  }

  function checkDeed(deed) {
    t.ok(deed.message, 'Deed has a message.');
    t.ok(deed.id, 'Deed has an id.');
    t.ok(deed.committedDate, 'Deed has a date.');
    t.ok(deed.projectName, 'deed has a projectName');
  }

  function checkProject(project) {
    t.ok(project.name, 'Project has a name.');
    t.ok(project.pushedAt, 'Project has a pushedAt date.');
    t.ok(project.lastCheckedDate, 'Project has a lastCheckedDate.');

    if (projectsToCareAbout) {
      t.ok(
        projectsToCareAbout.indexOf(project.name) !== -1 ||
        pluck(existingProjects, 'name').indexOf(project.name) !== -1,
        'Project is in projectsToCareAbout'
      );
    }
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}

function weCareAboutThisProject(project) {
  return projectsToCareAbout.indexOf(project.name) !== -1;
}
