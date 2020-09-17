import http from 'http';
import cors from 'cors';
import 'dotenv';
import express from 'express';
import bodyParser from "body-parser";
import Cards from './Helpers/Cards.js';
import { v4 as uuidv4 } from 'uuid';
import _ from "lodash"

const webSocketServer = require('websocket').server;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get("/", (req, res) => {
    res.send('hello world')
})

const server = http.createServer(app);
const wsServer = new webSocketServer({ httpServer: server });


const allRooms = {};
const s = () => Math.floor(Math.random() * Math.floor(1000))
const s4 = () => s() + s() + s() + s()
const generateRoomId = () => s4()

wsServer.on('request', function (req) {
    const connection = req.accept(null, req.origin);
    connection.on('message', function (message) {
        var request = JSON.parse(message.utf8Data);
        console.log("=======================================")
        console.warn(request)

        let room = allRooms[request.roomId]
        let payload = {};

        if (room == undefined) {
            switch (request.type) {
                case "setup":
                    var sets = Cards.getPacks();
                    payload = {
                        type: "setup",
                        sets: sets
                    };
                    connection.sendUTF(JSON.stringify(payload));
                    break;
                case "newRoom":
                    // Create Room
                    let newRoom = CreateNewRoom(request.room);

                    // Create Player
                    var newPlayer = CreatePlayer(request.room.name, connection);
                    newRoom.Players.push(newPlayer);
                    allRooms[newRoom.RoomId] = newRoom

                    // Tell player About The Room
                    payload = {
                        type: "newRoom",
                        Room: newRoom,
                        UserId: newPlayer.UserId
                    }
                    LetOneKnow(newPlayer, payload)
                    break;
                default:
                    connection.sendUTF(JSON.stringify({ type: 'failed' }))
                    break;
            }
        }
        else {
            let players = room.Players;
            var player = room.Players.filter(p => p.UserId == request.userId)[0]
            if(player !== undefined)
                if( !_.isEqual(player.Connection, connection))
                    player.Connection = connection;

            switch (request.type) {
                case "getRoom":
                    payload = {
                        type: "gotRoom",
                        Room: room,
                    }
                    payload.Player = player;
                    LetOneKnow(player, payload);
                    break;
                case "join":
                    if (player !== undefined) {
                        payload = {
                            type: "rejoined",
                            Player: player,
                            room
                        }
                        LetOneKnow(player, payload);
                    }
                    else {
                        let newPlayer = CreatePlayer(request.name, connection);
                        if (room.Started)
                            GivePlayerCards(newPlayer, room);
                        players.push(newPlayer);
                        payload = {
                            type: "joined",
                            Player: newPlayer,
                            Room: room
                        }
                        LetEveryoneKnow(room, payload);
                    }
                    break;
                case "bored":
                    var randomColor = Math.floor(Math.random()*16777215).toString(16);
                    payload = {
                        type: 'bored',
                        Player: player,
                        Color: randomColor
                    }
                    LetEveryoneKnow(room, payload)
                    break;
                case "like":
                    let playerAnswer = room.Answers.filter(s=>s.UserId == request.vote)[0];
                    if(playerAnswer["Liked"] === undefined )
                        playerAnswer.Liked=1
                    else
                        playerAnswer.Liked = playerAnswer.Liked + 1;
                    payload = {
                        type: 'liked',
                        Room: room
                    }
                    LetEveryoneKnow(room, payload)
                    break;
                case "start":
                    payload = {
                        type: 'start',
                    }
                    room.Started = true;

                    SetBlackCard(room);
                    SetCurrentPlayer(room);

                    players.forEach(p => {
                        GivePlayerCards(p, room);
                        LetOneKnow(p, payload);
                    })
                    break;
                case "answer":
                    // Save answer
                    player.Answer = request.answer;
                    room.Answers.push(player)

                    // Is Round Over?
                    if (room.Answers.length >= players.length - 1) {
                        room.Answers = shuffle(room.Answers)
                        room.Reveal = 0
                        payload = {
                            type: 'trial',
                            Room: room,
                        }
                        LetEveryoneKnow(room, payload)
                    }
                    else {
                        payload = {
                            type: 'answer',
                            Player: player
                        }
                        LetEveryoneKnow(room, payload)
                    }
                    break;
                case "reveal":
                    room.Reveal = request.reveal
                    payload = {
                        type: 'reveal',
                        reveal: request.reveal  // this should be a number
                    }
                    LetEveryoneKnow(room, payload)
                    break;
                case "resolve":
                    //Give the winner a point
                    let winner = players.filter(player => player.UserId == request.winner)[0];
                    winner.Wins = player.Wins + 1;

                    let lastplayer = players.indexOf(room.CurrentPlayer);
                    let newIndex = 0;
                    if (lastplayer != players.length - 1)
                        newIndex = lastplayer + 1;

                    room.CurrentPlayer = players[newIndex];
                    room.Answers = [];
                    room.Reveal = null;

                    //Choose New Black Card
                    SetBlackCard(room);

                    payload = {
                        type: 'newGame',
                        Room: room
                    }
                    players.map(p => {
                        delete p.Liked
                        Discard(p);
                        GivePlayerCards(p, room);

                        payload.Player = p;

                        LetOneKnow(p, payload)
                    });
                    break;
                default:
                    connection.sendUTF(JSON.stringify({ type: 'failed' }))
                    break;
            }
        }
        console.warn("++++++++++++++++++++++++++++++++")
        console.warn({ payload })
    })
});

