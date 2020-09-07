import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export default function Game(props) {
  const [cards, setCards] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [blackCard, setBlackCard] = useState("");
  const [message, setMessage] = useState("");

  const [waiting, setWaiting] = useState(false);
  const [trial, setTrail] = useState(false);
  const [hand, setHand] = useState(false);
  const [audience, setAudience] = useState(false);
  const [reveal, setReveal] = useState(0);

  const [selected, setSelected] = useState([]);

  const client = useRef(props.ws).current;

  useEffect(() => {
    let userId = localStorage.getItem("userId");
    let masterConnection = localStorage.getItem("masterConnection");

    let payload = {
      type: "status",
      userId: userId,
      masterConnection: masterConnection
    };

    if (client.readyState !== 1)
      client.onopen = () => {
        client.send(JSON.stringify(payload));
      }
    else
      client.send(JSON.stringify(payload));
  }, [client])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    console.log({ obj });

    setMessage("")

    let userId = localStorage.getItem("userId");
    if (obj.type === "status") {
      //Set Cards
      if (obj.cardsInHand !== undefined)
        setCards(obj.cardsInHand);

      else {
        var player = obj.room.Players.filter(p => p.UserId == userId)[0]
        setCards(player.Cards)
      }

      //Set Black Card
      setBlackCard(obj.room.BlackCard);

      //Set Hand
      if (obj.room.CurrentBlackPlayer.UserId == userId) {
        setMessage("You are the black card")
        setWaiting(true)
        setHand(false)
        setAudience(false)
      }
      else {
        setHand(true)
        setWaiting(false)
        setAudience(false)
      }
    }
    if (obj.type === "trial") {
      setAnswers(obj.shuffeled)
      setReveal(0);
      //are you the black card holder
      if (obj.room.CurrentBlackPlayer.UserId == userId) {
        setWaiting(false)
        setTrail(true)
        setHand(false)
        setAudience(false)
      }
      else {
        setHand(false)
        setWaiting(false)
        setTrail(false)
        setAudience(true)
      }
    }

    if (obj.type === "reveal") {
      setReveal(obj.reveal)
    }
    if (obj.type === "newGame") {
      setReveal(0);
      setAnswers([])
      setSelected([])
      setBlackCard(obj.room.BlackCard);

      if (obj.room.CurrentBlackPlayer.UserId == userId) {
        setMessage("You are the black card")
        setWaiting(true)
        setTrail(false)
        setHand(false)
        setAudience(false)
      } else {
        setMessage("")
        setHand(true)
        setWaiting(false)
        setAudience(false)
        setTrail(false)
        setCards(obj.cardsInHand);
      }
    }
  }
  const submit = e => {
    e.preventDefault();


    if (selected.length > 0) {
      setMessage("")

      let userId = localStorage.getItem("userId");
      let masterConnection = localStorage.getItem("masterConnection");
      let payload = {
        type: "answer",
        answer: selected,
        userId: userId,
        masterConnection: masterConnection
      };
      client.send(JSON.stringify(payload));
      setWaiting(true);
      setHand(false)
    }
    else {
      setMessage("Please choose at least one card")
    }
  }
  const onJudge = e => {
    e.preventDefault();

    // Get All sets
    let data = new FormData(e.target);
    let result = {};
    for (let value of data.keys()) {
      result[value] = true;
    }
    let required = Object.keys(result).length;
    if (required === 1) {
      setMessage("")
      let winner = "";
      Object.keys(result).forEach(w => winner = w);
      let userId = localStorage.getItem("userId");
      let masterConnection = localStorage.getItem("masterConnection");

      let payload = {
        type: "resolve",
        winner: winner,
        userId: userId,
        masterConnection: masterConnection
      };
      client.send(JSON.stringify(payload));
    }
    else if (selected.length > required) {
      setMessage("Too many cards selected")
    }
    else {
      setMessage("Not Enough Cards")
    }
  }

  const select = e => {
    if (selected.indexOf(e.target.name) >= 0) {
      let update = selected.filter(s => s !== e.target.name)
      setSelected(update);
    }
    else {
      setSelected([...selected, e.target.name])
    }
  }

  const onReveal = () => {

    let userId = localStorage.getItem("userId");
    let masterConnection = localStorage.getItem("masterConnection");
    var update = reveal + 1;

    setReveal(update)
    let payload = {
      type: "reveal",
      userId: userId,
      masterConnection: masterConnection,
      reveal: update
    };
    client.send(JSON.stringify(payload));
  }

  const Audience = () => {
    return (
      <div>
        <h2>Answers</h2>
        {
          answers.map((player, index) => {
            if (player.Answers !== undefined) {
              var answer = player.Answers.map(answer => <p>{reveal <= index ? answer.replace(/./g, '*') : answer}</p>)
              return (
                <div className="card m-2">
                  <div className="card-header">Player: {index}</div>
                  <div className="card-body">{answer}</div>
                </div>
              )
            }
          })}
      </div>
    )
  }

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h3>
            
            {blackCard}
          </h3>
          <hr />
          <sup>{message}</sup>
          {waiting ? <h2>Waiting on others...</h2> : ""}
          {hand ?
            <form onSubmit={submit}>
              <FormGroup row>
                {cards.map(card =>
                  <FormControlLabel style={{ width: "45%" }}
                    control={<Checkbox onClick={select} name={card} />} label={card} />
                )}
              </FormGroup>
              <hr />
              <Button type="submit" variant='outlined' color='primary'>Final Answer</Button>
            </form>
            : ""}
          {trial ?
            <form onSubmit={onJudge}>
              <FormGroup row>
                {answers.map((player, index) => {
                  if (player.Answers !== undefined) {
                    var answer = player.Answers.map(answer => <p>{reveal <= index ? answer.replace(/./g, '*') : answer}</p>)
                    return (<FormControlLabel style={{ width: "45%" }}
                      control={<Checkbox onClick={select} name={player.UserId} />} label={answer} />)
                  }
                })}
              </FormGroup>
              <hr />
              {
                reveal <= answers.length - 1 ?
                <Button type="button" variant='outlined' color='primary' onClick={onReveal}>Reveal</Button>:
                  <Button type="submit" variant='outlined' color='primary'>Final Answer</Button>

              }
            </form>
            : ""}
          {audience ? <Audience /> : ""}

        </div>
      </div>
    </div>
  );
}
