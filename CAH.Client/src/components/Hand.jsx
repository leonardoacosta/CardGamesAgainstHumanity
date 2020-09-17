import React from 'react';
import { Button } from 'react-bootstrap';
export default function Hand({onSubmit, player, select, selected}) {


    const cardStyle = card => {
        var result = {
            flex: 1,
             minWidth: "auto"
        }
        if (selected.includes(card))
            result.boxShadow = "0px 0px 5px"  

        return result
      }

    return (
        <form onSubmit={onSubmit}>
          <div className="d-flex flex-wrap" style={{justifyContent: 'space-between', flexBasis: 3}}>
            {player.CardsInHand && player.CardsInHand.map(card =>
              <div className="card m-2" onClick={() => select(card)} style={cardStyle(card) }>
                <div className="card-body">
                  <span className="card-subtitle" >{card}</span>
                </div>
              </div>
            )}
          </div>
          <hr />
          <Button type="submit" variant="outline-secondary">Final Answer</Button>
        </form>
    )
}