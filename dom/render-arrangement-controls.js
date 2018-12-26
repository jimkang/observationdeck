var d3 = require('d3-selection');
var curry = require('lodash.curry');
var accessor = require('accessor')();
var groupBy = require('lodash.groupby');

function renderArrangementControls({
  containerSelector,
  criteria,
  onCriteriaControlChange
}) {
  var container = d3.select(containerSelector);
  renderCriteria('filter', 'filter');
  renderCriteria('sort', 'sortBy');
  renderCriteria('group-by', 'groupBy', true);

  function renderCriteria(
    criterionType,
    criterionTypeCamelCase,
    renderCategoriesAsCriteria = false
  ) {
    var criteriaForCategory = criteria.filter(
      curry(criterionWorksAs)(criterionTypeCamelCase)
    );
    var criteriaByCategory = groupBy(criteriaForCategory, 'category');
    var root = container.select('.' + criterionType + '-list');
    var criteriaCategoryRoots = root
      .selectAll('.' + criterionType + '-category-root')
      .data(Object.keys(criteriaByCategory), accessor('identity'));

    criteriaCategoryRoots.exit().remove();
    var newCategoryRoots = criteriaCategoryRoots
      .enter()
      .append('div')
      .classed('' + criterionType + '-category-root', true);
    newCategoryRoots.append('h5').classed('category-title', true);
    newCategoryRoots
      .append('ul')
      .classed(criterionType + '-criteria-root', true);

    if (renderCategoriesAsCriteria) {
      newCategoryRoots.on('click', curry(onCriterionClick)(criterionType));
    }
    var currentCategoryRoots = newCategoryRoots.merge(criteriaCategoryRoots);
    currentCategoryRoots.select('.category-title').text(accessor('identity'));

    if (!renderCategoriesAsCriteria) {
      var filterCriteriaRoots = currentCategoryRoots.selectAll(
        '.' + criterionType + '-criteria-root'
      );
      var filterCriteriaForCategory = filterCriteriaRoots
        .selectAll('.criterion')
        .data(getCriteriaForCategory, makeCriterionId);
      filterCriteriaForCategory.exit().remove();
      filterCriteriaForCategory
        .enter()
        .append('li')
        .classed('criterion', true)
        .on('click', curry(onCriterionClick)(criterionType))
        .merge(filterCriteriaForCategory)
        .text(accessor('name'));
    }

    function getCriteriaForCategory(category) {
      return criteriaByCategory[category];
    }
  }

  function onCriterionClick(criterionType, criterion) {
    onCriteriaControlChange({ criterionSelected: criterion, criterionType });
  }
}

function criterionWorksAs(role, criterion) {
  return criterion.roles.indexOf(role) !== -1;
}

function makeCriterionId(c) {
  return c.category + '|' + c.name;
}

module.exports = renderArrangementControls;
