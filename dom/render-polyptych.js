var d3 = require('d3-selection');
var accessor = require('accessor')();
var {
  compareDescWithSortKey,
  compareByDeedCountAsc
} = require('../comparators');
var curry = require('lodash.curry');
var pick = require('probable').pick;
var Crown = require('csscrown');

var crown = Crown({
  crownClass: 'selected-tych'
});

var polyptychContainer = d3.select('#polyptych-container');
var polyptychRoot = d3.select('#polyptych-root');
var compareDescShipped = curry(compareDescWithSortKey)('shippedDate');

function RenderPolyptych() {
  return renderPolyptych;

  function renderPolyptych({ projectData }) {
    var projectSizeBucketBoundaries = getProjectSizeBucketBoundaries(
      projectData
    );
    projectData.sort(compareDescShipped);

    d3.selectAll('.view-root:not(#polyptych-container)').classed(
      'hidden',
      true
    );
    polyptychContainer.classed('hidden', false);

    var tychs = polyptychRoot.selectAll('.tych').data(projectData, accessor());
    tychs.exit().remove();
    var newTychs = tychs
      .enter()
      .append('div')
      .classed('tych', true)
      .classed('centered-col', true)
      .on('click', focusOnTych);

    newTychs
      .append('div')
      .classed('title', true)
      .append('a')
      .classed('title-link', true)
      .attr('target', '_blank');
    newTychs
      .append('a')
      .classed('project-window-link', true)
      .attr('target', '_blank')
      .append('img')
      .classed('project-window', true);
    newTychs.append('div').classed('description', true);
    newTychs.append('ul').classed('links-root', true);

    var currentTychs = newTychs.merge(tychs);
    currentTychs.attr('class', getClassStringForTych);
    currentTychs
      .select('.title-link')
      .text(accessor('name'))
      .attr('href', getMainLinkHref);
    currentTychs.select('.project-window-link').attr('href', getMainLinkHref);
    var projectWindows = currentTychs.select('.project-window');
    projectWindows.classed('hidden', doesNotHaveProfileImage);
    projectWindows.attr('src', accessor('profileImage'));
    currentTychs.select('.description').text(accessor('description'));

    var linksRoots = currentTychs.selectAll('.links-root');

    var linkItems = linksRoots.selectAll('li').data(getLinks, accessor('0'));
    linkItems.exit().remove();
    var newLinkItems = linkItems.enter().append('li');
    newLinkItems.append('a');
    newLinkItems
      .merge(linkItems)
      .select('a')
      .attr('href', accessor('0'))
      .attr('target', '_blank')
      .text(accessor('1'));

    function getClassStringForTych(project) {
      var sizeClass = 'small-tych';
      if (
        project.deeds &&
        project.deeds.length > projectSizeBucketBoundaries[0]
      ) {
        if (project.profileImage) {
          sizeClass = 'tall-tych';
        } else {
          sizeClass = pick(['wide-tych', 'tall-tych']);
        }
        if (project.deeds.length > projectSizeBucketBoundaries[1]) {
          sizeClass = 'big-tych';
        }
      }
      return 'tych centered-col ' + sizeClass;
    }
  }
}

function getMainLinkHref(project) {
  var links = getLinks(project);
  if (links.length > 0) {
    return links[0][0];
  }
  return '';
}

function doesNotHaveProfileImage(project) {
  return !project.profileImage;
}

function getProjectSizeBucketBoundaries(projects) {
  if (projects.length < 1) {
    return [0, 0];
  }

  projects.sort(compareByDeedCountAsc);
  return [
    getDeedCount(projects[~~(projects.length / 3)]),
    getDeedCount(projects[~~((2 * projects.length) / 3)])
  ];
}

function getDeedCount(project) {
  if (project && project.deeds) {
    return project.deeds.length;
  }
  return 0;
}

function focusOnTych(project) {
  // Don't do anything when links within the tych are clicked.
  if (d3.event.target.tagName === 'A') {
    return;
  }

  var currentlySelectedTych = d3.select('.selected-tych');
  if (!currentlySelectedTych.empty()) {
    let currentlySelectedProject = currentlySelectedTych.datum();
    if (currentlySelectedProject.id === project.id) {
      this.classList.remove('selected-tych');
      this.scrollIntoView({ behavior: 'smooth' });
      return;
    }
  }

  // Give the selected-tych class to this element.
  crown(this);
  this.scrollIntoView({ behavior: 'smooth' });
}

function getLinks(project) {
  return getLinkArraySafely(project.links).concat(
    getLinkArraySafely(project.sources)
  );
}

function getLinkArraySafely(linkArray) {
  if (linkArray && Array.isArray(linkArray)) {
    if (linkArray.length < 1) {
      return [];
    }
    // If the project does have links, each link
    // should be an array. Starting with just
    // checking the first one.
    if (Array.isArray(linkArray[0])) {
      return linkArray;
    }
  }
  return [];
}

module.exports = RenderPolyptych;
