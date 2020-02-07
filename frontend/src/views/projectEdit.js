import React, { useState, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { Redirect, navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';

import { DescriptionForm } from '../components/projectEdit/descriptionForm';
import { InstructionsForm } from '../components/projectEdit/instructionsForm';
import { MetadataForm } from '../components/projectEdit/metadataForm';
import { PriorityAreasForm } from '../components/projectEdit/priorityAreasForm';
import { ImageryForm } from '../components/projectEdit/imageryForm';
import { PermissionsForm } from '../components/projectEdit/permissionsForm';
import { SettingsForm } from '../components/projectEdit/settingsForm';
import { ActionsForm } from '../components/projectEdit/actionsForm';
import { Button } from '../components/button';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../network/genericJSONRequest';

export const StateContext = React.createContext();

export const styleClasses = {
  divClass: 'w-70 pb5 mb4 bb b--grey-light',
  labelClass: 'f4 fw6 db mb3',
  pClass: 'db mb3 f5',
  inputClass: 'w-80 pa2 db mb2',
  numRows: '4',
  buttonClass: 'bg-blue-dark dib white',
  modalTitleClass: 'f3 barlow-condensed pb3 bb',
  drawButtonClass: 'bg-blue-dark white mr2',
  deleteButtonClass: 'bg-red white',
  modalClass: 'w-40 vh-50 center pv5',
  actionClass: 'bg-blue-dark white dib mr2 mt2 pointer',
};

export const handleCheckButton = (event, arrayElement) => {
  if (event.target.checked === true) {
    arrayElement.push(event.target.value);
  } else {
    arrayElement = arrayElement.filter(t => t !== event.target.value);
  }

  return arrayElement;
};

export function ProjectEdit({ id }) {
  const token = useSelector(state => state.auth.get('token'));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [languages, setLanguages] = useState(null);
  const [option, setOption] = useState('description');
  const [projectInfo, setProjectInfo] = useState({
    mappingTypes: [],
    mappingEditors: [],
    validationEditors: [],
    projectTeams: [],
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

  useLayoutEffect(() => {
    async function getSupportedLanguages() {
      const res = await fetchLocalJSONAPI(`system/languages/`);
      setLanguages(res.supportedLanguages);
    }
    getSupportedLanguages();
  }, []);

  useLayoutEffect(() => {
    async function fetchData() {
      const res = await fetchLocalJSONAPI(`projects/${id}/`);
      const array = [res.projectInfo];
      setProjectInfo({ ...res, projectInfoLocales: array });
    }

    fetchData();
  }, [id]);

  if (!token) {
    return <Redirect to={'login'} noThrow />;
  }

  const renderList = () => {
    const checkSelected = optionSelected => {
      let liClass = 'w-90 link barlow-condensed f4 fw5 pv3 pl2 pointer';
      if (option === optionSelected) {
        liClass = liClass.concat(' fw6 bg-grey-light');
      }
      return liClass;
    };

    const elements = [
      { item: 'description', showItem: 'Description *' },
      { item: 'instructions', showItem: 'Instructions *' },
      { item: 'metadata', showItem: 'Metadata *' },
      { item: 'priority_areas', showItem: 'Priority areas' },
      { item: 'imagery', showItem: 'Imagery' },
      { item: 'permissions', showItem: 'Permissions' },
      { item: 'settings', showItem: 'Settings' },
      { item: 'actions', showItem: 'Actions' },
    ];

    return (
      <div>
        <ul className="list pl0 mt0 ttu">
          {elements.map((elm, n) => (
            <li key={n} className={checkSelected(elm.item)} onClick={() => setOption(elm.item)}>
              {elm.showItem}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderForm = option => {
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
      default:
        return null;
    }
  };

  const saveChanges = () => {
    const updateProject = () => {
      pushToLocalJSONAPI(`projects/${id}/`, JSON.stringify(projectInfo), token, 'PATCH')
        .then(res => setSuccess(true))
        .catch(e => setError(true));
    };
    updateProject();
  };

  return (
    <div className="cf pv3 blue-dark">
      <h2 className="pb2 f2 fw6 mt2 mb3 ttu barlow-condensed blue-dark">Edit project</h2>
      <div className="fl vh-75-l w-30">
        <ReactPlaceholder
          showLoadingAnimation={true}
          rows={8}
          ready={projectInfo && projectInfo.projectInfo}
          className="pr3"
        >
          {renderList()}
          <Button onClick={saveChanges} className="bg-red white">
            Save
          </Button>
          <Button onClick={() => navigate(`/projects/${id}`)} className="bg-white blue-dark ml2">
            Go to project page
          </Button>
          <p className="pt2">
            {success && (
              <span className="blue-dark bg-grey-light pa2">Project updated successfully</span>
            )}
            {error && <span className="bg-red white pa2">Project update failed: {error}</span>}
          </p>
        </ReactPlaceholder>
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        type={'media'}
        rows={26}
        delay={200}
        ready={projectInfo && projectInfo.projectInfo}
      >
        <StateContext.Provider value={{ projectInfo: projectInfo, setProjectInfo: setProjectInfo }}>
          <div className="fl w-60">{renderForm(option)}</div>
        </StateContext.Provider>
      </ReactPlaceholder>
    </div>
  );
}
