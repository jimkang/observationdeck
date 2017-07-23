/* global window */

var test = require('tape');
var GitHubProjectsSource = require('../../github-projects-source');
var assertNoError = require('assert-no-error');
var queue = require('d3-queue').queue;
var findWhere = require('lodash.findwhere');
var config = require('../../config');
var request = require('basic-browser-request');
var defaults = require('lodash.defaults');
var omit = require('lodash.omit');

var defaultCtorOpts = {
  user: 'jimkang',
  githubToken: config.githubTestToken,
  username: 'jimkang',
  userEmail: 'jimkang@gmail.com',
  request: request,
  onNonFatalError: logNonFatalError
};

// test('Pause', (t) => {window.c = t.end; console.log('After setting breakpoints, type c() to continue.')});
test('Update db with deed.', deedUpdateTest);
test('Stream deeds.', localDeedStreamTest);

function deedUpdateTest(t) {
  t.plan(4);
  var githubProjectsSource = GitHubProjectsSource(defaults(
    {
      dbName: 'deed-update-test',
      onDeeds: checkDeeds
    },
    defaultCtorOpts
  ));

  var deed = {
    'abbreviatedOid': '30a7e8c',
    id: '30a7e8c',
    'message': 'Refactored mishear module to export a createMishear function that sets up  to use the probable given to createMishear.',
    'committedDate': '2015-10-05T01:42:19Z',
    'repoName': 'mishear',
    projectName: 'mishear',
    type: 'commit'
  };

  githubProjectsSource.putDeed(deed, checkPutError);

  function checkDeeds(deeds) {
    deeds.forEach(checkDeed);
  }

  function checkDeed(emittedDeed) {
    t.deepEqual(emittedDeed, deed, 'Correct deed is emitted.');
  }

  function checkPutError(error) {
    assertNoError(t.ok, error, 'No error while putting deed.');
    githubProjectsSource.getDeed('30a7e8c', checkGet);
  }

  function checkGet(error, gottenDeed) {
    assertNoError(t.ok, error, 'No error while getting deed.');
    checkDeed(gottenDeed);
  }
}

function localDeedStreamTest(t) {
  var shouldListenToEvents = false;
  var emittedDeeds = [];
  var emittedProjects = [];

  var githubProjectsSource = GitHubProjectsSource(defaults(
    {
      dbName: 'local-deed-stream-test',
      onDeeds: collectDeeds,
      onProjects: collectProjects
    },
    defaultCtorOpts
  ));

  var deeds = [
    {
      'abbreviatedOid': '30a7e8c',
      id: '30a7e8c',
      'message': 'Refactored mishear module to export a createMishear function that sets up  to use the probable given to createMishear.',
      'committedDate': '2015-10-05T01:42:19Z',
      'repoName': 'mishear',
      projectName: 'mishear',
      type: 'commit'
    },
    {
      'abbreviatedOid': '1d35d45',
      id: '1d35d45',
      'message': '1.0.1',
      'committedDate': '2015-09-28T13:07:55Z',
      'repoName': 'mishear',
      projectName: 'mishear',
      type: 'commit'
    },
    {
      id: '1e273c2',
      'abbreviatedOid': '1e273c2',
      'message': 'Nominally working.',
      'committedDate': '2015-09-26T04:48:26Z',
      'repoName': 'attnbot',
      projectName: 'attnbot',
      type: 'commit'
    }
  ];

  var projects = [
    {
      'name': 'mishear',
      'id': 'MDEwOlJlcG9zaXRvcnk0MzEwMTQ0Mg==',
      'pushedAt': '2015-10-18T16:53:27Z',
      'description': 'Finds possible mishearings for a given word.',
      'lastCheckedDate': '2017-06-19T01:39:22.345Z',
      'weHaveTheOldestCommit': true
    },
    {
      'name': 'attnbot',
      'id': 'MDEwOlJlcG9zaXRvcnk0MzA2NjIwMA==',
      'pushedAt': '2015-10-18T17:09:10Z',
      'description': 'A bot that doesn\'t always hear things correctly.',
      'lastCheckedDate': '2017-06-19T01:39:22.344Z'
    }
  ];

  var q = queue();
  deeds.forEach(queuePut);
  projects.forEach(queuePutProject);
  q.awaitAll(streamDeeds);

  function queuePut(deed) {
    q.defer(githubProjectsSource.putDeed, deed);
  }

  function queuePutProject(project) {
    q.defer(githubProjectsSource.putProject, project);
  }

  function streamDeeds(error) {
    assertNoError(t.ok, error, 'No error while putting deeds and projects.');
    shouldListenToEvents = true;
    githubProjectsSource.startStream({sources: ['local']}, checkStreamEnd);
  }

  function collectDeeds(deeds) {
    if (shouldListenToEvents) {
      emittedDeeds = emittedDeeds.concat(deeds);
    }
  }

  function collectProjects(projects) {
    if (shouldListenToEvents) {
      emittedProjects = emittedProjects.concat(projects);
    }
    // console.log('emittedProjects now', emittedProjects)
  }

  function checkStreamEnd(error) {
    assertNoError(t.ok, error, 'No error while streaming local stuff.');
    t.equal(emittedDeeds.length, deeds.length, 'Correct number of deeds was emitted');
    deeds.forEach(checkEmittedForDeed);
    t.equal(emittedProjects.length, projects.length, 'Correct number of projects was emitted.');
    projects.forEach(checkEmittedForProject);
    t.end();
  }

  function checkEmittedForDeed(deed) {
    var correspondingEmittedDeed = findWhere(emittedDeeds, {id: deed.id});
    t.deepEqual(correspondingEmittedDeed, deed, 'Emitted deed is correct.');
  }

  function checkEmittedForProject(project) {
    var correspondingEmittedProject = findWhere(emittedProjects, {id: project.id});
    t.deepEqual(
      omit(correspondingEmittedProject, 'deeds'),
      project,
      'Emitted project is correct.'
    );
  }
}

function logNonFatalError(error) {
  console.error('Non-fatal error:', error);
}
