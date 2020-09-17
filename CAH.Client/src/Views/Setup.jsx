import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Col, Row } from 'react-bootstrap';
import { useHistory } from "react-router-dom";

export default function Setup(props) {
  const client = useRef(props.ws).current;
  let history = useHistory();
  const [packs, setPacks] = useState([]);

  useEffect(() => {
    var payload = {
      type: "setup"
    };
    client.send(JSON.stringify(payload));

  }, [])

  client.onmessage = (message) => {
    const obj = JSON.parse(message.data);
    if (obj.type === "setup")
      setPacks(obj.sets)

    if (obj.type === "newRoom") {
      localStorage.setItem("RoomId", obj.Room.RoomId);
      localStorage.setItem("UserId", obj.UserId);
      history.push("/Lobby");
    }
  }
  const serializeForm = form => {
    var obj = {
      Sets: []
    };
    var formData = new FormData(form);
    for (var key of formData.keys()) {
      let value = formData.get(key);
      if (value === "on")
        obj.Sets.push(key)

      else
        obj[key] = value;
    }
    return obj;
  };

  const startNewGame = e => {
    e.preventDefault();

    // Read from form
    var obj = serializeForm(e.target);

    // Send to Server
    var payload = {
      type: "newRoom",
      room: obj
    };
    client.send(JSON.stringify(payload));
  };

  return (
    <div className='container' style={{ marginBottom: "50vh", }}>

      <h1>Select packs</h1>
      <hr />

      <Form className="text-center" onSubmit={startNewGame}>
        <div className="d-flex flex-wrap">
          {packs.map((pack, index) => (
            <Form.Check type="checkbox" key={index} className="mt-4 ml-4">
              <Form.Check.Input name={pack.abbr} />
              <Form.Check.Label> <i className={`fa fa-${pack.icon}`} /> {pack.name} </Form.Check.Label>
            </Form.Check>
          ))}
        </div>
        <hr />
        <Form.Check type="checkbox" >
          <Form.Check.Input name="randomOrder" />
          <Form.Check.Label>Random order </Form.Check.Label>
        </Form.Check>
        <Form.Check type="checkbox" >
          <Form.Check.Input name="public" />
          <Form.Check.Label> Make Room Public </Form.Check.Label>
        </Form.Check>
        <hr />

        <Form.Group as={Row} controlId="formPlaintextPassword">
          <Form.Label column sm="3">
            Name
          </Form.Label>
          <Col sm="9">
            <Form.Control name="name" type="text" placeholder="Nickname..." />
          </Col>
        </Form.Group>
        <hr />
        <Form.Group as={Row} controlId="formPlaintextPassword">
          <Form.Label column sm="3">
            Number of Cards in Hand
          </Form.Label>
          <Col sm="9">
            <Form.Control name="cards" type="number" defaultValue={7} />
          </Col>
        </Form.Group>
        <hr />
        <Button type="submit" variant='outlined' color='primary'>Create Room</Button>
      </Form>
    </div>
  );
}
