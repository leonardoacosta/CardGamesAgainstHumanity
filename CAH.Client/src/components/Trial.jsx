import React from 'react';
import { Button } from 'react-bootstrap';
export default function Trial({onSubmit, answers, selectPlayer, onReveal, reveal, selected}) {

    const cardStyle = userId => {
        if (selected.includes(userId))
          return {
            boxShadow: "0px 0px 15px"
          }
        else
          return {
            boxShadow: "0px 0px 1px"}
      }
    
    const cardClass = index =>{
        let result = "card mb-2"
        if(index >= reveal)
            return result+" text-white bg-dark";
        else
            return result;
    }

    return (
        <form onSubmit={onSubmit}>
            {answers.map((p, index) => {
                let answer = "Card Games Against Humanity";
                if(reveal > index)
                    answer= p.Answer.map(answer => <p>{answer}</p>)

                return (
                    <div style={cardStyle(p.UserId)} className={cardClass(index)} onClick={() => selectPlayer(p.UserId)} >
                        <div className="card-body">
                            <span className="card-title" >{answer}</span><br/>
                            {p.Liked && 
                                <span className="card-subtitle" >💖 {p.Liked}</span>
                            }
                        </div>
                    </div>
                )
            })
            }
            <hr />
            {
                reveal <= answers.length - 1 ?
                    <Button type="button" variant="outline-secondary" onClick={onReveal}>Reveal</Button> :
                    <Button type="submit" variant="outline-secondary">Final Answer</Button>

            }
        </form>
    )
}