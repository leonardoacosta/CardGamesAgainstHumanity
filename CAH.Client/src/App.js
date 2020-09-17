import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import { w3cwebsocket as W3CWebSocket } from "websocket";

import SplashPage from './Views/SplashPage';
import Setup from './Views/Setup';
import Lobby from './Views/Lobby';
import Game from './Views/Game';
import Loading from './components/Loading';

const client = new W3CWebSocket('wss://cardgamesagainsthumanity.azurewebsites.net/');
//const client = new W3CWebSocket('ws://localhost:8000/');

export default function App() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    client.onopen = () => {
      setOpen(true);
    };
  }, []);

  if (!open)
    return (<Loading />)

  return (
    <Router>
      <Switch>
        <Route exact path="/" render={props => <SplashPage {...props} ws={client} />} />
        <Route exact path="/Setup" render={props => <Setup {...props} ws={client} />} />
        <Route exact path="/Lobby" render={props => <Lobby {...props} ws={client} />} />
        <Route exact path="/Game" render={props => <Game {...props} ws={client} />} />
      </Switch>
    </Router>
  )
}

