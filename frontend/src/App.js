import React from 'react';
import { Router } from "@reach/router";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { ListTeams } from './components/teams/teams';
import { TeamProfile } from './components/teams/team_profile';
import { EditTeam } from './components/teams/edit_team';


function App() {
  return (
    <div className="App w-100 base-font">
      <Header />
      <div className="cf w-100 base-font">
        <Router>
          <Home path="/" />
          <AboutPage path="/about" />
          <ListTeams path="/teams" />
          <TeamProfile path="/team/:team_id" />
          <EditTeam path="/edit_team/:team_id" />
          <Authorized path="authorized" />
          <Login path="login" />
          <Welcome path="welcome" />
        </Router>
      </div>
      <Footer />
    </div>
  );
}

export default App;
