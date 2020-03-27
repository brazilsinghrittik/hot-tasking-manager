import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { RelativeTimeWithUnit } from '../../utils/formattedRelativeTime';
import { CloseIcon } from '../svgIcons';
import { useFetch } from '../../hooks/UseFetch';
import { formatOSMChaLink } from '../../utils/osmchaLink';
import { formatOverpassLink } from '../../utils/overpassLink';
import { compareLastUpdate } from '../../utils/sorting';
import { htmlFromMarkdown } from '../../utils/htmlFromMarkdown';
import { formatUserNamesToLink } from '../../utils/formatUserNamesToLink';
import { UserAvatar } from '../user/avatar';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Dropdown } from '../dropdown';
import { MentionUserTextArea } from '../mentionUserTextArea';

export const TaskHistory = ({ projectId, taskId, commentPayload }) => {
  const token = useSelector((state) => state.auth.get('token'));
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (commentPayload) {
      setHistory(commentPayload.taskHistory);
    }
  }, [commentPayload]);

  useEffect(() => {
    const getTaskInfo = async () => {
      const res = await fetchLocalJSONAPI(`projects/${projectId}/tasks/${taskId}/`, token);
      setHistory(res.taskHistory);
    };

    if (!commentPayload) {
      getTaskInfo();
    }
  }, [projectId, taskId, token, commentPayload]);

  const getTaskActionMessage = (action, actionText) => {
    let message = '';
    switch (action) {
      case 'COMMENT':
        message = messages.taskHistoryComment;
        break;
      case 'LOCKED_FOR_MAPPING':
        message = messages.taskHistoryLockedMapping;
        break;
      case 'LOCKED_FOR_VALIDATION':
        message = messages.taskHistoryLockedValidation;
        break;
      case 'AUTO_UNLOCKED_FOR_MAPPING':
        message = messages.taskHistoryAutoUnlockedMapping;
        break;
      case 'AUTO_UNLOCKED_FOR_VALIDATION':
        message = messages.taskHistoryAutoUnlockedValidation;
        break;
      case 'STATE_CHANGE':
        switch (actionText) {
          case 'BADIMAGERY':
            message = messages.taskHistoryBadImagery;
            break;
          case 'MAPPED':
            message = messages.taskHistoryMapped;
            break;
          case 'VALIDATED':
            message = messages.taskHistoryValidated;
            break;

          case 'INVALIDATED':
            message = messages.taskHistoryInvalidated;
            break;
          case 'SPLIT':
            message = messages.taskHistorySplit;
            break;
          case 'READY':
            message = messages.taskHistoryReady;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    if (message) {
      return <FormattedMessage {...message} />;
    }
  };

  if (!history) {
    return null;
  } else {
    return history.map((t, n) => (
      <div className="w-90 mh3 pv3 bb b--grey-light f6 cf" key={n}>
        <div className="fl w-10-ns w-100 mr2 tr">
          <UserAvatar
            username={t.actionBy}
            picture={t.pictureUrl}
            colorClasses="white bg-blue-grey"
          />
        </div>
        <div className="w-80-ns w-100 fl">
          <p className="ma0 pt2">
            <a href={'/users/' + t.actionBy} className="blue-dark b underline">
              {t.actionBy}
            </a>{' '}
            {getTaskActionMessage(t.action, t.actionText)}{' '}
            <RelativeTimeWithUnit date={t.actionDate} />
          </p>
          {t.action === 'COMMENT' ? (
            <p
              className="i ma0 mt2 blue-grey"
              dangerouslySetInnerHTML={htmlFromMarkdown(formatUserNamesToLink(t.actionText))}
            />
          ) : null}
        </div>
      </div>
    ));
  }
};

export const TaskDataDropdown = ({ history, changesetComment, bbox }: Object) => {
  const [lastActivityDate, setLastActivityDate] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [osmchaLink, setOsmchaLink] = useState('');

  useEffect(() => {
    const users = [];
    if (history && history.taskHistory) {
      history.taskHistory.forEach(item => {
        if (!users.includes(item.actionBy)) {
          users.push(item.actionBy);
        }
      });
      setLastActivityDate(
        history.taskHistory.sort(compareLastUpdate)[history.taskHistory.length - 1],
      );
    }
    setContributors(users);
  }, [history]);

  useEffect(() => {
    setOsmchaLink(
      formatOSMChaLink({
        aoiBBOX: bbox,
        created: lastActivityDate,
        usernames: contributors,
        changesetComment: changesetComment,
      }),
    );
  }, [changesetComment, contributors, lastActivityDate, bbox]);

  if (history && history.taskHistory && history.taskHistory.length > 0) {
    return (
      <Dropdown
        onAdd={() => {}}
        onRemove={() => {}}
        onChange={() => {}}
        value={null}
        options={[
          { label: <FormattedMessage {...messages.taskOnOSMCha} />, href: osmchaLink },
          {
            label: <FormattedMessage {...messages.overpassVisualization} />,
            href: formatOverpassLink(contributors, bbox),
          },
          {
            label: <FormattedMessage {...messages.overpassDownload} />,
            href: formatOverpassLink(contributors, bbox, true),
          },
        ]}
        display={<FormattedMessage {...messages.taskData} />}
        className="blue-dark bg-white mr1 v-mid pv2 ph2 ba b--grey-light link"
      />
    );
  } else {
    return <></>;
  }
};

export const TaskActivity = ({
  taskId,
  projectId,
  projectName,
  changesetComment,
  bbox,
  close,
}: Object) => {
  const [commentPayload, setCommentPayload] = useState(null);
  // eslint-disable-next-line
  const [historyError, historyLoading, history] = useFetch(
    `projects/${projectId}/tasks/${taskId}/`,
    projectId !== undefined && taskId !== undefined,
  );

  return (
    <div className="h-100 bg-white">
      <div className="w-100 pv3 ph4 blue-dark bg-tan relative">
        <CloseIcon className="h1 w1 fr pointer" onClick={() => close()} />
        <p className="ttu f3 pa0 ma0 barlow-condensed b mb2">
          <FormattedMessage {...messages.taskActivity} />
        </p>
        <div className="f5 pa0 ma0 cf">
          <div className="w-80-l w-100 fl pt2">
            <b>#{taskId}:</b> {projectName}
          </div>
          <div className="w-20-l w-100 fl tr">
            {bbox && changesetComment && (
              <TaskDataDropdown
                history={commentPayload !== null ? commentPayload : history}
                bbox={bbox}
                changesetComment={changesetComment}
              />
            )}
          </div>
        </div>
      </div>
      <div className="blue-dark h5 overflow-scroll">
        <TaskHistory
          projectId={projectId}
          taskId={taskId}
          commentPayload={commentPayload !== null ? commentPayload : history}
        />
      </div>
      <MentionUserTextArea
        postUrl={`projects/${projectId}/comments/tasks/${taskId}/`}
        onCommentUpload={setCommentPayload}
        action="TASK"
      />
    </div>
  );
};
