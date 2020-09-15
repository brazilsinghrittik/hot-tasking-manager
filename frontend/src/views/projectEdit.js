import React, { useState, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import projectEditMessages from '../components/projectEdit/messages';
import { DescriptionForm } from '../components/projectEdit/descriptionForm';
import { InstructionsForm } from '../components/projectEdit/instructionsForm';
import { MetadataForm } from '../components/projectEdit/metadataForm';
import { PriorityAreasForm } from '../components/projectEdit/priorityAreasForm';
import { ImageryForm } from '../components/projectEdit/imageryForm';
import { PermissionsForm } from '../components/projectEdit/permissionsForm';
import { SettingsForm } from '../components/projectEdit/settingsForm';
import { ActionsForm } from '../components/projectEdit/actionsForm';
import { CustomEditorForm } from '../components/projectEdit/customEditorForm';
import { Button } from '../components/button';
import { Dropdown } from '../components/dropdown';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { useEditProjectAllowed } from '../hooks/UsePermissions';
import { CheckIcon, CloseIcon } from '../components/svgIcons';

export const StateContext = React.createContext();

export const styleClasses = {
  divClass: 'w-70-l w-100 pb5 mb4 bb b--grey-light',
  labelClass: 'f4 fw6 db mb3',
  pClass: 'db mb3 f5',
  inputClass: 'w-80 pa2 db mb2',
  numRows: '4',
  buttonClass: 'bg-blue-dark dib white',
  modalTitleClass: 'f3 pb3 mv0 bb',
  drawButtonClass: 'bg-blue-dark white mr2',
  redButtonClass: 'bg-red white',
  whiteButtonClass: 'bg-white blue-dark mr2',
  modalClass: 'pa4',
  actionClass: 'bg-blue-dark white dib mr2 mt2 pointer',
};

// AH: Do not mutate function arguments (arrayElement), create a new variable instead
export const handleCheckButton = (event, arrayElement) => {
  if (event.target.checked === true) { // AH: Do not need to do an equality check for true
    arrayElement.push(event.target.value);
  } else {
    arrayElement = arrayElement.filter((t) => t !== event.target.value);
  }

  return arrayElement;
};

export function ProjectEdit({ id }) {
  useSetTitleTag(`Edit project #${id}`);
  const mandatoryFields = ['name', 'shortDescription', 'description', 'instructions']; // AH: This variable does not need to be instantiated on every render. Move outside of the function.
  const token = useSelector((state) => state.auth.get('token'));
  const user = useSelector((state) => state.auth.get('userDetails'));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [languages, setLanguages] = useState(null);
  const [option, setOption] = useState('description');
  const [projectInfo, setProjectInfo] = useState({
    mappingTypes: [],
    mappingEditors: [],
    validationEditors: [],
    teams: [],
    projectInfoLocales: [
      {
        locale: '',
        name: '',
        shortDescription: '',
        description: '',
        instructions: '',
        perTaskInstructions: '',
      },
    ],
  });
  const [userCanEditProject] = useEditProjectAllowed(projectInfo);

  // AH: Is there a reason why useLayoutEffect is being used instead of useEffect?
  useLayoutEffect(() => {
    setSuccess(false);
    setError(null);
  }, [projectInfo, option]);

  useLayoutEffect(() => {
    async function getSupportedLanguages() {
      const res = await fetchLocalJSONAPI(`system/languages/`);
      setLanguages(res.supportedLanguages);
    }
    getSupportedLanguages();
  }, []);

  useLayoutEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchLocalJSONAPI(`projects/${id}/`, token, 'GET');
        setProjectInfo(res);
      } catch (e) {} // AH: Do we not want to setError when this function throws an exception?
    }
    fetchData();
  }, [id, token]);

  if (!token) {
    return <Redirect to={'/login'} noThrow />;
  }

  if (projectInfo.projectId && !userCanEditProject) {
    return (
      <div className="cf w-100 pv5">
        <div className="tc">
          <h3 className="f3 fw8 mb4 barlow-condensed">
            <FormattedMessage {...messages.projectEditNotAllowed} />
          </h3>
        </div>
      </div>
    );
  }

  // AH: For functional components, every time the component is rendered all these functions will be defined again. Moving it outside allows us to only declare it once.
  const renderList = () => { // AH: Move outside of component
    const checkSelected = (optionSelected) => {
      let liClass = 'w-90 link barlow-condensed f4 fw5 pv3 pl2 pointer';
      if (option === optionSelected) {
        liClass = liClass.concat(' fw6 bg-grey-light');
      }
      return liClass;
    };

    const elements = [
      { value: 'description', required: true },
      { value: 'instructions', required: true },
      { value: 'metadata', required: true },
      { value: 'priority_areas' },
      { value: 'imagery' },
      { value: 'permissions' },
      { value: 'settings' },
      { value: 'actions' },
      { value: 'custom_editor', expert_required: true },
    ]; 

    return (
      <div>
        <ul className="list pl0 mt0 ttu">
          {elements
            .filter((elm) => !elm.expert_required || user.isExpert)
            .map((elm, n) => (
              <li key={n} className={checkSelected(elm.value)} onClick={() => setOption(elm.value)}>
                <FormattedMessage {...messages[`projectEditSection_${elm.value}`]} />
                {elm.required && ' *'}
              </li>
            ))}
        </ul>
      </div>
    );
  };

  const renderForm = (option) => { // AH: Move outside of component
    switch (option) {
      case 'description':
        return <DescriptionForm languages={languages} />;
      case 'instructions':
        return <InstructionsForm languages={languages} />;
      case 'metadata':
        return <MetadataForm />;
      case 'imagery':
        return <ImageryForm />;
      case 'permissions':
        return <PermissionsForm />;
      case 'settings':
        return <SettingsForm languages={languages} defaultLocale={projectInfo.defaultLocale} />;
      case 'priority_areas':
        return <PriorityAreasForm />;
      case 'actions':
        return (
          <ActionsForm
            projectId={projectInfo.projectId}
            projectName={projectInfo.projectInfo.name}
          />
        );
      case 'custom_editor':
        return <CustomEditorForm languages={languages} defaultLocale={projectInfo.defaultLocale} />;
      default:
        return null;
    }
  };

  const saveChanges = () => { // AH: Move outside of component
    const updateProject = () => {
      pushToLocalJSONAPI(`projects/${id}/`, JSON.stringify(projectInfo), token, 'PATCH')
        .then((res) => { // AH: res is not being used
          setSuccess(true);
          setError(null);
        })
        .catch((e) => setError('SERVER'));
    };

    // Remove locales with less than 3 fields.
    const locales = projectInfo.projectInfoLocales;
    // Get data for default locale.
    const filtered = locales
      .filter((l) => l.locale === projectInfo.defaultLocale)
      .map((l) => {
        return {
          locale: l.locale,
          fields: mandatoryFields.filter(
            (m) => Object.keys(l).includes(m) === false || l[m] === '',
          ),
        };
      })
      .filter((l) => l.fields.length > 0);

    if (projectInfo.mappingTypes.length === 0) {
      filtered.push({ locale: null, fields: ['mappingTypes'] });
    }

    if (filtered.length > 0) {
      setError(filtered);
    } else {
      updateProject();
    }
  };

  const ServerMessage = () => { // AH: Move outside of this component
    return (
      <div className="red ba b--red pa2 br1 dib pa2">
        <CloseIcon className="h1 w1 v-mid pb1 red mr2" />
        <FormattedMessage {...messages.updateError} />
      </div>
    );
  };

  const SuccessMessage = () => { // AH: Move outside of this component
    return (
      <div className="blue-grey b--blue-grey ba br1 dib pa2">
        <CheckIcon className="h1 w1 mr2" />
        <FormattedMessage {...messages.updateSuccess} />
      </div>
    );
  };

  const MissingField = (locale) => { // AH: Move outside of this component
    if (locale === null) {
      return <FormattedMessage {...messages.missingFields} />;
    }

    return (
      <FormattedMessage
        {...messages.missingFieldsForLocale}
        values={{ locale: <span className="b f5">"{locale}"</span> }}
      />
    );
  };

  const ErrorMessage = ({ e }) => { // AH: Move outside of this component
    return (
      <ul className="mt2 mb0">
        {e.fields.map((f, i) => {
          return (
            <li className="b">
              {<FormattedMessage {...projectEditMessages[f]} />}
              {i === e.fields.length - 1 ? null : ','}
            </li>
          );
        })}
      </ul>
    );
  };

  const ErrorMessages = ({ error }) => { // AH: Move outside of this component
    return (
      <div className="mr4 red ba b--red pa2 br1 dib pa2">
        {error.map((e) => {
          return (
            <div className="pv2">
              <CloseIcon className="h1 w1 v-mid pb1 red mr2" />
              {MissingField(e.locale)}
              <ErrorMessage e={e} />
            </div>
          );
        })}
      </div>
    );
  };

  const UpdateMessage = ({ error, success }) => { // AH: Move outside of this component
    let message = null;
    // AH: Turn into if...else if...statements to prevent running through all statements
    if (success === true) {
      message = <SuccessMessage />;
    }
    if (error !== null && error !== 'SERVER') {
      message = <ErrorMessages error={error} />;
    }
    if (error !== null && error === 'SERVER') {
      message = <ServerMessage />;
    }

    return <div className="db mv3">{message}</div>;
  };

  return (
    <div className="cf pv3 blue-dark">
      <h2 className="pb2 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">
        <FormattedMessage {...messages.editProject} />
      </h2>
      <div className="fl w-30-l w-100 ph0-ns ph4-m ph2">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={8}
          ready={projectInfo && projectInfo.projectInfo}
          className="pr3"
        >
          {renderList()}
          <Button onClick={saveChanges} className="db bg-red white pa3 bn">
            <FormattedMessage {...messages.save} />
          </Button>
          <div style={{ minHeight: '3rem' }}>
            <UpdateMessage error={error} success={success} />
          </div>
          <span className="db">
            <Dropdown
              onAdd={() => {}} // AH: What happens when this event and onRemove is triggered?
              onRemove={() => {}}
              value={null}
              options={[
                {
                  label: <FormattedMessage {...messages.projectPage} />,
                  href: `/projects/${projectInfo.projectId}/`,
                  internalLink: true,
                },
                {
                  label: <FormattedMessage {...messages.tasksPage} />,
                  href: `/projects/${projectInfo.projectId}/tasks/`,
                  internalLink: true,
                },
                {
                  label: <FormattedMessage {...messages.projectStats} />,
                  href: `/projects/${projectInfo.projectId}/stats/`,
                  internalLink: true,
                },
              ]}
              display={<FormattedMessage {...messages.accessProject} />}
              className={'ba b--grey-light bg-white mr1 f5 v-mid pv2 ph3'}
            />
          </span>
        </ReactPlaceholder>
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        type={'media'}
        rows={26}
        delay={200}
        ready={projectInfo && projectInfo.projectInfo}
      >
        <StateContext.Provider
          value={{
            projectInfo: projectInfo,
            setProjectInfo: setProjectInfo,
            success: success,
            setSuccess: setSuccess,
            error: error,
            setError: setError,
          }}
        >
          <div className="fl w-70-l w-100 ph0-l ph4-m ph2">{renderForm(option)}</div>
        </StateContext.Provider>
      </ReactPlaceholder>
    </div>
  );
}
