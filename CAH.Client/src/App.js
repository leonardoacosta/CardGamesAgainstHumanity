import React, { useRef, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route } from "react-router-dom";

import SplashPage from './Views/SplashPage';
import Setup from './Views/Setup';
import WaitingScreen from './Views/WaitingScreen';
import MainGame from './Views/MainGame';
import Game from './Views/Game';
import Lobby from './Views/Lobby';

import { w3cwebsocket as W3CWebSocket } from "websocket";
//const client = new W3CWebSocket('ws://localhost:8000');
const client = new W3CWebSocket('wss://cardgamesagainsthumanity.azurewebsites.net/');


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

