import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

import { MultipleTaskHistoriesAccordion } from '../multipleTaskHistories';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';

describe('MultipleTaskHistories Accordion', () => {
  let handleChange = jest.fn();

  it('does not render accordion with task history items if there are no tasks', () => {
    render(
      <ReduxIntlProviders>
        <MultipleTaskHistoriesAccordion handleChange={handleChange} tasks={[]} projectId={1} />
      </ReduxIntlProviders>,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByText(/Comments/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Activities/i)).not.toBeInTheDocument();
  });

  it('renders accordion correctly with task history items for 2 tasks', () => {
    const tasks = [
      {
        taskId: 1,
        taskHistory: [
          {
            historyId: 11334,
            taskId: 1,
            action: 'STATE_CHANGE',
            actionText: 'VALIDATED',
            actionDate: '2020-09-04T14:35:20.174515Z',
            actionBy: 'user_123',
            pictureUrl: null,
            issues: null,
          },
        ],
      },
      {
        taskId: 2,
        taskHistory: [
          {
            historyId: 5705,
            taskId: 2,
            action: 'STATE_CHANGE',
            actionText: 'MAPPED',
            actionDate: '2020-04-08T10:19:53.537193Z',
            actionBy: 'test_user',
            pictureUrl: null,
            issues: null,
          },
        ],
      },
    ];
    render(
      <ReduxIntlProviders>
        <MultipleTaskHistoriesAccordion handleChange={handleChange} tasks={tasks} projectId={1} />
      </ReduxIntlProviders>,
    );

    expect(screen.getByText(/Task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Task 2/i)).toBeInTheDocument();

    const taskAccordionItems = screen.getAllByRole('button');
    taskAccordionItems.forEach((taskBtn) => {
      fireEvent.click(taskBtn);
    });

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText(/Comments/i)).toHaveLength(2);
    expect(screen.getAllByText(/Activities/i)).toHaveLength(2);
  });
});
