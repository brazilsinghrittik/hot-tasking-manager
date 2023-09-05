import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Form, Field, useFormState } from 'react-final-form';
import ReactTooltip from 'react-tooltip';

import messages from './messages';
import { ExternalLinkIcon, InfoIcon } from '../svgIcons';
import { useEditTeamAllowed } from '../../hooks/UsePermissions';
import { UserAvatar, UserAvatarList } from '../user/avatar';
import { AddButton, ViewAllLink, Management, VisibilityBox, JoinMethodBox } from './management';
import { RadioField, OrganisationSelectInput, TextField } from '../formInputs';
import { Button, CustomButton, EditButton } from '../button';
import { nCardPlaceholders } from './teamsPlaceholder';
import { OSM_TEAMS_API_URL } from '../../config';
import { Alert } from '../alert';
import Popup from 'reactjs-popup';
import { LeaveTeamConfirmationAlert } from './leaveTeamConfirmationAlert';

export function TeamsManagement({
  teams,
  userDetails,
  managementView,
  userTeamsOnly,
  setUserTeamsOnly,
  isTeamsFetched,
  query,
  setQuery,
}: Object) {
  const isOrgManager = useSelector(
    (state) => state.auth.organisations && state.auth.organisations.length > 0,
  );

  const onSearchInputChange = (e) =>
    setQuery({ ...query, searchQuery: e.target.value || undefined, page: 1 }, 'pushIn');

  const clearSearchQuery = () => setQuery({ ...query, searchQuery: undefined, page: 1 }, 'pushIn');

  return (
    <Management
      title={
        managementView ? (
          <FormattedMessage
            {...messages.manage}
            values={{ entity: <FormattedMessage {...messages.teams} /> }}
          />
        ) : (
          <FormattedMessage {...messages.myTeams} />
        )
      }
      isAdmin={userDetails.role === 'ADMIN' && managementView}
      showAddButton={(userDetails.role === 'ADMIN' || isOrgManager) && managementView}
      managementView={managementView}
      userOnly={userTeamsOnly}
      setUserOnly={setUserTeamsOnly}
      userOnlyLabel={<FormattedMessage {...messages.myTeams} />}
    >
      <div className="w-20-l w-25-m">
        <TextField
          value={query.searchQuery || ''}
          placeholderMsg={messages.searchTeams}
          onChange={onSearchInputChange}
          onCloseIconClick={clearSearchQuery}
        />
      </div>
      <div className="cards-container mt2">
        <ReactPlaceholder
          showLoadingAnimation={true}
          customPlaceholder={nCardPlaceholders(4)}
          delay={10}
          ready={isTeamsFetched}
        >
          {teams?.length ? (
            teams.map((team, n) => <TeamCard team={team} key={n} />)
          ) : (
            <div className="pb3 pt2">
              <FormattedMessage {...messages.noTeams} />
            </div>
          )}
        </ReactPlaceholder>
      </div>
    </Management>
  );
}

export function Teams({ teams, viewAllQuery, showAddButton = false, isReady, border = true }) {
  return (
    <div className={`bg-white ${border ? 'b--grey-light ba pa4' : ''}`}>
      <div className="cf db">
        <h3 className="f3 barlow-condensed ttu blue-dark mv0 fw6 dib v-mid">
          <FormattedMessage {...messages.teams} />
        </h3>
        {showAddButton && (
          <Link to={'/manage/teams/new/'} className="dib ml4">
            <AddButton />
          </Link>
        )}
        {viewAllQuery && <ViewAllLink link={`/manage/teams/${viewAllQuery ? viewAllQuery : ''}`} />}
        <div className="cards-container pt4">
          <ReactPlaceholder customPlaceholder={nCardPlaceholders(4)} delay={10} ready={isReady}>
            {teams?.slice(0, 6).map((team) => (
              <TeamCard key={team.teamId} team={team} />
            ))}
            {teams?.length === 0 && (
              <span className="blue-grey">
                <FormattedMessage {...messages.noTeamsFound} />
              </span>
            )}
          </ReactPlaceholder>
        </div>
      </div>
    </div>
  );
}

