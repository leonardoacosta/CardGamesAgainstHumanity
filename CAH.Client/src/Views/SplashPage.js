import React, { useRef, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Input, Button } from '@material-ui/core';

export default function SplashPage(props) {
  const client = useRef(props.ws).current;

  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  let history = useHistory();

  const onNewGame = () => {
    history.push("/Setup");
  };

  const onJoin = e => {
    e.preventDefault();

    client.send(JSON.stringify({
      type: "join",
      roomId: roomId,
      name: name,
    }));
  };

  client.onopen = () => { }
  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    if (obj.type === "joined") {
      localStorage.setItem("userId", obj.player.UserId);
      localStorage.setItem("masterConnection", obj.room.MasterConnection);
      
      if(obj.room.Started == true)
        history.push("/Game")
      else
        history.push("/Lobby");
    }
    else if (obj.type === "failed") 
      setMessage("Room does not exist")
    
  }

  return (
    <div className='container-fluid'>
      <h1>Cardgames Against Humanity</h1>
      <form onSubmit={onJoin}>

        <Input fullWidth value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Room Id"></Input>
        <Input fullWidth value={name} onChange={e => setName(e.target.value)} placeholder="Nick Name"></Input>
        <Button type='submit' variant='contained' onClick={onJoin}>Join</Button>
        <sup>{message}</sup>
      </form>
      <hr />
      <br />
      <Button variant='outlined' onClick={onNewGame}>Create New Game</Button>
    </div>
  );
}
