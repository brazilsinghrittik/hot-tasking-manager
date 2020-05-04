import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on project cards.
 */
export default defineMessages({
  projectTotalContributors: {
    id: 'project.card.contributorCount',
    defaultMessage: '{number} total contributors',
  },
  projectLastContribution: {
    id: 'project.card.lastContribution',
    defaultMessage: 'Last contribution',
  },
  percentMapped: {
    id: 'project.card.percentMapped',
    defaultMessage: 'Mapped',
  },
  percentValidated: {
    id: 'project.card.percentValidated',
    defaultMessage: 'Validated',
  },
  percentBadImagery: {
    id: 'project.card.percentBadImagery',
    defaultMessage: 'Bad imagery',
  },
  projectPriorityURGENT: {
    id: 'project.card.projectPriorityUrgent',
    defaultMessage: 'Urgent',
  },
  projectPriorityHIGH: {
    id: 'project.card.projectPriorityHigh',
    defaultMessage: 'High',
  },
  projectPriorityMEDIUM: {
    id: 'project.card.projectPriorityMedium',
    defaultMessage: 'Medium',
  },
  projectPriorityLOW: {
    id: 'project.card.projectPriorityLow',
    defaultMessage: 'Low',
  },
  priorityDescriptionURGENT: {
    id: 'project.card.projectPriorityUrgent.description',
    defaultMessage: 'Urgent priority',
  },
  priorityDescriptionHIGH: {
    id: 'project.card.projectPriorityHigh.description',
    defaultMessage: 'High priority',
  },
  priorityDescriptionMEDIUM: {
    id: 'project.card.projectPriorityMedium.description',
    defaultMessage: 'Medium priority',
  },
  priorityDescriptionLOW: {
    id: 'project.card.projectPriorityLow.description',
    defaultMessage: 'Low priority',
  },
  dueDateRelativeRemainingDays: {
    id: 'project.card.dueDateLeft',
    defaultMessage: '{daysLeftHumanize} left',
  },
  editProject: {
    id: 'project.card.edit_project.button',
    defaultMessage: 'Edit',
  },
  projectPage: {
    id: 'project.card.project_page.button',
    defaultMessage: 'Project Page',
  },
  projectTasks: {
    id: 'project.card.project_tasks.button',
    defaultMessage: 'Tasks',
  },
});