const CreatePlayer = (name, connection) => {
    var userId = uuidv4() + "-" + uuidv4();
    return {
        Name: name,
        UserId: userId,
        Wins: 0,
        CardsInHand: [],
        Connection: connection
    }
}

const CreateNewRoom = (obj) => {
    var roomId = generateRoomId();
    var random = obj.Sets.includes("randomOrder")
    var open = obj.Sets.includes("public")

    obj.Sets = obj.Sets.filter(s => s != "public");
    obj.Sets = obj.Sets.filter(s => s != "randomOrder");

    let newRoom = {
        RoomId: roomId,
        Players: [],
        Sets: obj.Sets,
        Random: random,
        Started: false,
        Public: open,
        HandSize: obj.cards,
        CurrentCard: "",
        CurrentPlayer: {},
        Answers: [],
        Reveal: null
    }
    allRooms[roomId] = newRoom;
    return newRoom;
}

const GivePlayerCards = (player, room) => {
    var allWhiteCards = Cards.getWhiteCards(room.Sets)
    let random = [];

    while (random.length < room.HandSize - player.CardsInHand.length) {
        var aNumber = Math.floor(Math.random() * allWhiteCards.length)
        if (!random.includes(aNumber))
            random = [...random, aNumber]
    }

    random.forEach(item => player.CardsInHand.push(allWhiteCards[item]));
}

const clearCircle = (key, value) => {
        if (key == "Connection") 
            return;
        return value;
}

const LetEveryoneKnow = (room, payload) => {
    var clean = _.cloneDeep(payload);// JSON.parse(JSON.stringify(payload));
    room.Players.forEach(p => p.Connection.send(JSON.stringify(clean, clearCircle)));
}

const LetOneKnow = (player, payload) => {
    var clean = _.cloneDeep(payload);// JSON.parse(JSON.stringify(payload));
    player.Connection.sendUTF(JSON.stringify(clean, clearCircle));
}

const SetBlackCard = (room) => {
    let lastcard = room.CurrentCard;
    let allBlackCards = Cards.getBlackCards(room.Sets)

    while (lastcard == room.CurrentCard) {
        var randomNumber = Math.floor(Math.random() * allBlackCards.length)
        room.CurrentCard = allBlackCards[randomNumber];
    }
}

const SetCurrentPlayer = room => {
    let players = room.Players;
    room.CurrentPlayer = players[Math.floor(Math.random() * players.length)];
}

const Discard = player => {
    if (player.Answer !== undefined) {
        player.Answer.map(answer => {
            player.CardsInHand = player.CardsInHand.filter(card => card !== answer)
        })
    }
    player.Answer = [];
}


const shuffle = (array) => {
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

server.listen(process.env.PORT || 8000, () => {
    console.log(`Server started on port ${server.address().port} <3`);
});
