import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on homepage.
 */
export default defineMessages({
  myTasks: {
    id: 'mytasks.mainSection.title',
    defaultMessage: 'My Tasks',
  },
  contribution: {
    id: 'mytasks.contribution',
    defaultMessage: 'Contribution',
  },
  all: {
    id: 'mytasks.filter.all',
    defaultMessage: 'All',
  },
  mapped: {
    id: 'mytasks.filter.mapped',
    defaultMessage: 'Mapped',
  },
  validated: {
    id: 'mytasks.filter.validated',
    defaultMessage: 'Validated',
  },
  invalidated: {
    id: 'mytasks.filter.invalidated',
    defaultMessage: 'More mapping needed',
  },
  archived: {
    id: 'mytasks.filter.archived',
    defaultMessage: 'Archived projects',
  },
  projects: {
    id: 'mytasks.filter.projects',
    defaultMessage: 'Projects',
  },
  tasks: {
    id: 'mytasks.filter.tasks',
    defaultMessage: 'Tasks',
  },
  clearFilters: {
    id: 'mytasks.filter.clear',
    defaultMessage: 'Clear filters',
  },
  errorLoadingTheXForY: {
    id: 'mytasks.navFilters.error',
    defaultMessage: 'Error loading the {xWord} for {yWord}',
  },
  showingXProjectsOfTotal: {
    id: 'mytasks.nav.showing',
    defaultMessage: 'Showing {numProjects} contributions{numRange} of {numTotalProjects}',
  },
  xNew: {
    id: 'mytasks.nav.xNew',
    defaultMessage: '{xNew} New',
  },
  lastUpdatedByUser: {
    id: 'mytasks.nav.lastUpdatedBy',
    defaultMessage: 'You worked on this task {time}',
  },
  viewAll: {
    id: 'mytasks.nav.viewAll',
    defaultMessage: 'View All',
  },
  delete: {
    id: 'mytasks.nav.delete.button',
    defaultMessage: 'Delete',
  },
  noContributed: {
    id: 'mytasks.nav.noContributedItems',
    defaultMessage: 'No Contributed Items',
  },
  resumeTask: {
    id: 'mytasks.nav.resumeMappingTask',
    defaultMessage: 'Resume task',
  },
  lockedByLockholder: {
    id: 'mytasks.nav.lockedByLockholder',
    defaultMessage: 'Locked by {lockholder}',
  },
  unlock: {
    id: 'mytasks.unlock',
    defaultMessage: 'unlock {time}',
  },
  projectTask: {
    id: 'mytasks.tasks.title',
    defaultMessage: 'Task #{task} · Project #{project}',
  },
});
