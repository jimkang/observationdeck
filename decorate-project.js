const dayInMS = 24 * 60 * 60 * 1000;

function decorateProject(project, nowInEpochTime = Date.now()) {
  project.releaseState = 'inProgress';
  if (project.shippedDate) {
    project.shippedDate = new Date(project.shippedDate);
    project.releaseState = 'shipped';
  }
  if (project.workStopped) {
    project.releaseState = 'workStopped';
  }

  if (project.deeds && project.deeds.length > 0) {
    var activities = project.deeds.map(makeActivity);
    activities.sort(aIsEarlierThanB);
    activities[0].isStart = true;
    activities[activities.length - 1].isLastActive = true;

    project.startDate = activities[0].committedDate;
    project.lastActiveDate = activities[activities.length - 1].committedDate;
    project.ageInDays = Math.round(
      (nowInEpochTime - project.startDate.getTime()) / dayInMS
    );
    project.activitySpanInDays = getDifferenceInDays(
      project.lastActiveDate,
      project.startDate
    );
    project.activities = activities;
    // console.log(project.activities);

    // A "tended" date is a date in which a project was updated after
    // shipping.
    // A "grown" date is only for projects that haven't shipped.
    // The updates for projects that haven't shipped are considered
    // "growth".
    if (project.shippedDate) {
      if (
        floorToBeginningOfDay(project.lastActiveDate) >
        floorToBeginningOfDay(project.shippedDate)
      ) {
        project.lastTendedDate = project.lastActiveDate;
      }
    } else {
      if (project.lastActiveDate) {
        project.lastGrownDate = project.lastActiveDate;
      }
    }
  }
  return project;
}

// Do we need activities? Can we just use deeds?
function makeActivity(deed) {
  return {
    id: deed.id,
    message: deed.message,
    committedDate: new Date(deed.committedDate)
  };
}

function aIsEarlierThanB(a, b) {
  if (new Date(a.committedDate) < new Date(b.committedDate)) {
    return -1;
  } else {
    return 1;
  }
}

function getDifferenceInDays(later, earlier) {
  return Math.round((later.getTime() - earlier.getTime()) / dayInMS);
}

function floorToBeginningOfDay(date) {
  return new Date(date.toLocaleDateString());
}

module.exports = decorateProject;
