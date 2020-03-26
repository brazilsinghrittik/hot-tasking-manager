import React, { useState, useEffect } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import humanizeDuration from 'humanize-duration';

import { ClockIcon } from '../svgIcons';
import messages from './messages';

function DueDateBox({ intl, dueDate, intervalMili, align = 'right' }: Object) {
  const [timer, setTimer] = useState(Date.now());
  useEffect(() => {
    let interval;

    if (intervalMili) {
      interval = setInterval(() => {
        setTimer(Date.now());
      }, intervalMili); // 1 minute
    }

    return () => {
      clearInterval(interval);
    };
  }, [intervalMili]);

  if (dueDate === undefined) {
    return null;
  } else if (new Date(dueDate) === undefined) {
    return null;
  }

  const milliDifference = new Date(dueDate) - timer;
  const langCodeOnly = intl.locale.slice(0, 2);

  let options = {
    language: langCodeOnly,
    fallbacks: ['en'],
    largest: 1,
  };

  let className =
    'relative lh-solid f7 tr br1 link ph1 pv2 bg-grey-light blue-grey truncate mw4 dib';
  if (align === 'right') {
    className = className.replace('fl', 'fr');
  }
  if (intervalMili !== undefined) {
    className = className.replace('mw4', '');
    options = {
      units: ['h', 'm'],
      round: true,
    };
  }

  if (milliDifference < 60000 * 20 && intervalMili !== undefined) {
    className = className.replace('bg-grey-light', 'bg-red').replace('blue-grey', 'white');
  }

  if (milliDifference > 0) {
    return (
      <span className={className}>
        <span>
          <ClockIcon className="absolute pl1 top-0 pt1 left-0" />
        </span>
        <span className="pl3 ml1">
          <FormattedMessage
            className="indent"
            {...messages['dueDateRelativeRemainingDays']}
            values={{
              daysLeftHumanize: humanizeDuration(milliDifference, options),
            }}
          />
        </span>
      </span>
    );
  } else {
    return null;
  }
}

//decorator pattern to provide the intl object from IntlProvider into function props.
export default injectIntl(DueDateBox, { forwardRef: true });
