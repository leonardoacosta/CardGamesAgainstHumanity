import React from 'react';
export default function Audience({answers, reveal, selected, like}) {
    const cardClass = index =>{
        let result = "card mb-2"
        if(index >= reveal)
            return result+" text-white bg-dark";
        else
            return result;
    }

    const cardStyle = {boxShadow: "0px 0px 1px"}

    return (
        <div>
          <h2>Answers</h2>

            {answers.map((p, index) => {
                let answer = "Card Games Against Humanity";
                var show = reveal > index
                if(show)
                    answer= p.Answer.map(answer => <p>{answer}</p>)

                return (
                    <div style={cardStyle} className={cardClass(index)} >
                        <div className="card-body">
                            <span className="card-subtitle" >{answer}</span>
                            {show && !selected.includes(p.UserId) && 
                                <span onClick={()=>like(p.UserId)}> 
                                ♡
                                </span>
                            }
                            {show && selected.includes(p.UserId) && 
                                <span> 
                                💖
                                </span>
                            }
                        </div>
                    </div>
                )
            })}
        </div>
      )
}
