import http from 'http';
import cors from 'cors';
import 'dotenv';
import express from 'express';
import bodyParser from "body-parser";
import Cards from './Helpers/Cards.js';
import { readFileSync } from 'fs';
const webSocketServer = require('websocket').server;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get("/", (req,res)=>{
    res.send('hello world')
})

const server = http.createServer(app);
const wsServer = new webSocketServer({ httpServer: server });

const allConnections = {};
const allRooms = [];

const s = () => Math.floor(Math.random() * Math.floor(1000))
const s4 = () => s() + s() + s() + s()

const generateConnectionId = () => s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4()
const generateUserId = () => s4() + s4() + s4() + s4()
const generateRoomId = () => s4()

wsServer.on('request', function (request) {

    const connection = request.accept(null, request.origin);
    var connectionId = generateConnectionId();
    allConnections[connectionId] = connection;

    connection.on('message', function (message) {
        var obj = JSON.parse(message.utf8Data);
        console.log("=====")
        console.log(obj)

        if (obj.type === 'setup') {
            var sets = Cards.getPacks();
            var payload = {
                type: "setup",
                sets: sets
            };

            connection.sendUTF(JSON.stringify(payload));
        }
        if (obj.type === 'newRoom') {
            var roomId = generateRoomId();

            var random = obj.sets.includes("randomOrder")

            if(random)
                obj.sets = obj.sets.filter(s=>s!=="randomOrder")

            var newRoom = {
                MasterConnection: connectionId,
                RoomId: roomId,
                Players: [],
                Sets: obj.sets,
                Random: random,
                Started: false
            }

            //Create the room in memory
            allRooms.push(newRoom)

            // Tell master they are master
            var payload = {
                type: "newRoom",
                Room: newRoom
            }
            connection.sendUTF(JSON.stringify(payload));
        }
        //Must have room from here on out
        let rooms = allRooms.filter(r => r.MasterConnection == obj.masterConnection || r.RoomId == obj.roomId )
        let room = rooms[0]
        if(room === undefined)
            connection.sendUTF(JSON.stringify({ type: 'failed' }))

        else if (obj.type === 'getRoom') {
            var payload = {
                type: "gotRoom",
                Room: room,
            }
            connection.sendUTF(JSON.stringify(payload));
        }
        else if (obj.type === 'join') {
            var newPlayer = {
                UserId: generateUserId(),
                Name: obj.name,
                connectionId: connectionId,
                Wins: 0
            }
            if(room.Started){

                var allWhiteCards = Cards.getWhiteCards(room.Sets)
                let random = [];
                while (random.length < 7) {
                    var aNumber = Math.floor(Math.random() * allWhiteCards.length)
                    if (!random.includes(aNumber)) 
                        random = [...random, aNumber]
                }
                var cards = []
                random.forEach(item => cards = [...cards, allWhiteCards[item]]);
                newPlayer.Cards = cards;
            }
            room.Players.push(newPlayer)
            var payload = {
                type: "joined",
                player: newPlayer,
                room: room
            }
            //send to master connection
            allConnections[room.MasterConnection].sendUTF(JSON.stringify(payload))

            room.Players.forEach(player => 
                allConnections[player.connectionId].sendUTF(JSON.stringify(payload))
            )
        
        }
        else if (obj.type === 'bored') {
            let player = room.Players.filter(player => player.UserId == obj.userId);
            var payload = {
                type: 'bored',
                player: player[0]
            }
            allConnections[room.MasterConnection].sendUTF(JSON.stringify(payload));
        }
        else if (obj.type === 'start') {
            let payload = {
                type: 'start',
            }

            let players = room.Players;
            room.Started = true;

            let allBlackCards = Cards.getBlackCards(room.Sets)
            var randomNumber = Math.floor(Math.random() * allBlackCards.length)
            room.BlackCard = allBlackCards[randomNumber];

            //Select the first black player
            room.CurrentBlackPlayer = players[Math.floor(Math.random() * players.length)];
            
            // Send to Master
            allConnections[room.MasterConnection].send(JSON.stringify(payload));

            //Get all white cards, and pass them out randomly
            var allWhiteCards = Cards.getWhiteCards(room.Sets)
            players.map(player => {
                let random = [];
                while (random.length < 7) {
                    var aNumber = Math.floor(Math.random() * allWhiteCards.length)
                    if (!random.includes(aNumber)) 
                        random = [...random, aNumber]
                }
                var cards = []
                random.forEach(item => cards = [...cards, allWhiteCards[item]]);
                player.Cards = cards;
                allConnections[player.connectionId].send(JSON.stringify(payload));
            });
        }
        else if (obj.type === 'status') {
            var payload = {
                type: 'status',
                room,
            }
            if (obj.userId) {
                var player = room.Players.filter(player => player.UserId == obj.userId)[0];
                payload.cardsInHand = player.Cards;
            }

            allConnections[connectionId].send(JSON.stringify(payload));
        }
        else if (obj.type === 'answer') {
            var payload = {
                type: 'answer',
                userId: obj.userId,
                answer: obj.answer
            }
            var player = room.Players.filter(player => player.UserId == obj.userId)[0];
            player.Answer = obj.answer;

            allConnections[room.MasterConnection].send(JSON.stringify(payload));
        }
        else if (obj.type === 'trial') {
            var payload = {
                type: 'trial',
                shuffeled: obj.shuffled,
                room
            }
            
            allConnections[room.CurrentBlackPlayer.connectionId].send(JSON.stringify(payload));

            room.Players.forEach(player => {
                allConnections[player.connectionId].send(JSON.stringify(payload));
            });
        }
        else if (obj.type === 'reveal'){
            var payload = {
                type: 'reveal',
                reveal: obj.reveal
            }
            
            allConnections[room.MasterConnection].send(JSON.stringify(payload));

            room.Players.forEach(player => {
                allConnections[player.connectionId].send(JSON.stringify(payload));
            });
        }
        else if (obj.type === 'resolve') {

            var players = room.Players;

            //Give the winner a point
            var player = room.Players.filter(player => player.UserId == obj.winner)[0];
            player.Wins = player.Wins+1;

            //Next Round
            //Choose New Black Card Player
            var lastBlackCard = room.Players.indexOf(room.CurrentBlackPlayer);
            let newIndex = 0;
            if(lastBlackCard != room.Players.length-1 )
                newIndex = lastBlackCard+1;
                
            room.CurrentBlackPlayer = room.Players[newIndex];

            //Choose New Black Card
            let allBlackCards = Cards.getBlackCards(room.Sets)
            var randomNumber = Math.floor(Math.random() * allBlackCards.length)
            room.BlackCard = allBlackCards[randomNumber];

            let payload = {
                type: 'newGame',
                room
            }
            // Tell master about new Game with new black players and card
            allConnections[room.MasterConnection].send(JSON.stringify(payload));

            //Replace used cards
            var allWhiteCards = Cards.getWhiteCards(room.Sets)
            players.map(player => {

                //Remove used cards from hand
                if(player.Answer !== undefined){
                    player.Answer.forEach(answer=>{
                        console.log("Card I need to give up",{answer})
                        player.Cards = player.Cards.filter(card => card !== answer)
                        console.log("I gave up the card",player.Cards)
                    })
                }
                player.Answer = [];

                // Grab new numbers
                let random = [];
                while (random.length <  7 - player.Cards.length) {
                    var aNumber = Math.floor(Math.random() * allWhiteCards.length)
                    if (!random.includes(aNumber)) 
                        random = [...random, aNumber]
                }
                console.log(7 - player.Cards.length)
                console.log("Random Number I drew",{random})

                // Grab the cooresponding cards
                random.forEach(item => player.Cards.push( allWhiteCards[item]));
                console.log("My new hand",player.Cards)

                payload.cardsInHand = player.Cards;
                allConnections[player.connectionId].send(JSON.stringify(payload));
            });

        }
        
    })
});

server.listen(process.env.PORT || 8000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

