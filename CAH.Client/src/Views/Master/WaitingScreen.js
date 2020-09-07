import React, { useRef, useEffect, useState } from 'react';
import { useHistory } from "react-router-dom";
import { Button } from '@material-ui/core';

export default function WaitingScreen(props) {
  const client = useRef(props.ws).current;
  const [room, setRoom] = useState({});
  const [bored, setBored] = useState("");
  const [message, setMessage] = useState("");
  const [players, setPlayers] = useState([]);

  let history = useHistory();

  useEffect(() => {
    let masterConnection = localStorage.getItem("masterConnection");
    let payload = {
      type: "getRoom",
      masterConnection: masterConnection
    };
    
    if (client.readyState !== 1)
      client.onopen = () => client.send(JSON.stringify(payload))
    else
      client.send(JSON.stringify(payload));

  }, [client])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);

    if (obj.type === "gotRoom")
      setRoom(obj.Room)

    else if (obj.type === "joined"){
      var newPlayers = [...players, obj.player]
      setPlayers(newPlayers);
      if (newPlayers.length > 1) {
        setMessage("");
      }
    }

    else if (obj.type === "bored")
      setBored(obj.player.Name + " is bored!")

    else if (obj.type === "start")
      history.push("/Main")
  }

  const onStart = () => {

    if (players.length > 1) {
    
      var userId = localStorage.getItem("userId");
      var masterConnection = localStorage.getItem("masterConnection");

      var payload = {
        type: "start",
        userId: userId,
        masterConnection: masterConnection
      };
      client.send(JSON.stringify(payload));
    }
    else {
      setMessage("How are you going to play by yourself?")
    }

  }


  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h1>Waiting Room</h1>
          <sup>Room Code: <b>{room.RoomId}</b></sup>
          <br/>
          <sup>Sets: <b>{room.Sets !== undefined && room.Sets.map(s=>"["+s+"] ")}</b></sup>
          <br/>
          <sup>Random: <b>{room.Random? "Yes": "Nah"}</b></sup>
          {bored !== "" &&
            <div className="alert alert-primary">
              {bored}
            </div>
          }
          <hr/>
          <h4>Players:</h4>
          <ul>
            {players.map(player =>
              <li key={player.UserId}>{player.Name}  </li>
            )}
          </ul>
          <hr />
          <Button variant='contained' onClick={onStart}>Start!</Button>
          <sup>{message}</sup>
        </div>
      </div>
    </div>
  );
}
