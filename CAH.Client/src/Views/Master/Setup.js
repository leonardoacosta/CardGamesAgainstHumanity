import React, { useState, useEffect, useRef } from 'react';
import { Button, Checkbox, FormGroup, FormControlLabel, Icon } from '@material-ui/core';
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

  }, [client])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);

    if (obj.type === "setup")
      setPacks(obj.sets)
    if (obj.type === "newRoom") {
      localStorage.setItem("masterConnection", obj.Room.MasterConnection);
      history.push("/WaitingScreen")
    }
  }

  const startNewGame = e => {
    e.preventDefault();

    // Read from form
    var data = new FormData(e.target);
    var result = {};
    for (var value of data.keys()) {
      result[value] = true;
    }

    //clean sets
    let sets = []
    Object.keys(result).forEach(set =>
      sets = [...sets, set]
    )

    // Send to Server
    var payload = {
      type: "newRoom",
      sets: sets
    };
    client.send(JSON.stringify(payload));
  };

  return (
    <div className='container-fluid' style={{ marginBottom: "50vh",}}>

      <h1>Select packs</h1>
      <hr/>
      <form onSubmit={startNewGame}>
        <FormGroup row>
          {packs.map(pack => <FormControlLabel style={{ width: "30%" }}
            key={pack.abbr}
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
        <FormGroup row>
          <FormControlLabel style={{ width: "30%" }}
            control={<Checkbox name="randomOrder" />}
            label="Random Order" />
        </FormGroup>
        <hr />
        <div className="text-center" style={{  width: '100%' }}>

          <Button type="submit" variant='outlined' color='primary'>Create Room</Button>
        </div>
      </form>
    </div>
  );
}
