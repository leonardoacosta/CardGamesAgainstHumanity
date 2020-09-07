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
  const [reveal, setReveal] = useState(false);

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
  }, [])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    console.log({obj});
    let userId = localStorage.getItem("userId");
    if (obj.type === "status") {
      setCards(obj.cardsInHand);
      setBlackCard(obj.room.BlackCard);
      if (obj.room.CurrentBlackPlayer.UserId === userId) {
        setMessage("You are the black card")
        setWaiting(true)
      }
    }
    if (obj.type === "trial") {
      if (obj.room.CurrentBlackPlayer.UserId === userId) {
        setMessage("")
        setWaiting(false)
        setTrail(true)
        setAnswers(obj.shuffeled)
      }
    }
    if (obj.type === "newGame") {
      setAnswers([])
      setSelected([])
      setBlackCard(obj.room.BlackCard);

      if (obj.room.CurrentBlackPlayer.UserId === userId) {
        setMessage("You are the black card")
        setWaiting(true)
        setTrail(false)
      }else{
        setMessage("")
        setWaiting(false)
        setTrail(false)
        setCards(obj.cardsInHand);
      }
    }
  }
  const submit = e => {
    e.preventDefault();
    let required = blackCard.split("_").length - 1;

    if (selected.length === required || (blackCard.split("_").length === 1 && selected.length === 1)) {
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
    }
    else if (selected.length > required) {
      setMessage("Too many cards selected")
    }
    else {
      setMessage("Not Enough Cards")
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
    console.log(required, result)
    if(required === 1) {
      setMessage("")
      let winner = "";
      Object.keys(result).forEach(w=> winner = w);
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
    else if(selected.length > required ){ 
      setMessage("Too many cards selected")
    }
    else{
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

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h3>
            {/* {(blackCard.split("_")).map((segment, index)=>{
                  if(blackCard.split("_").length === 1 )
                    return blackCard;
                  if(blackCard.split("_").length >= index)
                   return segment+ (selected[index] !== undefined ? selected[index] : "___" )
              })} */}
            {blackCard}
          </h3>
          <hr />
          <sup>{message}</sup>
          {waiting ? <h2>Waiting on others...</h2> :
            (
              trial === false ?
                <form onSubmit={submit}>
                  <FormGroup row>
                    {cards.map(card =>
                      <FormControlLabel style={{ width: "45%" }}
                        control={<Checkbox onClick={select} name={card} />} label={card} />
                    )}
                  </FormGroup>
                  <hr />
                  <Button type="submit" variant='outlined' color='primary'>Final Answer</Button>
                </form> :
                <form onSubmit={onJudge}>
                  <FormGroup row>
                    {answers.map(player => {
                      if (player.Answers !== undefined) {
                        var answer = player.Answers.map(answer => <p>{answer}</p>)
                        return (<FormControlLabel style={{ width: "45%" }}
                          control={<Checkbox onClick={select} name={player.UserId} />} label={answer} />)
                      }
                    })}
                  </FormGroup>
                  <hr />
                  <Button type="submit" variant='outlined' color='primary'>Final Answer</Button>
                </form>
            )
          }

        </div>
      </div>
    </div>
  );
}
