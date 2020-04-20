import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProjectInstructions } from './instructions';
import { TasksMap } from './map';
import { HeaderLine } from '../projectDetail/header';
import { Button } from '../button';
import { SidebarIcon } from '../svgIcons';
import { openEditor } from '../../utils/openEditor';
import { TaskHistory } from './taskActivity';
import { ChangesetCommentTags } from './changesetComment';
import { useSetProjectPageTitleTag } from '../../hooks/UseMetaTags';
import DueDateBox from '../projectcard/dueDateBox';
import { Preloader } from '../preloader'; 
import {
  CompletionTabForMapping,
  CompletionTabForValidation,
  SidebarToggle,
  ReopenEditor,
} from './actionSidebars';

const Editor = React.lazy(() => import('../editor'));

export function TaskMapAction({ project, projectIsReady, tasks, activeTasks, action, editor }) {
  useSetProjectPageTitleTag(project);
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const locale = useSelector((state) => state.preferences.locale);
  const [activeSection, setActiveSection] = useState('completion');
  const [activeEditor, setActiveEditor] = useState(editor);
  const [showSidebar, setShowSidebar] = useState(true);
  const tasksIds = activeTasks ? activeTasks.map((task) => task.taskId) : [];
  const [editorRef, setEditorRef] = useState(null);
  const [disabled, setDisable] = useState(false);
  const activeTask = activeTasks && activeTasks[0];
  const timer = new Date(activeTask.lastUpdated);

  const [taskComment, setTaskComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState();

  timer.setSeconds(timer.getSeconds() + activeTask.autoUnlockSeconds);

  useEffect(() => {
    if (!editor && projectIsReady && userDetails.defaultEditor && tasks && tasksIds) {
      let editorToUse;
      if (action === 'MAPPING') {
        editorToUse = project.mappingEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.mappingEditors;
      } else {
        editorToUse = project.validationEditors.includes(userDetails.defaultEditor)
          ? [userDetails.defaultEditor]
          : project.validationEditors;
      }
      const url = openEditor(
        editorToUse[0],
        project,
        tasks,
        tasksIds,
        [window.innerWidth, window.innerHeight],
        null,
        locale,
      );
      if (url) {
        navigate(`./${url}`);
      } else {
        navigate(`./?editor=${editorToUse[0]}`);
      }
    }
  }, [editor, project, projectIsReady, userDetails.defaultEditor, action, tasks, tasksIds, locale]);

  const callEditor = (arr) => {
    setActiveEditor(arr[0].value);
    const url = openEditor(
      arr[0].value,
      project,
      tasks,
      tasksIds,
      [window.innerWidth, window.innerHeight],
      null,
      locale,
    );
    if (url) {
      navigate(`./${url}`);
    } else {
      navigate(`./?editor=${arr[0].value}`);
    }
  };

  return (
    <div className="cf vh-minus-122-ns overflow-y-hidden">
      <div className={`fl h-100 relative ${showSidebar ? 'w-70' : 'w-100-minus-4rem'}`}>
        {editor === 'ID' ? (
          <React.Suspense
            fallback={<Preloader className="h-100" />}
          >
            <Editor editorRef={editorRef} setEditorRef={setEditorRef} setDisable={setDisable} />
          </React.Suspense>
        ) : (
          <ReactPlaceholder
            showLoadingAnimation={true}
            type="media"
            rows={26}
            delay={10}
            ready={tasks !== undefined && tasks.features !== undefined}
          >
            <TasksMap
              mapResults={tasks}
              className="dib w-100 fl h-100-ns vh-75"
              taskBordersOnly={false}
              animateZoom={false}
              selected={tasksIds}
            />
          </ReactPlaceholder>
        )}
      </div>
      {showSidebar ? (
        <div className="w-30 fr pt3 ph3 h-100 overflow-y-scroll">
          <ReactPlaceholder
            showLoadingAnimation={true}
            rows={3}
            ready={typeof project.projectId === 'number' && project.projectId > 0}
          >
            {activeEditor === 'ID' && (
              <SidebarToggle setShowSidebar={setShowSidebar} editorRef={editorRef} />
            )}
            <HeaderLine author={project.author} projectId={project.projectId} />
            <div className="cf pb3">
              <h3 className="f2 fw6 mt2 mb1 ttu barlow-condensed blue-dark">
                {project.projectInfo && project.projectInfo.name}
                <span className="pl2">&#183;</span>
                {tasksIds.map((task, n) => (
                  <span key={n} className="red ph2">{`#${task}`}</span>
                ))}
              </h3>
              <DueDateBox dueDate={timer} align="left" intervalMili={60000} />
            </div>
            <div className="cf">
              <div className="cf ttu barlow-condensed f4 pv2 blue-dark">
                <span
                  className={`mr4-l mr3 pb2 pointer ${
                    activeSection === 'completion' && 'bb b--blue-dark'
                  }`}
                  onClick={() => setActiveSection('completion')}
                >
                  <FormattedMessage {...messages.completion} />
                </span>
                <span
                  className={`mr4-l mr3 pb2 pointer ${
                    activeSection === 'instructions' && 'bb b--blue-dark'
                  }`}
                  onClick={() => setActiveSection('instructions')}
                >
                  <FormattedMessage {...messages.instructions} />
                </span>
                {activeTasks && activeTasks.length === 1 && (
                  <span
                    className={`mr4-l mr3 pb2 pointer ${
                      activeSection === 'history' && 'bb b--blue-dark'
                    }`}
                    onClick={() => setActiveSection('history')}
                  >
                    <FormattedMessage {...messages.history} />
                  </span>
                )}
              </div>
            </div>
            <div className="pt3">
              {activeSection === 'completion' && (
                <>
                  {action === 'MAPPING' && (
                    <CompletionTabForMapping
                      project={project}
                      tasksIds={tasksIds}
                      taskInstructions={
                        activeTasks && activeTasks.length === 1
                          ? activeTasks[0].perTaskInstructions
                          : null
                      }
                      disabled={disabled}
                      taskComment={taskComment}
                      setTaskComment={setTaskComment}
                      selectedStatus={selectedStatus}
                      setSelectedStatus={setSelectedStatus}
                    />
                  )}
                  {action === 'VALIDATION' && (
                    <CompletionTabForValidation
                      project={project}
                      tasksIds={tasksIds}
                      taskInstructions={
                        activeTasks && activeTasks.length === 1
                          ? activeTasks[0].perTaskInstructions
                          : null
                      }
                      disabled={disabled}
                      taskComment={taskComment}
                      setTaskComment={setTaskComment}
                      selectedStatus={selectedStatus}
                      setSelectedStatus={setSelectedStatus}
                    />
                  )}
                  <div className="pt3">
                    <ReopenEditor
                      project={project}
                      action={action}
                      editor={activeEditor}
                      callEditor={callEditor}
                    />
                    {editor === 'ID' && (
                      <Popup
                        modal
                        trigger={(open) => (
                          <div className="w-50 cf fl tc pt4">
                            <Button className="blue-dark bg-white dib">
                              <FormattedMessage {...messages.tasksMap} />
                            </Button>
                          </div>
                        )}
                        closeOnEscape={true}
                        closeOnDocumentClick={true}
                      >
                        {(close) => (
                          <div className="vh-75">
                            <TasksMap
                              mapResults={tasks}
                              className="dib w-100 fl h-100-ns vh-75"
                              taskBordersOnly={false}
                              animateZoom={false}
                              selected={tasksIds}
                            />
                          </div>
                        )}
                      </Popup>
                    )}
                  </div>
                </>
              )}
              {activeSection === 'instructions' && (
                <>
                  <ProjectInstructions
                    instructions={project.projectInfo && project.projectInfo.instructions}
                  />
                  <ChangesetCommentTags tags={project.changesetComment} />
                </>
              )}
              {activeSection === 'history' && (
                <TaskHistory projectId={project.projectId} taskId={tasksIds[0]} />
              )}
            </div>
          </ReactPlaceholder>
        </div>
      ) : (
        <div className="w-3 cf tc mt3 ph1 pl2 pr1 pointer">
          <FormattedMessage {...messages.showSidebar}>
            {(msg) => (
              <div className="db" title={msg}>
                <SidebarIcon onClick={() => setShowSidebar(true)} />
              </div>
            )}
          </FormattedMessage>
          <div className="db">
            <h3 className="blue-dark">#{project.projectId}</h3>
            <div>
              {tasksIds.map((task, n) => (
                <span key={n} className="red fw5 db pb2">{`#${task}`}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
