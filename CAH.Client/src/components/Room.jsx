import React from 'react';
import { Modal, Button } from "react-bootstrap";

export default function Room({ room, show, handleClose }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Room Id: {room.RoomId}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h4>Players:</h4>
                {room.Players.map(p=>
                     <p>{p.Name} {p.Wins>0 && `- `+p.Wins}</p>
                )}
                <h5>Public: { room.Public ? "Open" : "Closed"}</h5>
                <h5>Hand size: { room.HandSize }</h5>
                <h5>Sets</h5>
                {room.Sets.map(s=> <p>{s}</p> )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
