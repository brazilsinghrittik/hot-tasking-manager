import React from 'react';
import { Redirect } from '@reach/router';
import { connect } from 'react-redux';
import { setAuthDetails } from '../store/actions/auth';

class Authorized extends React.Component {
  state = {
    isReadyToRedirect: false,
  };
  params = new URLSearchParams(this.props.location.search);

  componentDidMount() {
    let verifier = this.params.get('oauth_verifier');
    if (verifier !== null) {
      window.opener.authComplete(verifier);
      window.close();
      return;
    }
    const username = this.params.get('username');
    const sessionToken = this.params.get('session_token');
    const osm_oauth_token = this.params.get('osm_oauth_token');
    const osm_oauth_token_secret = this.params.get('osm_oauth_token_secret');
    this.props.authenticateUser(username, sessionToken, osm_oauth_token, osm_oauth_token_secret);
    this.setState({
      isReadyToRedirect: true,
    });
  }
  render() {
    const redirectUrl =
      this.params.get('redirect_to') && this.params.get('redirect_to') !== '/'
        ? this.params.get('redirect_to')
        : '/welcome';
    return this.state.isReadyToRedirect ? (
      <Redirect to={redirectUrl} noThrow />
    ) : (
      <div>redirecting</div>
    );
  }
}

let mapStateToProps = (state, props) => ({
  location: props.location,
});

const mapDispatchToProps = dispatch => {
  return {
    authenticateUser: (username, token, osm_oauth_token, osm_oauth_token_secret) =>
      dispatch(setAuthDetails(username, token, osm_oauth_token, osm_oauth_token_secret)),
  };
};

Authorized = connect(mapStateToProps, mapDispatchToProps)(Authorized);
export { Authorized };
