import React, { useRef, useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Input } from '@material-ui/core';

export default function SplashPage(props) {
  const client = useRef(props.ws).current;

  const [ message , setMessage ] = useState("");
  const [ roomId , setRoomId ] = useState("");
  const [ name , setName ] = useState("");
  let history = useHistory();

  const onNewGame = () => {
    history.push("/Setup");
  };
  const onJoin = () => { 
    client.send(JSON.stringify({
      type: "join",
      roomId: roomId,
      name: name,
    }));
  };
  client.onopen = () => {}
  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    if (obj.type==="joined")
    {
      localStorage.setItem("userId", obj.userId);
      localStorage.setItem("masterConnection", obj.masterConnection);
      history.push("/Lobby");
    }
    else if (obj.type==="failed"){
      setMessage("Room does not exist")
    }
  }

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h1>CAH</h1>
          <button className='btn btn-primary' onClick={onNewGame}>Create New Game</button>
          <hr />
          <Input fullWidth value={roomId} onChange={e=>setRoomId(e.target.value)} placeholder="Room Id"></Input>
          <Input fullWidth value={name} onChange={e=>setName(e.target.value)} placeholder="Nick Name"></Input>
          <button className='btn btn-secondary' onClick={onJoin}>Join Existing</button>
          <sup>{message}</sup>
          <hr />
        </div>
      </div>
    </div>
  );
}
