import React, { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Button, Card } from "react-bootstrap";
import Ticker from 'react-ticker'

export default function Lobby({ws: client}) {
  // const client = useRef(props.ws).current;
  let history = useHistory();
  const [message, setMessage] = useState("");
  const [bored, setBored] = useState("");
  const [room, setRoom] = useState({});
  const [player, setPlayer] = useState({});
  const [otherPlayers, setOtherPlayer] = useState([]);
  const [start, setStart] = useState(false);

  useEffect(() => {
    var roomId = localStorage.getItem("RoomId");
    var userId = localStorage.getItem("UserId");

    var payload = {
      type: "getRoom",
      roomId,
      userId
    };
      client.send(JSON.stringify(payload));
  }, [])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    
    var roomId = localStorage.getItem("RoomId");
    var userId = localStorage.getItem("UserId");

    console.log({obj})

    switch(obj.type){
      case "start":
        document.body.style.backgroundColor = "#FFF"
        history.push("/Game")
        break;

      case "gotRoom":
        setRoom(obj.Room)
        let p = obj.Room.Players.filter(s=>s.UserId == userId)[0]
        setPlayer(p)
        var test = obj.Room.Players.filter(a=>  a.UserId !== userId)
        setOtherPlayer(test);

        if(obj.Room.Players.length === 1)
          setStart(true)
        break;

      case "joined":
        setRoom(obj.Room);
        setMessage(obj.Player.Name + " has joined the chat!");
        var test = obj.Room.Players.filter(a=>  a.UserId !== userId)
        setOtherPlayer(test);


        var payload = {
          type: "getRoom",
          roomId,
          userId
        };
        client.send(JSON.stringify(payload));

        break;
      
      case "bored":
        setBored(obj.Player.Name + " bored!")
        document.body.style.backgroundColor = "#"+obj.Color
        break;

      case "failed":
        history.push("/")
        break;
      
      default:
        break;
    }
  }

  const onBored = () => {
    var roomId = localStorage.getItem("RoomId");
    var userId = localStorage.getItem("UserId");

    client.send(JSON.stringify({
      type: "bored",
      userId,
      roomId
    }));
  }

  const onStart = () =>{
    var roomId = localStorage.getItem("RoomId");
    var userId = localStorage.getItem("UserId");

    client.send(JSON.stringify({
      type: "start",
      userId,
      roomId
    }));
  }


  return (
    <div className='container'>
      <div className='row'>
        <div className='offset-md-3 col-md-6 text-center'>
          <h2>Room Id: {room.RoomId}</h2>
          <h3>Hey {player.Name} 👋 </h3>
          <hr/>
          {otherPlayers.length > 0  &&
            <Ticker offset="run-in" speed={10} mode="smooth">
                {() => (
                    <>
                        <p style={{ whiteSpace: "nowrap" }}>We're waiting with <span style={{ fontWeight: 'bold' }}>{otherPlayers.map(s=> s.Name).join(", ")}</span> </p>
                    </>
                )}
            </Ticker> 
          }
          <hr />
          <Card style={{ width: '100%' }}>
            <Card.Body>
              <Card.Text><sup>{message}</sup></Card.Text>
              <Card.Text><sup>{bored}</sup></Card.Text>
              <Card.Title>Waiting in the room and I'm in the room bored</Card.Title>
              <Card.Text>
                <Button onClick={onBored} variant='outlined-secondary'>Click</Button>
              </Card.Text>
            </Card.Body>
          </Card>
          <hr/>
          {(start && otherPlayers.length > 0) &&
            <Button onClick={onStart} variant='outlined-primary'>Start</Button>
          }
        </div>
      </div>
    </div>
  )
}