export function TeamCard({ team }: Object) {
  return (
    <Link to={`/teams/${team.teamId}/membership/`} className="no-underline">
      <article className="base-font blue-dark h-100 bg-white ph3 pb3 ba br1 shadow-hover h-100 flex flex-column justify-between b--card">
        <div className="">
          <h3 className="f4 fw6 h3 lh-title mt3 mb2 overflow-y-hidden" title={team.name}>
            {team.name}
          </h3>
          <div className="db h2" title={team.organisation}>
            <img src={team.logo} alt={team.organisation} className="h2" />
          </div>
          <h4 className="f6 fw5 mb2 mt3 ttu blue-light">
            <FormattedMessage {...messages.managers} />
          </h4>
          <div className="db h2">
            <UserAvatarList
              size="small"
              textColor="white"
              users={team.members.filter((user) => user.function === 'MANAGER' && user.active)}
              maxLength={8}
              totalCount={team.managersCount}
            />
          </div>
          <h4 className="f6 fw5 mv2 ttu blue-light">
            <FormattedMessage {...messages.teamMembers} />
          </h4>
          <div className="db h2">
            <UserAvatarList
              size="small"
              textColor="white"
              users={team.members.filter((user) => user.function !== 'MANAGER' && user.active)}
              maxLength={8}
              totalCount={team.membersCount}
            />
          </div>
        </div>
        <div className="pt3">
          <VisibilityBox visibility={team.visibility} extraClasses="pv1 ph2 dib" />
          <div className="pt2 h2">
            <JoinMethodBox className="pv1 ph2 dib" joinMethod={team.joinMethod} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export function TeamInformation({ disableJoinMethodField }) {
  const intl = useIntl();
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';
  const formState = useFormState();
  const joinMethods = {
    ANY: 'anyoneCanJoin',
    BY_REQUEST: 'byRequest',
    BY_INVITE: 'byInvite',
    OSM_TEAMS: 'OSMTeams',
  };

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.description} />
        </label>
        <Field name="description" component="textarea" type="text" className={fieldClasses} />
      </div>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.organisation} />
        </label>
        <OrganisationSelectInput name="organisation_id" />
      </div>
      <div className="cf pt1">
        <label className={labelClasses}>
          <FormattedMessage {...messages.joinMethod} />
        </label>
        {Object.keys(joinMethods).map((method) => (
          <div className="pv2" key={method}>
            <RadioField
              name="joinMethod"
              value={method}
              required
              disabled={disableJoinMethodField || method === 'OSM_TEAMS'}
            />
            <span className="f5">
              <FormattedMessage {...messages[joinMethods[method]]} />
            </span>
            <InfoIcon
              width={12}
              height={12}
              className="blue-grey v-mid pb1 ml2"
              data-tip={intl.formatMessage(messages[`${joinMethods[method]}Description`])}
            />
            <ReactTooltip place="bottom" className="mw6" effect="solid" />
          </div>
        ))}
      </div>
      {['BY_INVITE', 'OSM_TEAMS'].includes(formState.values.joinMethod) && (
        <div className="cf pt1">
          <label className={labelClasses}>
            <FormattedMessage {...messages.visibility} />
          </label>
          <div className="pv2">
            <RadioField name="visibility" value="PUBLIC" />
            <span className=" f5">
              <FormattedMessage {...messages.public} />
            </span>
            <InfoIcon
              width={12}
              height={12}
              className="blue-grey v-mid pb1 ml2"
              data-tip={intl.formatMessage(messages['publicDescription'])}
            />
          </div>
          <div className="pv2">
            <RadioField name="visibility" value="PRIVATE" />
            <span className="f5">
              <FormattedMessage {...messages.private} />
            </span>
            <InfoIcon
              width={12}
              height={12}
              className="blue-grey v-mid pb1 ml2"
              data-tip={intl.formatMessage(messages['privateDescription'])}
            />
            <ReactTooltip place="bottom" className="mw6" effect="solid" />
          </div>
        </div>
      )}
    </>
  );
}

