import React, { useState, useEffect, useRef } from 'react';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Icon from '@material-ui/core/Icon';
import { Button, Input } from '@material-ui/core';
import { useHistory } from "react-router-dom";

export default function Setup(props) {
  const client = useRef(props.ws).current;
  let history = useHistory();
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    var payload = {
      type: "setup"
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

    if (obj.type === "setup")
      setPacks(obj.sets)
    if (obj.type === "newRoom") {
      localStorage.setItem("masterConnection", obj.masterConnection);

      // Go to Next screen
      history.push("/WaitingScreen")
    }
  }

  const startNewGame = e => {
    e.preventDefault();

    // Get All sets
    var data = new FormData(e.target);
    var result = {};
    for (var value of data.keys()) {
      result[value] = true;
    }

    // Send to Server
    var payload = {
      type: "newRoom",
      sets: result
    };
    client.send(JSON.stringify(payload));
  };

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='offset-md-3 col-md-6'>
          <h1>Start New Game</h1>
          <h2>Select packs</h2>
          <form onSubmit={startNewGame}>
            <FormGroup row>
              {packs.map(pack => <FormControlLabel style={{ width: "30%" }}
                control={<Checkbox
                  icon={<Icon className={`fa fa-${pack.icon}`} style={{ color: "rgba(0,0,0,.8)" }} />}
                  checkedIcon={<Icon className={`fa fa-${pack.icon}`}
                    style={{
                      color: "rgba(0,0,0,.8)",
                      background: "rgba(0,0,0,.2)",
                      borderRadius: "25%"
                    }} />}
                  name={pack.abbr} />}
                label={pack.name} />
              )}

            </FormGroup>
            <hr />
            <Button type="submit" variant='outlined' color='primary'>Create Room</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
