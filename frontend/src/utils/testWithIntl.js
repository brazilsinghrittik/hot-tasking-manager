import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { BrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import TestRenderer from 'react-test-renderer';

import { store } from '../store';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

export const createComponentWithReduxAndIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<ReduxIntlProviders {...props}>{children}</ReduxIntlProviders>);
};

export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
};

export const ReduxIntlProviders = ({
  children,
  props = { locale: 'en' },
  localStore = null,
}: Object) => (
  <Provider store={localStore || store}>
    <IntlProvider {...props}>{children}</IntlProvider>
  </Provider>
);

export const IntlProviders = ({ children, props = { locale: 'en' } }: Object) => (
  <IntlProvider {...props}>{children}</IntlProvider>
);

export const createComponentWithMemoryRouter = (component, { route = '/starting/path' } = {}) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <>Navigated from Start</>,
      },
      {
        path: route,
        // Render the component causing the navigate to '/'
        element: component,
      },
      {
        path: '*',
        element: <>Avoid match warnings</>,
      },
    ],
    {
      // Set for where you want to start in the routes. Remember, KISS (Keep it simple, stupid) the routes.
      initialEntries: [route],
      // We don't need to explicitly set this, but it's nice to have.
      initialIndex: 0,
    },
  );

  const { container } = render(<RouterProvider router={router} />);

  return { container, router };
};
