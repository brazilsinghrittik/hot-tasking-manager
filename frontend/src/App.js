import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

import ReactPlaceholder from 'react-placeholder';
import { useMeta } from 'react-meta-elements';
import { connect } from 'react-redux';
import * as Sentry from '@sentry/react';

import { getUserDetails } from './store/actions/auth';
import { store } from './store';
import './assets/styles/index.scss';
import { ORG_NAME, MATOMO_ID } from './config';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Preloader } from './components/preloader';
import { Home } from './views/home';
import { FallbackComponent } from './views/fallback';
import { AboutPage } from './views/about';
import { LearnPage } from './views/learn';
import { QuickstartPage } from './views/quickstart';
import { UserDetail } from './views/userDetail';
import {
  UserProjectsPage,
  ManageProjectsPage,
  CreateProject,
  ProjectsPage,
  ProjectsPageIndex,
  MoreFilters,
  ProjectDetailPage,
} from './views/project';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { Settings } from './views/settings';
import { ManagementPageIndex, ManagementSection } from './views/management';
import {
  ListOrganisations,
  CreateOrganisation,
  EditOrganisation,
} from './views/organisationManagement';
import { OrganisationDetail } from './views/organisationDetail';
import { OrganisationStats } from './views/organisationStats';
import { MyTeams, ManageTeams, CreateTeam, EditTeam, TeamDetail } from './views/teams';
import { ListCampaigns, CreateCampaign, EditCampaign } from './views/campaigns';
import { ListInterests, CreateInterest, EditInterest } from './views/interests';
import { ListLicenses, CreateLicense, EditLicense } from './views/licenses';
import { Stats } from './views/stats';
import { UsersList } from './views/users';
import { NotFound } from './views/notFound';
import { SelectTask } from './views/taskSelection';
import { MapTask, ValidateTask } from './views/taskAction';
import { EmailVerification } from './views/verifyEmail';
import { ProjectStats } from './views/projectStats';
import { ContactPage } from './views/contact';
import { SwaggerView } from './views/swagger';
import { ContributionsPage, ContributionsPageIndex, UserStats } from './views/contributions';
import { NotificationsPage } from './views/notifications';
import { Banner, ArchivalNotificationBanner } from './components/banner/index';
import { TopBanner } from './components/banner/topBanner';

const ProjectEdit = React.lazy(() =>
  import('./views/projectEdit' /* webpackChunkName: "projectEdit" */),
);

// Use this to Redirect to intended page
function Redirect({ to }) {
  let navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  });
  return null;
}

let App = (props) => {
  useMeta({ property: 'og:url', content: process.env.REACT_APP_BASE_URL });
  useMeta({ name: 'author', content: ORG_NAME });
  const { isLoading } = props;

  useEffect(() => {
    // fetch user details endpoint when the user is returning to a logged in session
    store.dispatch(getUserDetails(store.getState()));
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<FallbackComponent />}>
      {isLoading ? (
        <Preloader />
      ) : (
        <div className="w-100 base-font bg-white" lang={props.locale}>
          <TopBanner />
          <Header />
          <main className="cf w-100 base-font">
            <Suspense
              fallback={<ReactPlaceholder showLoadingAnimation={true} rows={30} delay={300} />}
            >
              <QueryParamProvider adapter={ReactRouter6Adapter}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="explore" element={<ProjectsPage />}>
                    <Route index element={<ProjectsPageIndex />} />
                    <Route path="filters/*" element={<MoreFilters />} />
                  </Route>
                  <Route path="projects/:id" element={<ProjectDetailPage />} />
                  <Route path="projects/:id/tasks" element={<SelectTask />} />
                  <Route path="projects/:id/map" element={<MapTask />} />
                  <Route path="projects/:id/validate" element={<ValidateTask />} />
                  <Route path="projects/:id/stats" element={<ProjectStats />} />
                  <Route path="organisations/:id/stats/" element={<OrganisationStats />} />
                  <Route path="organisations/:slug/" element={<OrganisationDetail />} />
                  <Route path="learn" element={<Redirect to="map" />} />
                  <Route path="learn/:type" element={<LearnPage />} />
                  <Route path="learn/quickstart" element={<QuickstartPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact/" element={<ContactPage />} />
                  <Route path="contributions" element={<ContributionsPageIndex />}>
                    <Route index element={<UserStats />} />
                    <Route path="tasks/*" element={<ContributionsPage />} />
                    <Route path="projects/*" element={<UserProjectsPage />} />
                    <Route path="teams/*" element={<MyTeams />} />
                  </Route>
                  {/* <Route path="/contributions" element={<UserStats />} /> */}
                  <Route path="users/:username" element={<UserDetail />} />
                  <Route path="inbox" element={<NotificationsPage />} />
                  <Route path="authorized" element={<Authorized />} />
                  <Route path="login" element={<Login />} />
                  <Route path="welcome" element={<Welcome />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="verify-email" element={<EmailVerification />} />
                  <Route path="manage" element={<ManagementSection />}>
                    <Route index element={<ManagementPageIndex />} />
                    <Route path="stats/" element={<Stats />} />
                    <Route path="organisations/" element={<ListOrganisations />} />
                    <Route path="organisations/new/" element={<CreateOrganisation />} />
                    <Route path="organisations/:id/" element={<EditOrganisation />} />
                    <Route path="teams/" element={<ManageTeams />} />
                    <Route path="users/" element={<UsersList />} />
                    <Route path="teams/new" element={<CreateTeam />} />
                    <Route path="teams/:id" element={<EditTeam />} />
                    <Route path="campaigns/" element={<ListCampaigns />} />
                    <Route path="campaigns/new" element={<CreateCampaign />} />
                    <Route path="campaigns/:id" element={<EditCampaign />} />
                    <Route path="projects/new" element={<CreateProject />} />
                    <Route path="projects/:id" element={<ProjectEdit />} />
                    <Route path="projects/*" element={<ManageProjectsPage />} />
                    <Route path="categories/" element={<ListInterests />} />
                    <Route path="categories/:id" element={<EditInterest />} />
                    <Route path="categories/new" element={<CreateInterest />} />
                    <Route path="licenses/new" element={<CreateLicense />} />
                    <Route path="licenses/" element={<ListLicenses />} />
                    <Route path="licenses/:id" element={<EditLicense />} />
                  </Route>
                  <Route path="teams/:id/membership" element={<TeamDetail />} />
                  <Route path="/api-docs/" element={<SwaggerView />} />
                  <Route path="project/:id" element={<Redirect to="/projects/:id" />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </QueryParamProvider>
            </Suspense>
          </main>
          <Footer />
          <ArchivalNotificationBanner />
          {MATOMO_ID && <Banner />}
        </div>
      )}
    </Sentry.ErrorBoundary>
  );
};

const mapStateToProps = (state) => ({
  isLoading: state.loader.isLoading,
  locale: state.preferences.locale,
});

App = connect(mapStateToProps)(App);

export default App;
