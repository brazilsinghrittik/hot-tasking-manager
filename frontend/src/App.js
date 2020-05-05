import React from 'react';
import { Router, Redirect, globalHistory } from '@reach/router';
import { QueryParamProvider } from 'use-query-params';
import { useMeta } from 'react-meta-elements';
import { connect } from 'react-redux';

import './assets/styles/index.scss';
import { ORG_NAME, MATOMO_ID } from './config';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Preloader } from './components/preloader';
import { Home } from './views/home';
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
import { ListOrganisations, CreateOrganisation, EditOrganisation } from './views/organisations';
import { MyTeams, ManageTeams, CreateTeam, EditTeam, TeamDetail } from './views/teams';
import { ListCampaigns, CreateCampaign, EditCampaign } from './views/campaigns';
import { ListInterests, CreateInterest, EditInterest } from './views/interests';
import { ListLicenses, CreateLicense, EditLicense } from './views/licenses';
import { UsersList } from './views/users';
import { NotFound } from './views/notFound';
import { SelectTask } from './views/taskSelection';
import { MapTask, ValidateTask } from './views/taskAction';
import { EmailVerification } from './views/verifyEmail';
import { ProjectEdit } from './views/projectEdit';
import { ContactPage } from './views/contact';
import { SwaggerView } from './views/swagger';
import { ContributionsPage, ContributionsPageIndex, UserStats } from './views/contributions';
import {
  NotificationsPage,
  NotificationPageIndex,
  NotificationDetail,
} from './views/notifications';
import { Banner } from './components/banner/index';

/*TODO(tdk): if QueryParamProvider is not needed elsewhere,
 *  create special sub-router for Projects page and wrap it only around that */
let App = (props) => {
  useMeta({ property: 'og:url', content: process.env.REACT_APP_BASE_URL });
  useMeta({ name: 'author', content: ORG_NAME });
  const { isLoading } = props;

  return (
    <>
      {isLoading ? (
        <Preloader />
      ) : (
        <div className="w-100 base-font bg-white" lang={props.locale}>
          <Router>
            <Header path="/*" />
          </Router>
          <div className="cf w-100 base-font">
            <QueryParamProvider reachHistory={globalHistory}>
              <Router primary={false}>
                <Home path="/" />
                <ProjectsPage path="explore">
                  <ProjectsPageIndex path="/" />
                  <MoreFilters path="/filters/*" />
                </ProjectsPage>
                <LearnPage path="learn" />
                <QuickstartPage path="learn/quickstart" />
                <ContributionsPageIndex path="contributions">
                  <UserStats path="/" />
                  <ContributionsPage path="tasks/*" />
                  <UserProjectsPage path="projects/*" />
                  <MyTeams path="teams/*" />
                </ContributionsPageIndex>
                <AboutPage path="about" />
                <Authorized path="authorized" />
                <Login path="login" />
                <Welcome path="welcome" />
                <Settings path="settings" />
                <EmailVerification path="verify-email" />
                <ManagementSection path="manage">
                  <ManagementPageIndex path="/" />
                  <ListOrganisations path="organisations/" />
                  <CreateOrganisation path="organisations/new/" />
                  <EditOrganisation path="organisations/:id/" />
                  <ManageTeams path="teams/" />
                  <UsersList path="users/" />
                  <CreateTeam path="teams/new" />
                  <EditTeam path="teams/:id" />
                  <ListCampaigns path="campaigns/" />
                  <CreateCampaign path="campaigns/new" />
                  <EditCampaign path="campaigns/:id" />
                  <CreateProject path="projects/new" />
                  <ProjectEdit path="projects/:id" />
                  <ManageProjectsPage path="projects/*" />
                  <ListInterests path="categories/" />
                  <EditInterest path="categories/:id" />
                  <CreateInterest path="categories/new" />
                  <CreateLicense path="licenses/new" />
                  <ListLicenses path="licenses/" />
                  <EditLicense path="licenses/:id" />
                </ManagementSection>
                <TeamDetail path="teams/:id/membership" />
                <SelectTask path="projects/:id/tasks" />
                <MapTask path="projects/:id/map" />
                <UserDetail path="users/:username" />
                <ValidateTask path="projects/:id/validate" />
                <NotificationsPage path="inbox">
                  <NotificationPageIndex path="/" />
                  <NotificationDetail path="message/:id" />
                </NotificationsPage>
                <ProjectDetailPage path="projects/:id" />
                <ContactPage path="contact/" />
                <SwaggerView path="/api-docs/" />
                <Redirect from="project/:id" to="/projects/:id" noThrow />
                <Redirect from="contribute/" to="/explore" noThrow />
                <NotFound default />
              </Router>
            </QueryParamProvider>
          </div>
          {MATOMO_ID && <Banner />}
          <Router primary={false}>
            <Footer path="/*" />
          </Router>
        </div>
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  isLoading: state.loader.isLoading,
  locale: state.preferences.locale,
});

App = connect(mapStateToProps)(App);

export default App;
