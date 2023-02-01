import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { PriorityBox } from '../projectCard/priorityBox';
import { translateCountry } from '../../utils/countries';
import { ProjectVisibilityBox } from './visibilityBox';
import { ProjectStatusBox } from './statusBox';
import { EditButton } from '../button';
import { useEditProjectAllowed } from '../../hooks/UsePermissions';

export function HeaderLine({ author, projectId, priority, showEditLink, organisation }: Object) {
  const projectIdLink = (
    <Link to={`/projects/${projectId}`} className="no-underline pointer">
      <span className="blue-light">#{projectId}</span>
    </Link>
  );
  return (
    <div className="flex flex-column flex-row-ns justify-start justify-between-ns items-start items-center-ns flex-wrap">
      <div className="pv2">
        <span className="blue-light">{projectIdLink}</span>
        {organisation ? <span className="blue-dark"> | {organisation}</span> : null}
      </div>
      <div className="tr">
        {showEditLink && (
          <EditButton url={`/manage/projects/${projectId}`} className="mh0 mv0">
            <FormattedMessage {...messages.editProject} />
          </EditButton>
        )}
        {priority && (
          <div className="mw4 dib">
            <PriorityBox priority={priority} extraClasses={'pv2 ph3 ml2'} showIcon />
          </div>
        )}
      </div>
    </div>
  );
}

export const ProjectHeader = ({ project, showEditLink }: Object) => {
  const locale = useSelector((state) => state.preferences.locale);
  const [userCanEditProject] = useEditProjectAllowed(project);

  return (
    <>
      <HeaderLine
        author={project.author}
        projectId={project.projectId}
        priority={project.projectPriority}
        organisation={project.organisationName}
        showEditLink={showEditLink && userCanEditProject}
      />
      <div>
        <h3
          className="f2 fw5 mt3 mt2-ns mb3 ttu barlow-condensed blue-dark dib mr3"
          lang={project.projectInfo.locale}
        >
          {project.projectInfo && project.projectInfo.name}
        </h3>
        {project.private && <ProjectVisibilityBox className="pv2 ph3 mb3 mr3 v-mid dib" />}
        {['DRAFT', 'ARCHIVED'].includes(project.status) && (
          <ProjectStatusBox status={project.status} className="pv2 ph3 mb3 v-mid dib mr3" />
        )}
      </div>
      <TagLine
        campaigns={project.campaigns}
        countries={
          locale.includes('en') ? project.countryTag : translateCountry(project.countryTag, locale)
        }
      />
    </>
  );
};

function TagLine({ campaigns = [], countries = [] }: Object) {
  let tags = [];
  tags = campaigns.map((i) => i.name).concat(countries);
  return (
    <span className="blue-light">
      {tags.map((tag, n) => (
        <span key={n}>
          <span className={n === 0 ? 'dn' : 'ph2'}>&#183;</span>
          {tag}
        </span>
      ))}
    </span>
  );
}
