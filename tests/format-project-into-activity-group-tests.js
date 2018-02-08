var test = require('tape');
var formatProjectIntoActivityGroup = require('../format-project-into-activity-group');
var projectData = require('./fixtures/example-project-data-small.json');

var testCases = [
  {
    name: 'No end',
    project: projectData[0],
    expected: {
      numberOfActivities: 2,
      shouldHaveStartDate: true,
      shouldHaveShippedDate: false,
      shouldHaveLastActiveDate: true,
      activityFrequency: 0.3, // TODO: Get real value
      ageInDays: 143, // TODO: Get real value
      activitySpanInDays: 53,
      // dormancy length?
      isExternal: false, // TODO: Add this to API source
      available: true // TODO: Add this to API source
    }
  }
  // {
  //   name: 'No activity',
  //   project: projectData[1],
  //   expected: {
  //     numberOfActivities: 0,
  //     shouldHaveStartDate: false,
  //     shouldHaveShippedDate: false,
  // shouldHaveLastActiveDate: true,
  //     activityFrequency: 0.3, // TODO: Get real value
  //     ageInDays: 100, // TODO: Get real value
  //     // dormancy length?
  //     isExternal: true,
  //     available: true
  //   }
  // },
  // {
  //   name: 'Shipped',
  //   project: projectData[2],
  //   expected: {
  //     numberOfActivities: 3,
  //     shouldHaveStartDate: true,
  //     shouldHaveShippedDate: true,
  //     activityFrequency: 0.3, // TODO: Get real value
  //     ageInDays: 100, // TODO: Get real value
  //     // dormancy length?
  //     isExternal: true
  //   }
  // },
  // {
  //   name: 'Unavailable',
  //   project: projectData[3],
  //   expected: {
  //     numberOfActivities: 45,
  //     shouldHaveStartDate: true,
  //     shouldHaveShippedDate: true,
  //     activityFrequency: 0.3, // TODO: Get real value
  //     ageInDays: 100, // TODO: Get real value
  //     // dormancy length?
  //     isExternal: true,
  //     available: false
  //   }
  // }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, formatTest);

  function formatTest(t) {
    var activityGroup = formatProjectIntoActivityGroup(
      testCase.project,
      new Date('2018-02-07').getTime()
    );
    t.ok(activityGroup.id, 'Group has an id.');
    t.ok(activityGroup.name, 'Group has a name.');
    t.ok(activityGroup.description, 'Group has a description.');
    if (testCase.expected.shouldHaveStartDate) {
      t.ok(activityGroup.startDate, 'Group has a startDate.');
    }
    if (testCase.expected.shouldHaveShippedDate) {
      t.ok(activityGroup.shippedDate, 'Group has a shippedDate.');
    }
    if (testCase.expected.shouldHaveLastActiveDate) {
      t.ok(activityGroup.lastActiveDate, 'Group has a lastActiveDate.');
    }
    t.equal(
      activityGroup.ageInDays,
      testCase.expected.ageInDays,
      'ageInDays is correct.'
    );
    t.equal(
      activityGroup.activitySpanInDays,
      testCase.expected.activitySpanInDays,
      'activitySpanInDays is correct.'
    );
    t.equal(
      activityGroup.isExternal,
      testCase.expected.isExternal,
      'isExternal is correct.'
    );
    t.equal(
      activityGroup.available,
      testCase.expected.available,
      'available is correct.'
    );

    t.ok(activityGroup.activities, 'Group has activities.');
    t.equal(
      activityGroup.activities.length,
      testCase.expected.numberOfActivities,
      'Group as correct number of activities.'
    );
    if (activityGroup.activities.length > 0) {
      activityGroup.activities.forEach(checkActivity);

      t.equal(
        activityGroup.activities.filter(activity => activity.isStart).length,
        1,
        'Has a start activity.'
      );
      if (testCase.expected.shouldHaveShippedDate) {
        t.equal(
          activityGroup.activities.filter(activity => activity.isShipPoint)
            .length,
          1,
          'Has a ship-point activity.'
        );
      }
      t.end();
    }

    function checkActivity(activity) {
      t.ok(activity.id, 'Activity has an id.');
      t.ok(activity.message, 'Activity has a message.');
      t.ok(activity.committedDate, 'Activity has a committedDate.');
    }
  }
}
