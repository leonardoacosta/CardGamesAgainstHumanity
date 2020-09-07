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

const server = http.createServer(app);
const wsServer = new webSocketServer({ httpServer: server });

const allConnections = {};
const allRooms = [];

const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);

const generateConnectionId = () => s4() + s4() + s4() + s4() + s4()
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

            //send it back to master
            var payload = {
                type: "newRoom",
                roomId: roomId,
                masterConnection: connectionId
            }
            let realizedSet = []
            Object.keys(obj.sets).forEach(set =>
                realizedSet = [...realizedSet, set]
            )
            //Create the room in memory
            allRooms.push({
                MasterConnection: connectionId,
                RoomId: roomId,
                Players: [],
                Sets: realizedSet
            })
            connection.sendUTF(JSON.stringify(payload));
        }

        //Must have room from here on out
        let rooms = allRooms.filter(r => r.MasterConnection === obj.masterConnection || r.RoomId == obj.roomId)
        let room = rooms[0]
        if(room === undefined)
            connection.sendUTF(JSON.stringify({ type: 'failed' }))

        else if (obj.type === 'getRoom') {
            var payload = {
                type: "gotRoom",
                roomId: room.RoomId,
            }
            connection.sendUTF(JSON.stringify(payload));
        
        }
        else if (obj.type === 'join') {
            let userId = generateUserId();
            var player = {
                UserId: userId,
                Name: obj.name,
                connectionId: connectionId,
                Wins: 0
            }

            room.Players.push(player)
            var payload = {
                type: "joined",
                name: player.Name,
                userId: userId,
                masterConnection: room.MasterConnection
            }
            //send to master connection
            allConnections[room.MasterConnection].sendUTF(JSON.stringify(payload))

            //send to joining party
            connection.sendUTF(JSON.stringify(payload))
        
        }
        else if (obj.type === 'bored') {
            let players = room.Players.filter(player => player.UserId === obj.userId);
            var payload = {
                type: 'bored',
                userId: players[0].Name
            }
            allConnections[room.MasterConnection].sendUTF(JSON.stringify(payload));
        }
        else if (obj.type === 'start') {
            let payload = {
                type: 'start',
            }

            let players = room.Players;

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
            if (obj.userId !== undefined) {
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



//   // broadcasting message to all connected clients
//   for(key in clients) {
//     clients[key].sendUTF(message.utf8Data);
//     console.log('sent Message to: ', clients[key]);
//   }

server.listen(process.env.PORT || 8000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

