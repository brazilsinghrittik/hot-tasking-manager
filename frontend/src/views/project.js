import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';

import { ProjectNav } from '../components/projects/projectNav';
import { MyProjectNav } from '../components/projects/myProjectNav';
import { MoreFiltersForm } from '../components/projects/moreFiltersForm';
import { ProjectDetail } from '../components/projectDetail/index';
import { ProjectCardPaginator } from '../components/projects/projectCardPaginator';
import { ProjectSearchResults } from '../components/projects/projectSearchResults';
import { ProjectsMap } from '../components/projects/projectsMap';
import {
  useProjectsQueryAPI,
  useExploreProjectsQueryParams,
  stringify,
} from '../hooks/UseProjectsQueryAPI';
import { useTagAPI } from '../hooks/UseTagAPI';
import useForceUpdate from '../hooks/UseForceUpdate';
import { useFetch } from '../hooks/UseFetch';
import { NotFound } from './notFound';

const ProjectCreate = React.lazy(() => import('../components/projectCreate/index'));

export const CreateProject = (props) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectCreate {...props} />
    </Suspense>
  );
};

export const ProjectsPage = (props) => {
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);
  const [orgAPIState] = useTagAPI([], 'organisations');

  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'w-60-l w-100' : 'w-100';

  return (
    <div className="pull-center">
      <ProjectNav location={props.location} orgAPIState={orgAPIState}>
        {
          props.children
          /* This is where the MoreFilters component is rendered
        using the router, as a child route.
        */
        }
      </ProjectNav>
      <section className="cf">
        <ProjectSearchResults
          state={state}
          retryFn={forceUpdate}
          className={`${searchResultWidth} fl`}
        />
        {isMapShown && (
          <ProjectsMap
            state={state}
            fullProjectsQuery={fullProjectsQuery}
            setQuery={setProjectQuery}
            className={`dib w-40-l w-100 fl`}
          />
        )}
      </section>
      <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
    </div>
  );
};

export const UserProjectsPage = (props) => {
  const userToken = useSelector((state) => state.auth.get('token'));

  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };

  const [fullProjectsQuery, setProjectQuery] = useExploreProjectsQueryParams();
  const [forceUpdated, forceUpdate] = useForceUpdate();
  const [state] = useProjectsQueryAPI(initialData, fullProjectsQuery, forceUpdated);
  const [orgAPIState] = useTagAPI([], 'organisations');

  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const searchResultWidth = isMapShown ? 'w-60-l w-100' : 'w-100';

  if (!userToken) {
    /* use replace to so the back button does not get interrupted */
    props.navigate('/login', { replace: true });
  }

  if (
    !fullProjectsQuery.createdByMe &&
    !fullProjectsQuery.managedByMe &&
    !fullProjectsQuery.mappedByMe &&
    !fullProjectsQuery.favoritedByMe &&
    !fullProjectsQuery.status
  ) {
    setProjectQuery({ managedByMe: true });
  }

  return (
    <div className="pull-center bg-tan">
      <MyProjectNav
        location={props.location}
        orgAPIState={orgAPIState}
        management={props.management}
      >
        {
          props.children
          /* This is where the MoreFilters component is rendered
        using the router, as a child route.
        */
        }
      </MyProjectNav>
      <section className="cf">
        <ProjectSearchResults
          state={state}
          retryFn={forceUpdate}
          className={`${searchResultWidth} fl`}
          showBottomButtons={props.location && props.location.pathname.startsWith('/manage/')}
        />
        {isMapShown && (
          <ProjectsMap
            state={state}
            fullProjectsQuery={fullProjectsQuery}
            setQuery={setProjectQuery}
            className={`dib w-40-l w-100 fl`}
          />
        )}
      </section>
      <ProjectCardPaginator projectAPIstate={state} setQueryParam={setProjectQuery} />
    </div>
  );
};

export const ProjectsPageIndex = (props) => {
  return null;
};

export const MoreFilters = (props) => {
  const [fullProjectsQuery] = useExploreProjectsQueryParams();

  const currentUrl = `/explore${
    stringify(fullProjectsQuery) ? ['?', stringify(fullProjectsQuery)].join('') : ''
  }`;
  return (
    <>
      <div className="absolute left-0 z-4 mt1 w-40-l w-100 h-100 bg-white h4 ph1 ph5-l">
        <MoreFiltersForm currentUrl={currentUrl} />
        {props.children}
      </div>
      <div
        onClick={() => props.navigate(currentUrl)}
        className="absolute right-0 z-5 br w-60-l w-0 h-100 bg-blue-dark o-70 h6"
      ></div>
    </>
  );
};

export const ProjectDetailPage = (props) => {
  const userPreferences = useSelector((state) => state.preferences);

  // replace by queries/summary/ soon
  const [visualError, visualLoading, visualData] = useFetch(
    `projects/${props.id}/contributions/queries/day/`,
  );
  const [error, loading, data] = useFetch(`projects/${props.id}/`);
  /* eslint-disable-next-line */
  const [contributorsError, contributorsLoading, contributors] = useFetch(
    `projects/${props.id}/contributions/`,
  );

  return error || visualError ? (
    <NotFound />
  ) : (
    <ProjectDetail
      project={data}
      projectLoading={loading}
      userPreferences={userPreferences}
      percentDoneVisData={visualData}
      percentDoneVisLoading={visualLoading}
      tasksError={error}
      tasks={data.tasks}
      contributors={contributors.userContributions || []}
      navigate={props.navigate}
      type="detail"
    />
  );
};

export const ManageProjectsPage = (props) => <UserProjectsPage {...props} management={true} />;
