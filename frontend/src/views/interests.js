import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useFetch } from '../hooks/UseFetch';
import { TextBlock, RectShape } from 'react-placeholder/lib/placeholders';
import ReactPlaceholder from 'react-placeholder';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { Link, redirectTo } from '@reach/router';
import { Form } from 'react-final-form';
import messages from '../components/teamsAndOrgs/messages';
import { FormattedMessage } from 'react-intl';

import { InterestsManagement, InterestForm, InterestInformation } from '../components/interests';
import { FormSubmitButton, CustomButton } from '../components/button';
import { DeleteModal } from '../components/deleteModal';

export const CreateInterest = () => {
  const token = useSelector(state => state.auth.get('token'));
  const [newInterestId, setNewInterestId] = useState(null);

  useEffect(() => {
    if (newInterestId) {
      redirectTo(`/manage/interests/${newInterestId}`);
    }
  }, [newInterestId]);

  const createInterest = payload => {
    pushToLocalJSONAPI('interests/', JSON.stringify(payload), token, 'POST').then(result =>
      setNewInterestId(result.id),
    );
  };

  return (
    <Form
      onSubmit={values => createInterest(values)}
      render={({ handleSubmit, pristine, form, submitting, values }) => {
        return (
          <form onSubmit={handleSubmit} className="blue-grey">
            <div className="cf vh-100">
              <h3 className="f2 mb3 ttu blue-dark fw7 barlow-condensed">
                <FormattedMessage {...messages.newInterest} />
              </h3>
              <div className="w-40-l w-100 fl">
                <div className="bg-white b--grey-light ba pa4 mb3">
                  <h3 className="f3 blue-dark mv0 fw6">
                    <FormattedMessage {...messages.interestInfo} />
                  </h3>
                  <InterestInformation />
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
                  <FormattedMessage {...messages.createInterest} />
                </FormSubmitButton>
              </div>
            </div>
          </form>
        );
      }}
    ></Form>
  );
};

export const ListInterests = () => {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  // TO DO: filter teams of current user
  const [error, loading, interests] = useFetch(`interests/`);

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
      <InterestsManagement interests={interests.interests} userDetails={userDetails} />
    </ReactPlaceholder>
  );
};

export const EditInterest = props => {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const token = useSelector(state => state.auth.get('token'));
  const [error, loading, interest] = useFetch(`interests/${props.id}/`);

  const updateInterest = payload => {
    pushToLocalJSONAPI(`interests/${props.id}/`, JSON.stringify(payload), token, 'PATCH');
  };

  return (
    <div className="cf pv4 bg-tan">
      <div className="cf">
        <h3 className="f2 ttu blue-dark fw7 barlow-condensed v-mid ma0 dib ttu">
          <FormattedMessage {...messages.interest} />
        </h3>
        <DeleteModal id={interest.id} name={interest.name} type="interests" />
      </div>
      <div className="w-40-l w-100 mt4 fl">
        <InterestForm
          userDetails={userDetails}
          interest={{ name: interest.name }}
          updateInterest={updateInterest}
          disabledForm={error || loading}
        />
      </div>
    </div>
  );
};