export function TeamForm(props) {
  return (
    <Form
      onSubmit={(values) => props.updateTeam(values)}
      initialValues={props.team}
      mutators={{
        setValue: [],
      }}
      render={({
        handleSubmit,
        dirty,
        submitSucceeded,
        dirtySinceLastSubmit,
        form,
        submitting,
        values,
      }) => {
        const dirtyForm = submitSucceeded ? dirtySinceLastSubmit && dirty : dirty;
        return (
          <div className="blue-grey mb3">
            <div className={`bg-white b--grey-light pa4 ${dirtyForm ? 'bt bl br' : 'ba'}`}>
              <h3 className="f3 fw6 dib blue-dark mv0">
                <FormattedMessage {...messages.teamInfo} />
              </h3>
              <form id="team-form" onSubmit={handleSubmit}>
                <fieldset className="bn pa0" disabled={submitting}>
                  <TeamInformation disableJoinMethodField={Boolean(props.team.osm_teams_id)} />
                </fieldset>
              </form>
            </div>
            {dirtyForm && (
              <div className="cf pt0 h3">
                <div className="w-70-l w-50 fl tr dib bg-grey-light">
                  <Button className="blue-dark bg-grey-light h3" onClick={() => form.restart()}>
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                </div>
                <div className="w-30-l w-50 h-100 fr dib">
                  <Button
                    onClick={() => handleSubmit()}
                    className="w-100 h-100 bg-red white"
                    disabledClassName="bg-red o-50 white w-100 h-100"
                  >
                    <FormattedMessage {...messages.save} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      }}
    ></Form>
  );
}

export function TeamSideBar({ team, members, managers, requestedToJoin }: Object) {
  const [isUserTeamManager] = useEditTeamAllowed(team);
  const [searchQuery, setSearchQuery] = useState('');

  const searchMembers = () =>
    searchQuery !== ''
      ? members.filter((member) => {
          return member.username.toLowerCase().includes(searchQuery.toLowerCase());
        })
      : members;

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      type="media"
      rows={20}
      ready={typeof team.teamId === 'number'}
    >
      <div className="cf pb2">
        <div className="w-20 pv2 dib fl">
          <span className="blue-grey v-mid">
            <FormattedMessage {...messages.team} /> #{team.teamId}
          </span>
        </div>
        <div className="w-80 dib fr tr">
          {isUserTeamManager && (
            <EditButton url={`/manage/teams/${team.teamId}`}>
              <FormattedMessage {...messages.editTeam} />
            </EditButton>
          )}
          <JoinMethodBox className="pv2 ph3 mh1 mv1 dib" joinMethod={team.joinMethod} />
          <VisibilityBox visibility={team.visibility} extraClasses="pv2 ph3 mh1 mv1 dib" />
        </div>
      </div>
      <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">{team.name}</h3>
      <p className="blue-grey">{team.description}</p>
      <div className="cf">
        <div className="w-100 w-50-m fl">
          <h4>
            <FormattedMessage {...messages.organisation} />
          </h4>
          <Link
            className="link blue-dark fw5 mr2 underline dib"
            to={`/organisations/${team.organisationSlug}`}
          >
            <p>
              {typeof team.logo === 'string' && (
                <img src={team.logo} alt="organisation logo" className="mw4" />
              )}
            </p>
            {team.organisation}
          </Link>
        </div>
        <div className="w-100 w-50-m fl">
          <h4>
            <FormattedMessage {...messages.managers} />
          </h4>
          {managers.length === 0 ? (
            <span className="f6 blue-grey">
              <FormattedMessage {...messages.noManagers} />
            </span>
          ) : (
            <div className="cf db mt3">
              {managers.map((user) => (
                <UserAvatar
                  key={user.username}
                  username={user.username}
                  picture={user.pictureUrl}
                  size="large"
                  colorClasses="white bg-blue-grey mv1"
                />
              ))}
            </div>
          )}
          <h4>
            <FormattedMessage {...messages.members} />
          </h4>
          {members.length === 0 ? (
            <span className="f6 blue-grey">
              <FormattedMessage {...messages.noMembers} />
            </span>
          ) : (
            <>
              <div className="cf db mt3">
                <div className="mb3 w5">
                  <TextField
                    value={searchQuery}
                    placeholderMsg={messages.searchMembers}
                    onChange={({ target: { value } }) => setSearchQuery(value)}
                    onCloseIconClick={() => setSearchQuery('')}
                  />
                </div>
                {searchMembers().map((user) => (
                  <UserAvatar
                    key={user.username}
                    username={user.username}
                    picture={user.pictureUrl}
                    colorClasses="white bg-blue-grey mv1"
                  />
                ))}
              </div>
            </>
          )}
          <div className="cf db mt3">
            {requestedToJoin && (
              <span className="red pr5-ns">
                <FormattedMessage {...messages.waitingApproval} />
              </span>
            )}
          </div>
          {team.osm_teams_id && (
            <Alert type="info">
              <FormattedMessage
                {...messages.osmTeamsReSyncHelp}
                values={{ osmTeams: 'OSM Teams' }}
                />{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${OSM_TEAMS_API_URL}/teams/${team.osm_teams_id}`}
                className="blue-grey link o-75 bn f5"
                >
                <FormattedMessage {...messages.openOnOsmTeams} />
                <ExternalLinkIcon className={'pl1'} />
              </a>
            </Alert>
          )}
        </div>
      </div>
    </ReactPlaceholder>
  );
}

export function TeamsBoxList({ teams }: Object) {
  const mappingTeams = teams.filter((team) => team.role === 'MAPPER');
  const validationTeams = teams.filter((team) => team.role === 'VALIDATOR');
  return (
    <div className="flex flex-column flex-row-l gap-1">
      {mappingTeams.length > 0 && (
        <div className="w-100 w-30-l">
          <h4 className="mb1 fw6 mt0">
            <FormattedMessage {...messages.mappingTeams} />
          </h4>
          <div>
            {mappingTeams.map((team) => (
              <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
            ))}
          </div>
        </div>
      )}
      {validationTeams.length > 0 && (
        <div className="w-100 w-30-l">
          <h4 className="mb1 fw6 mt0">
            <FormattedMessage {...messages.validationTeams} />
          </h4>
          {validationTeams.map((team) => (
            <TeamBox key={team.teamId} team={team} className="dib pv2 ph3 mt2 ba f6 tc" />
          ))}
        </div>
      )}
    </div>
  );
}

export const TeamBox = ({ team, className }: Object) => (
  <Link className="link blue-grey mr2" to={`/teams/${team.teamId}/membership/`}>
    <div className={`br1 ${className}`}>
      {team.logo && (
        <img alt={team.organisation} src={team.logo} className="object-fit-contain h2 pr2 v-mid" />
      )}
      {team.name}
    </div>
  </Link>
);

export const TeamDetailPageFooter = ({ team, isMember, joinTeamFn, leaveTeamFn }) => {
  return (
    <div className="fixed bottom-0 cf bg-white h3 w-100">
      <div
        className={`${
          team.joinMethod === 'BY_INVITE' && !isMember ? 'w-100-ns' : 'w-80-ns'
        } w-60-m w-50 h-100 fl tr`}
      >
        <Link to={'/contributions/teams'}>
          <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
            <FormattedMessage {...messages.myTeams} />
          </CustomButton>
        </Link>
      </div>
      <div className="w-20-l w-40-m w-50 h-100 fr">
        {isMember ? (
          <Popup
            trigger={
              <CustomButton
                className="w-100 h-100 bg-red b--red white"
                disabledClassName="bg-red b--red o-50 white w-100 h-100"
                disabled={team.joinMethod === 'OSM_TEAMS'}
              >
                <FormattedMessage
                  {...messages[isMember === 'requested' ? 'cancelRequest' : 'leaveTeam']}
                />
              </CustomButton>
            }
            modal
            closeOnEscape
          >
            {(close) => (
              <LeaveTeamConfirmationAlert
                teamName={team.name}
                close={close}
                leaveTeam={leaveTeamFn}
              />
            )}
          </Popup>
        ) : (
          team.joinMethod !== 'BY_INVITE' && (
            <CustomButton
              className="w-100 h-100 bg-red b--red white"
              disabledClassName="bg-red b--red o-50 white w-100 h-100"
              onClick={() => joinTeamFn()}
              disabled={team.joinMethod === 'OSM_TEAMS'}
            >
              <FormattedMessage {...messages.joinTeam} />
            </CustomButton>
          )
        )}
      </div>
    </div>
  );
}