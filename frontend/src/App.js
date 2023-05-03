import React, { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useMeta } from 'react-meta-elements';
import { useSelector } from 'react-redux';
import * as Sentry from '@sentry/react';
import ReactPlaceholder from 'react-placeholder';

import './assets/styles/index.scss';

import { getUserDetails } from './store/actions/auth';
import { store } from './store';
import { ORG_NAME, MATOMO_ID } from './config';
import { Preloader } from './components/preloader';
import { FallbackComponent } from './views/fallback';
import { Banner, ArchivalNotificationBanner } from './components/banner/index';
import { router } from './routes';

const App = () => {
  useMeta({ property: 'og:url', content: process.env.REACT_APP_BASE_URL });
  useMeta({ name: 'author', content: ORG_NAME });
  const isLoading = useSelector((state) => state.loader.isLoading);
  const locale = useSelector((state) => state.preferences.locale);

  useEffect(() => {
    // fetch user details endpoint when the user is returning to a logged in session
    store.dispatch(getUserDetails(store.getState()));
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<FallbackComponent />}>
      {isLoading ? (
        <Preloader />
      ) : (
        <div className="w-100 base-font bg-white" lang={locale}>
          <main className="cf w-100 base-font">
            <Suspense fallback={<ReactPlaceholder showLoadingAnimation rows={30} delay={300} />}>
              <RouterProvider router={router} fallbackElement={<Preloader />} />
            </Suspense>
            <RouterProvider router={router} fallbackElement={<Preloader />} />
          </main>
          <ArchivalNotificationBanner />
          {MATOMO_ID && <Banner />}
        </div>
      )}
    </Sentry.ErrorBoundary>
  );
};

export default App;
