import React, { useRef, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Button, InputGroup, FormControl } from 'react-bootstrap'

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
  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    console.log(obj);
    if (obj.type === "joined") {
      localStorage.setItem("UserId", obj.Player.UserId);
      localStorage.setItem("RoomId", obj.Room.RoomId);

      if (obj.Room.Started === true)
        history.push("/Game")
      else
        history.push("/Lobby");
    }
    else if (obj.type === "failed")
      setMessage("Room does not exist")

  }

  return (
    <div className='container'>
      <h1>Cardgames Against Humanity</h1>
      <form onSubmit={onJoin}>
        <InputGroup className="mb-3">
          <FormControl
            placeholder="Room Id"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
          />
        </InputGroup>
        <InputGroup className="mb-3">
          <FormControl
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nick Name"
          />
        </InputGroup>
        <Button  variant="outline-secondary mr-2" type='submit'  onClick={onJoin}>Join</Button>
        <Button variant="outline-dark" onClick={onNewGame}>Create New Game</Button>
        <sup>{message}</sup>
      </form>
      <hr />
    </div>
  );
}
