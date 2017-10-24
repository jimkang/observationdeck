var d3 = require('d3-selection');
var accessor = require('accessor');
var GetPropertySafely = require('get-property-safely');
var EaseThrottle = require('../ease-throttle');
var renderDetailInnards = require('./render-detail-innards');

const projectDetailsSkeleton = `<div class="project-details">
      <a class="name-link" target="_blank"></a>
      <div>Last updated: <span class="date"></span></div>
      <div class="description"></div>
    </div>
  </div>
`;

var idKey = accessor();
var messageKey = accessor('message');

var basicProjectListRoot = d3.select('#basic-project-list');

var deedsKey = GetPropertySafely('deeds', []);

function RenderPlain({user}) {
  return EaseThrottle({fn: renderPlain});

  function renderPlain({projectData}) {
    d3.selectAll('.view-root:not(#list-container)').classed('hidden', true);
    d3.select('#list-container').classed('hidden', false);

    var projects = basicProjectListRoot.selectAll('.project').data(projectData, idKey);
    // projects.exit().remove();
    var newProjects = projects.enter().append('li').classed('project', true);
    var projectDescriptions = newProjects.append('div')
      .classed('project-description', true)
      .on('click', toggleDeedList);
    projectDescriptions.html(projectDetailsSkeleton);

    newProjects.append('ul')
      .classed('deeds-root', true)
      .classed('hidden', true);

    var allProjects = newProjects.merge(projects);
    allProjects.each(callRenderInnards);

    var deedsRoot = allProjects.select('.deeds-root');
    var deeds = deedsRoot.selectAll('.deed').data(deedsKey, idKey);
    // deeds.exit().remove();
    var newDeeds = deeds.enter().append('li').classed('deed', true);
    newDeeds.append('div').classed('deed-name', true);
    var allDeeds = newDeeds.merge(deeds);
    allDeeds.select('.deed-name').text(messageKey);

    function callRenderInnards(project) {
      renderDetailInnards({
        parent: d3.select(this).select('.project-description'),
        project,
        user
      });
    }
  }
}

function toggleDeedList() {
  var deedsRoot = d3.select(this.parentNode).select('.deeds-root');
  deedsRoot.classed('hidden', !deedsRoot.classed('hidden'));
}

module.exports = RenderPlain;
