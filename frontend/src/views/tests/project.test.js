import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryParamProvider } from 'use-query-params';
import { act, screen, waitFor } from '@testing-library/react';

import { store } from '../../store';
import { ManageProjectsPage, UserProjectsPage } from '../project';
import {
  createComponentWithMemoryRouter,
  ReduxIntlProviders,
  renderWithRouter,
} from '../../utils/testWithIntl';
import { projects } from '../../network/tests/mockData/projects';

describe('UserProjectsPage Component', () => {
  it('should redirect to login page if no user token is present', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: null });
    });

    const { router } = createComponentWithMemoryRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <UserProjectsPage management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('should display component details', async () => {
    act(() => {
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <UserProjectsPage management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: projects.results[0].name })).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('heading', {
        name: /my projects/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /manage projects/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('should display map depending on the redux state value', async () => {
    act(() => {
      store.dispatch({ type: 'TOGGLE_MAP' });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <UserProjectsPage management={false} />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );
    await screen.findByRole('heading', { name: projects.results[0].name });
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});

describe('ManageProjectsPage', () => {
  it('should display correct details for manage projects', async () => {
    act(() => {
      store.dispatch({ type: 'SET_USER_DETAILS', userDetails: { id: 1, role: 'ADMIN' } });
      store.dispatch({ type: 'SET_TOKEN', token: 'validToken' });
    });

    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ManageProjectsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    await screen.findByRole('heading', { name: projects.results[0].name });
    expect(
      screen.getByRole('heading', {
        name: /manage projects/i,
      }),
    ).toBeInTheDocument();
  });

  it('should display map when show map switch is toggled', async () => {
    act(() => {
      store.dispatch({ type: 'TOGGLE_MAP' });
    });
    renderWithRouter(
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <ReduxIntlProviders>
          <ManageProjectsPage />
        </ReduxIntlProviders>
      </QueryParamProvider>,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox'));
    // Since WebGL is not supported by Node, we'll assume that the map context will be loaded
    expect(screen.getByRole('heading', { name: 'WebGL Context Not Found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGL is enabled' })).toBeInTheDocument();
  });
});
