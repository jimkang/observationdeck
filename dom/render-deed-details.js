var d3 = require('d3-selection');

// Pre-rendering prep with static elements.
var detailsBox = d3.select('.details-box');
detailsBox.on('click', hideBox);

var projectDetails = detailsBox.select('.project-details');
var projectNameLink = projectDetails.select('.name-link');
var projectDate = projectDetails.select('.date');
var deedDetails = detailsBox.select('.deed-details');
var deedName = deedDetails.select('.name');
var deedDateLink = deedDetails.select('.date-link');

function RenderDeedDetails({user}) {
  return renderDeedDetails;

  function renderDeedDetails({deed, project}) {
    projectNameLink.text(project.name);
    projectNameLink.attr('href', getProjectLink(user, project));
    projectDate.text(dateStringToDisplayForm(project.pushedAt));

    deedName.text(deed.message);
    deedDateLink.text(dateStringToDisplayForm(deed.committedDate));
    deedDateLink.attr('href', getDeedLink(user, project, deed));

    detailsBox.classed('destroyed', false);
  }
}

function hideBox() {
  detailsBox.classed('destroyed', true);
}

function dateStringToDisplayForm(dateString) {
  var date = new Date(dateString);
  return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
}

function getDeedLink(user, project, deed) {
  return `https://github.com/${user}/${project.name}/commit/${deed.abbreviatedOid}`;
}

function getProjectLink(user, project) {
  return `https://github.com/${user}/${project.name}`;
}

module.exports = RenderDeedDetails;
