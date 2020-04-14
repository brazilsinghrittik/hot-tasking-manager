import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, redirectTo } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import { RectShape } from 'react-placeholder/lib/placeholders';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../network/genericJSONRequest';
import { Members } from '../components/teamsAndOrgs/members';
import { Teams } from '../components/teamsAndOrgs/teams';
import { Projects } from '../components/teamsAndOrgs/projects';
import {
  OrganisationForm,
  OrgInformation,
  OrgsManagement,
} from '../components/teamsAndOrgs/organisations';
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function ListOrganisations() {
  useSetTitleTag('Manage organizations');
  const token = useSelector((state) => state.auth.get('token'));
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const isOrgManager = useSelector((state) => state.auth.get('isOrgManager'));
  const [organisations, setOrganisations] = useState(null);
  const [userOrgsOnly, setUserOrgsOnly] = useState(true);
  useEffect(() => {
    if (token && userDetails && userDetails.id) {
      const queryParam = userOrgsOnly ? `?manager_user_id=${userDetails.id}` : '';
      fetchLocalJSONAPI(`organisations/${queryParam}`, token).then((orgs) =>
        setOrganisations(orgs.organisations),
      );
    }
  }, [userDetails, token, userOrgsOnly]);

  const placeHolder = (
    <div className="pb4 bg-tan">
      <RectShape className="bg-white dib mv2" style={{ width: 700, height: 250 }} />
      <RectShape className="bg-white dib mv2" style={{ width: 700, height: 250 }} />
    </div>
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      customPlaceholder={placeHolder}
      delay={10}
      ready={organisations !== null}
    >
      <OrgsManagement
        organisations={organisations}
        userOrgsOnly={userOrgsOnly}
        setUserOrgsOnly={setUserOrgsOnly}
        isOrgManager={userDetails.role === 'ADMIN' || isOrgManager}
        isAdmin={userDetails.role === 'ADMIN'}
      />
    </ReactPlaceholder>
  );
}

export function CreateOrganisation() {
  useSetTitleTag('Create new organization');
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [managers, setManagers] = useState([]);
  const [newOrgId, setNewOrgId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (userDetails && userDetails.username && managers.length === 0) {
      setManagers([{ username: userDetails.username, pictureUrl: userDetails.pictureUrl }]);
    }
  }, [userDetails, managers]);

  useEffect(() => {
    if (newOrgId) {
      redirectTo(`/manage/organisations/${newOrgId}`);
    }
  }, [newOrgId]);

  const addManagers = (values) => {
    const newValues = values.filter(
      (newUser) => !managers.map((i) => i.username).includes(newUser.username),
    );
    setManagers(managers.concat(newValues));
  };
  const removeManagers = (username) => {
    setManagers(managers.filter((i) => i.username !== username));
  };
  const createOrg = (payload) => {
    payload.managers = managers.map((user) => user.username);
    pushToLocalJSONAPI('organisations/', JSON.stringify(payload), token, 'POST')
      .then((result) => {
        setError(false);
        setNewOrgId(result.organisationId);
      })
      .catch((error) => {
        setError(true);
      });
  };

  return (
    <Form
      onSubmit={(values) => createOrg(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf pb5">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newOrganisation} />
              </h3>
              <div className="w-40-l w-100">
                <OrgInformation userDetails={userDetails} managers={managers} />
                <Members
                  addMembers={addManagers}
                  removeMembers={removeManagers}
                  members={managers}
                  creationMode={true}
                />
              </div>
            </div>
            <div className="bottom-0 right-0 left-0 cf bg-white h3 flex justify-end fixed">
              {error && (
                <div className="w-60-ns w-40-m w-50 h-100 tc pa3 bg-red white">
                  <FormattedMessage {...messages.createOrgError} />
                </div>
              )}
              <div className="w-20-l w-30-m w-50 h-100 tc">
                <Link to={'../'} onClick={() => setError(false)}>
                  <CustomButton className="bg-white pr2 h-100 bn bg-white blue-dark">
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </Link>
              </div>
              <div className="w-20-l w-30-m w-50 h-100 tc">
                <FormSubmitButton
                  disabled={submitting || pristine}
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                >
                  <FormattedMessage {...messages.createOrganisation} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
}

export function EditOrganisation(props) {
  useSetTitleTag('Edit organization');
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const token = useSelector((state) => state.auth.get('token'));
  const [initManagers, setInitManagers] = useState(false);
  const [managers, setManagers] = useState([]);
  const [error, loading, organisation] = useFetch(`organisations/${props.id}/`, props.id);
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?organisationId=${props.id}`,
    props.id,
  );
  const [updateError, setUpdateError] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!initManagers && organisation && organisation.managers) {
      setManagers(organisation.managers);
      setInitManagers(true);
    }
  }, [organisation, managers, initManagers]);

  const addManagers = (values) => {
    const newValues = values.filter(
      (newUser) => !managers.map((i) => i.username).includes(newUser.username),
    );
    setManagers(managers.concat(newValues));
  };
  const removeManagers = (username) => {
    setManagers(managers.filter((i) => i.username !== username));
  };

  const updateManagers = () => {
    let payload = JSON.stringify({ managers: managers.map((i) => i.username) });
    pushToLocalJSONAPI(`organisations/${props.id}/`, payload, token, 'PATCH');
  };

  const updateOrg = (payload) => {
    pushToLocalJSONAPI(`organisations/${props.id}/`, JSON.stringify(payload), token, 'PATCH')
      .then((response) => {
        if (updateError) setUpdateError(false);
        setEditMode(false);
      })
      .catch((e) => {
        setUpdateError(true);
      });
  };

  return (
    <div className="cf">
      <div className="cf pv4">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib">
          <FormattedMessage {...messages.manageOrganisation} />
        </h3>
        <DeleteModal
          id={organisation.organisationId}
          name={organisation.name}
          type="organisations"
        />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <OrganisationForm
          userDetails={userDetails}
          organisation={{ name: organisation.name, url: organisation.url, logo: organisation.logo }}
          updateOrg={updateOrg}
          updateError={updateError}
          editMode={editMode}
          setEditMode={setEditMode}
          disabledForm={error || loading}
        />
        <Members
          addMembers={addManagers}
          removeMembers={removeManagers}
          saveMembersFn={updateManagers}
          members={managers}
        />
      </div>
      <div className="w-60-l w-100 mt4 pl5-l pl0 fr">
        <Projects
          projects={!projectsLoading && !projectsError && projects}
          viewAllQuery={`?organisation=${organisation.name}`}
          ownerEntity="organisation"
        />
        <Teams teams={organisation.teams} viewAllQuery={`?organisationId=${props.id}`} />
      </div>
    </div>
  );
}
