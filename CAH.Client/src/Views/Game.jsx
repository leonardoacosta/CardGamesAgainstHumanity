import React, { useRef, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import Trial from "../components/Trial";
import Hand from "../components/Hand";
import Audience from "../components/Audience";
import Room from "../components/Room";

export default function Game(props) {
  const [show, setShow] = useState(false);

  const history = useHistory();
  const [player, setPlayer] = useState({})
  const [room, setRoom] = useState({})

  const [answers, setAnswers] = useState([]);
  const [message, setMessage] = useState("");

  const [waiting, setWaiting] = useState(false);
  const [trial, setTrail] = useState(false);
  const [hand, setHand] = useState(false);
  const [audience, setAudience] = useState(false);
  const [reveal, setReveal] = useState(0);

  const [selected, setSelected] = useState([]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const client = useRef(props.ws).current;

  useEffect(() => {
    let userId = localStorage.getItem("UserId");
    let roomId = localStorage.getItem("RoomId");

    let payload = {
      type: "getRoom",
      userId,
      roomId
    };
    client.send(JSON.stringify(payload));

  }, [])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);

    console.log({ obj });
    setMessage("");

    let userId = localStorage.getItem("UserId");

    switch (obj.type) {
      case "gotRoom":
        //Set Cards
        setPlayer(obj.Player);

        //Set Black Card
        setRoom(obj.Room);

        //set view
        var current = obj.Room.CurrentPlayer.UserId == obj.Player.UserId
        if(obj.Room.Reveal == null)
        {
          setWaiting(current)
          setHand(!current)
          setAudience(false)
        }
        else {
          setAnswers(obj.Room.Answers)
          setReveal(obj.Room.Reveal)
          setWaiting(false)
          setTrail(current)
          setHand(false)
          setAudience(!current)
        }
        break;
      case "trial":
        //set Shuffeled Answers
        setAnswers(obj.Room.Answers)
        setReveal(0);

        var current = obj.Room.CurrentPlayer.UserId === userId
        setWaiting(false)
        setTrail(current)
        setHand(false)
        setAudience(!current)
        break;
      case "reveal":
        setReveal(obj.reveal)
        break;
      case "newGame":
        setReveal(0);
        setAnswers([])
        setSelected([])
        setRoom(obj.Room);

        var current = obj.Room.CurrentPlayer.UserId === userId
        setWaiting(current)
        setHand(!current)
        setAudience(false)
        setTrail(false)
        setPlayer(obj.Player);
        break;
      case "liked":
        setAnswers(obj.Room.Answers)
        break;
      case "failed":
        history.push("/")
        break;
    }

  }


  const finalAnswer = e => {
    e.preventDefault();

    if (selected.length > 0) {
      setMessage("")

      let userId = localStorage.getItem("UserId");
      let roomId = localStorage.getItem("RoomId");

      let payload = {
        type: "answer",
        answer: selected,
        userId,
        roomId
      };
      client.send(JSON.stringify(payload));
      setWaiting(true);
      setHand(false)
    }
    else {
      setMessage("Choose at least one card")
    }
  }

  const onJudge = e => {
    e.preventDefault();
    if (selected.length == 1) {
      let userId = localStorage.getItem("UserId");
      let roomId = localStorage.getItem("RoomId");

      let payload = {
        type: "resolve",
        winner: selected[0],
        userId: userId,
        roomId: roomId
      };
      client.send(JSON.stringify(payload));
    }
    else
      setMessage("Make up your mind")

  }

  const selectWinner = userId => {
    //if already exists, remove
    if (selected.indexOf(userId) >= 0)
      setSelected([]);

    //else add
    else
      setSelected([userId])
  }

  const selectCard = card => {
    if (selected.indexOf(card) >= 0) {
      let update = selected.filter(s => s !== card)
      setSelected(update);
    }
    else {
      setSelected([...selected, card])
    }
  }

  const onReveal = () => {
    let userId = localStorage.getItem("UserId");
    let roomId = localStorage.getItem("RoomId");
    var update = reveal + 1;

    setReveal(update)

    let payload = {
      type: "reveal",
      userId,
      roomId,
      reveal: update
    };
    client.send(JSON.stringify(payload));
  }

  const onLike = uId => {

    let userId = localStorage.getItem("UserId");
    let roomId = localStorage.getItem("RoomId");

    setSelected([...selected, uId]);

    let payload = {
      type: "like",
      userId,
      roomId,
      vote: uId
    };
    client.send(JSON.stringify(payload));
  }

  // const goHome = () => history.push("/")


  return (
    <div className='container-fluid'>
      <div className="row">
        <div className="offset-4 col-6">
          <h3> {room.CurrentPlayer && room.CurrentPlayer.Name} is it!</h3>
        </div>
        <div className="col-2">
            Wins: {player.Wins}
        </div>
      </div>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <div className="card text-white bg-dark mb-3">
            <div className="card-body">
              <h4 className="card-title">
                {room.CurrentCard}
              </h4>
            </div>
          </div>
          <hr />
          {waiting && <h2>Waiting on others...</h2>}
          {hand && <Hand onSubmit={finalAnswer} player={player} select={selectCard} selected={selected} />}
          {trial && <Trial onSubmit={onJudge} answers={answers} selectPlayer={selectWinner} onReveal={onReveal} reveal={reveal} selected={selected} />}
          {audience && <Audience selected={selected} answers={answers} reveal={reveal} like={onLike} />}
          <br />
          <sup className="text-danger">{message}</sup>
          <hr />

          {room.Players !== undefined &&
            <>
              <Button className="text-right"  onClick={handleShow}>
                View Room
              </Button>
              <Room show={show} handleClose={handleClose} room={room} />
            </>
          }
        </div>
      </div>
    </div>
  );
}
