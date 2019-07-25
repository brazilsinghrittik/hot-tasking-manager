import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createBrowserHistory } from "history";
import {IntlProvider} from 'react-intl';

import { store } from './store';
import App from './App';

const history = createBrowserHistory();


it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <IntlProvider locale='en'>
          <App />
        </IntlProvider>
      </Router>
    </Provider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
