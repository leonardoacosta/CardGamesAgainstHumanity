import React, { useRef, useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Button } from '@material-ui/core';

export default function Lobby(props) {
  const client = useRef(props.ws).current;
  let history = useHistory();
  const [ message, setMessage] = useState("");

  useEffect(() => {
    client.onopen = () => {
    }
  }, [client])
  
  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    if(obj.type === "start"){
      history.push("/Game")
    }
    if(obj.type === "joined"){
      setMessage(obj.player.Name +" has joined the chat!");
    }
  }

  const onBored = () => {
    var userId = localStorage.getItem("userId");
    var masterConnection = localStorage.getItem("masterConnection");

    client.send(JSON.stringify({
      type: "bored",
      userId: userId,
      masterConnection: masterConnection
    }));
  }

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h1>Waiting Room</h1>
          <sup>{message}</sup>
          <hr />
          <h2>Waiting in the room and I'm in the room bored:</h2>
          <Button onClick={onBored} variant='outlined' color='secondary'>Click</Button>

        </div>
      </div>
    </div>
  );
}