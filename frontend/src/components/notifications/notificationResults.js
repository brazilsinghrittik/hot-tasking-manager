import React, { useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { NotificationCard, NotificationCardMini } from './notificationCard';
import NotificationPlaceholder from './notificationPlaceholder';
import { DeleteNotificationsButton } from './deleteNotificationsButton';
import { RefreshIcon } from '../svgIcons';
import { SelectAll } from '../formInputs';

export const NotificationResultsMini = (props) => {
  return <NotificationResults {...props} useMiniCard={true} />;
};

export const NotificationResults = ({
  className,
  error,
  loading,
  state,
  notifications,
  retryFn,
  useMiniCard,
  liveUnreadCount,
  setPopoutFocus,
}) => {
  const stateNotifications = notifications.userMessages;

  const showRefreshButton =
    useMiniCard &&
    !error &&
    notifications.userMessages &&
    liveUnreadCount !== notifications.userMessages.filter((n) => !n.read).length;

  return (
    <div className={className || ''}>
      {!stateNotifications && <span>&nbsp;</span>}
      {notifications?.userMessages && !error && !useMiniCard && (
        <p className="blue-grey pt2 f7">
          <FormattedMessage
            {...messages.paginationCount}
            values={{
              number: stateNotifications && stateNotifications.length,
              total: (
                <FormattedNumber
                  value={
                    notifications.pagination &&
                    !isNaN(notifications.pagination.total) &&
                    notifications.pagination.total
                  }
                />
              ),
            }}
          />
        </p>
      )}

      {error && (
        <div className="bg-tan pa4 mt3">
          <FormattedMessage {...messages.errorLoadingNotifications} />
          <div className="pa2">
            <button className="pa1" onClick={() => retryFn()}>
              <FormattedMessage {...messages.notificationsRetry} />
            </button>
          </div>
        </div>
      )}
      <div className={`cf`}>
        <ReactPlaceholder
          ready={!loading && stateNotifications}
          customPlaceholder={<NotificationPlaceholder />}
          type="media"
          rows={10}
        >
          <NotificationCards
            pageOfCards={stateNotifications}
            useMiniCard={useMiniCard}
            retryFn={retryFn}
            setPopoutFocus={setPopoutFocus}
          />
        </ReactPlaceholder>
      </div>
      {showRefreshButton && (
        <div className="ph2 pt1 pb2 tc db mb2">
          <button className="pv1 ph2 pointer ba b--grey-light bg-tan" onClick={() => retryFn()}>
            <RefreshIcon height="15px" className="pt1" />
          </button>
        </div>
      )}
    </div>
  );
};

const NotificationCards = ({ pageOfCards, useMiniCard, retryFn, setPopoutFocus }) => {
  const [selected, setSelected] = useState([]);

  if (pageOfCards.length === 0) {
    return (
      <div className={`mb3 ${useMiniCard ? 'ph3 ml2' : ''} blue-grey`}>
        <FormattedMessage {...messages[useMiniCard ? 'noUnreadMessages' : 'noMessages']} />
      </div>
    );
  }

  const unreadCountInSelected = pageOfCards.reduce((acc, msg) => {
    return !msg.read && selected.includes(msg.messageId) ? acc + 1 : acc;
  }, 0);

  return (
    <>
      {!useMiniCard && (
        <>
          <div className="mb2 ph3">
            <SelectAll
              allItems={pageOfCards.map((message) => message.messageId)}
              setSelected={setSelected}
              selected={selected}
              className="dib v-mid mv3 ml2"
            />
            <DeleteNotificationsButton
              selected={selected}
              setSelected={setSelected}
              retryFn={retryFn}
              unreadCountInSelected={unreadCountInSelected}
            />
          </div>
          {pageOfCards.map((card, n) => (
            <NotificationCard
              {...card}
              key={n}
              retryFn={retryFn}
              selected={selected}
              setSelected={setSelected}
            />
          ))}
        </>
      )}
      {useMiniCard &&
        pageOfCards
          .slice(0, 5)
          .map((card, n) => (
            <NotificationCardMini
              {...card}
              key={n}
              setPopoutFocus={setPopoutFocus}
              retryFn={retryFn}
            />
          ))}
    </>
  );
};
