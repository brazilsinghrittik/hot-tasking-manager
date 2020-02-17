import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, redirectTo } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import { TextBlock, RectShape } from 'react-placeholder/lib/placeholders';
import { FormattedMessage } from 'react-intl';
import { Form } from 'react-final-form';

import messages from './messages';
import { useFetch } from '../hooks/UseFetch';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import {
  CampaignsManagement,
  CampaignInformation,
  CampaignForm,
} from '../components/teamsAndOrgs/campaigns';
import { Projects } from '../components/teamsAndOrgs/projects';
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';

export function ListCampaigns() {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  // TO DO: filter teams of current user
  const [error, loading, campaigns] = useFetch(`campaigns/`);

  const placeHolder = (
    <div className="pb4 bg-tan">
      <div className="w-50-ns w-100 cf ph6-l ph4">
        <TextBlock rows={1} className="bg-grey-light h3" />
      </div>
      <RectShape className="bg-white dib mv2 mh6" style={{ width: 250, height: 300 }} />
      <RectShape className="bg-white dib mv2 mh6" style={{ width: 250, height: 300 }} />
    </div>
  );

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      customPlaceholder={placeHolder}
      delay={10}
      ready={!error && !loading}
    >
      <CampaignsManagement campaigns={campaigns.campaigns} userDetails={userDetails} />
    </ReactPlaceholder>
  );
}

export function CreateCampaign() {
  const token = useSelector(state => state.auth.get('token'));
  const [newCampaignId, setNewCampaignId] = useState(null);

  useEffect(() => {
    if (newCampaignId) {
      redirectTo(`/manage/campaigns/${newCampaignId}`);
    }
  }, [newCampaignId]);

  const createCampaign = payload => {
    pushToLocalJSONAPI('campaigns/', JSON.stringify(payload), token, 'POST').then(result =>
      setNewCampaignId(result.campaignId),
    );
  };

  return (
    <Form
      onSubmit={values => createCampaign(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newCampaign} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.campaignInfo} />
                  </h3>
                  <CampaignInformation />
                </div>
              </div>
              <div className="w-40-l w-100 fl pl5-l pl0 "></div>
            </div>
            <div className="fixed left-0 bottom-0 cf bg-white h3 w-100">
              <div className="w-80-ns w-60-m w-50 h-100 fl tr">
                <Link to={'../'}>
                  <CustomButton className="bg-white mr5 pr2 h-100 bn bg-white blue-dark">
                    <FormattedMessage {...messages.cancel} />
                  </CustomButton>
                </Link>
              </div>
              <div className="w-20-l w-40-m w-50 h-100 fr">
                <FormSubmitButton
                  disabled={submitting || pristine}
                  className="w-100 h-100 bg-red white"
                  disabledClassName="bg-red o-50 white w-100 h-100"
                >
                  <FormattedMessage {...messages.createCampaign} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
}

export function EditCampaign(props) {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const token = useSelector(state => state.auth.get('token'));
  const [error, loading, campaign] = useFetch(`campaigns/${props.id}/`);
  const [projectsError, projectsLoading, projects] = useFetch(
    `projects/?campaign=${campaign.name}`,
    campaign.name,
  );

  const updateCampaign = payload => {
    pushToLocalJSONAPI(`campaigns/${props.id}/`, JSON.stringify(payload), token, 'PATCH');
  };

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
          <FormattedMessage {...messages.manageCampaign} />
        </h3>
        <DeleteModal id={campaign.id} name={campaign.name} type="campaigns" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <CampaignForm
          userDetails={userDetails}
          campaign={{ name: campaign.name }}
          updateCampaign={updateCampaign}
          disabledForm={error || loading}
        />
      </div>
      <div className="w-60-l w-100 mt4 pl5-l pl0 fl">
        <Projects
          projects={!projectsLoading && !projectsError && projects}
          viewAllQuery={`?campaign=${campaign.name}`}
          ownerEntity="campaign"
        />
      </div>
    </div>
  );
}
