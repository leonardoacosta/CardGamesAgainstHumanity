import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route } from "react-router-dom";
import { w3cwebsocket as W3CWebSocket } from "websocket";

import SplashPage from './Views/SplashPage';
import Setup from './Views/Master/Setup';
import WaitingScreen from './Views/Master/WaitingScreen';
import MainGame from './Views/Master/MainGame';
import Game from './Views/Client/Game';
import Lobby from './Views/Client/Lobby';

const client = new W3CWebSocket('ws://localhost:8000');
//const client = new W3CWebSocket('wss://cardgamesagainsthumanity.azurewebsites.net/');


export default function App() {
  
  return (
    <Router>
        <Switch>
          <Route exact path="/" render={props => <SplashPage {...props} ws={client}/>}/>
          <Route exact path="/Setup"render={props => <Setup {...props} ws={client}/>}/> 

          {/* Must be authenticated from here on out */}
          <Route exact path="/WaitingScreen"render={props => <WaitingScreen {...props} ws={client}/>}/> 
          <Route exact path="/Lobby"render={props => <Lobby {...props} ws={client}/>}/> 

          {/* The Game */}
          <Route exact path="/Main"render={props => <MainGame {...props} ws={client}/>}/> 
          <Route exact path="/Game"render={props => <Game {...props} ws={client}/>}/> 
        </Switch>
    </Router>
  )
}

