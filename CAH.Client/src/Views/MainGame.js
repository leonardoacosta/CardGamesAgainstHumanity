import React, { useRef, useEffect, useState } from 'react';

export default function MainGame(props) {
  const [ blackCard, setBlackCard ] = useState("");
  const [ players, setPlayers ] = useState([]);
  const [ currentBlackPlayer, setCurrentBlackPlayer ] = useState({});
  const [ answers, setAnswers ] = useState([]);

  const client = useRef(props.ws).current;

  const shuffle = (array) =>{
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  useEffect(() => {
    var masterConnection = localStorage.getItem("masterConnection");

    var payload = {
      type: "status",
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
    if(obj.type === "status"){
      setBlackCard(obj.room.BlackCard);
      setPlayers(obj.room.Players)
      setCurrentBlackPlayer(obj.room.CurrentBlackPlayer)
    }

    if(obj.type === "answer"){

      var player = players.filter(s=>s.UserId === obj.userId)[0];
      var others = players.filter(s=>s.UserId !== obj.userId);
      player.Done=true;
      player.Answers= obj.answer;
      var updated = [...others, player]
      let donePlayers = updated.filter(s=>s.Done === true);

      if(donePlayers.length === updated.length-1){
        let shuffled = shuffle(updated);
        setAnswers(shuffled )
        let masterConnection = localStorage.getItem("masterConnection");
        let payload = {
          type: 'trial',
          masterConnection: masterConnection,
          shuffled
        }
        client.send(JSON.stringify(payload))
      }
      setPlayers(updated)
      
    }
    if(obj.type === "newGame"){
      setBlackCard(obj.room.BlackCard);
      setPlayers(obj.room.Players)
      setCurrentBlackPlayer(obj.room.CurrentBlackPlayer)
      setAnswers([])
    }
  }


  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h1>{blackCard}</h1>
          <hr />
          <ul>
            {players.map(player=>{
              return (<li style={{
                textDecoration: player.Done ? 'line-through' : 'none'
              }}>{player.UserId === currentBlackPlayer.UserId? "[":""}{player.Name} {player.UserId === currentBlackPlayer.UserId? "]":""} {player.Wins>0?player.Wins:""}</li>)
            }
            )}
          </ul>
          {answers.length > 0 && <h4>Answers</h4>}
          
          <ul>{answers.map(player=>{
              if(player.Answers !== undefined)
                return player.Answers.map(answer => <li>{answer}</li> )
            })}</ul>
        </div>
      </div>
    </div>
  );
}
