import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { SearchNav, UsersTable } from '../components/user/list';

export const UsersList = () => {
  const [filters, setFilters] = useState({ level: 'ALL', role: 'ALL', username: '', page: 1 });

  return (
    <div className="ph1 blue-dark">
      <h3 className="barlow-condensed f2 ma0 pv3 mt1 v-mid dib ttu pl2 pl0-l">
        <FormattedMessage {...messages.manageUsers} />
      </h3>
      <SearchNav filters={filters} setFilters={setFilters} />
      <div className="w-50-l w-70-m w-100 mb4">
        <UsersTable filters={filters} setFilters={setFilters} />
      </div>
    </div>
  );
};
