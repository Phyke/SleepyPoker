//dependencies
const { table } = require('console');
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const dealer = require('./card');

//system variables
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

//constant values
const PORT = 5000;

//set website folder
app.use(express.static(__dirname));

//set a webpage to return upon entering URL
app.get('/', (req, res) => {
    res.sendFile('index.html');
});

//setup port:5000 and print log on console
server.listen(PORT, () => {
    console.log(`Server running on port:${PORT}`);
});

//==================================================================

let playerSockets = [];
let players = [];
let turn_count = 0;
let player_turn = 2;
let gameStarted = false;
let highestBet = 0;
let minimumBet = 20;
let raiseTurnCount;

class PLAYER {
    constructor (name,number) {
        this.name = name,
        this.number = number,
        this.lastAction = "None",
        this.lastBet = 0,
        this.status = null,
        this.wallet = 100,
        this.hand = null,
        this.cardValueHist = [, , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        this.cardSymbolHist = [, 0, 0, 0, 0]
    }
}
//let timeOut;
//const MAX_WAITING = 5000;

function next_turn(){
    player_turn = (player_turn+1) % players.length;
    while(players[player_turn].folded == true) {
        turn_count++;
        player_turn = (player_turn+1) % players.length;
    }
    playerSockets[player_turn].emit('requestAction');
    console.log("turn count = " , turn_count);
    console.log("player turn = " , player_turn);
    turn_count++;
    //triggerTimeout();
}

/*function triggerTimeout(){
  timeOut = setTimeout(()=>{
    next_turn();
  },MAX_WAITING);
}

function resetTimeOut(){
   if(typeof timeOut === 'object'){
     console.log("timeout reset");
     clearTimeout(timeOut);
   }
}*/

function getAllPlayersData() {
    let allPlayersData = [];
    for(let i = 0; i < players.length; i++){
        allPlayersData.push(players[i]);
    }
    return allPlayersData;
}

io.on('connect', (socket) => {
    console.log("A user connected to the server : ",socket.id);
    console.log("Total users now : ",io.engine.clientsCount);
    if(gameStarted){
        console.log("The game has already started.");
        socket.emit("cantJoin");
        socket.on('disconnect', () => {
            console.log('A user disconnected after cant join, due to game already started');
        });
    }
    else{
        socket.on("joinGame",(username)=>{
            playerSockets.push(socket);
            let newPlayer = new PLAYER(username,players.length);
            players.push(newPlayer);
            socket.emit('takeSeat',newPlayer);
        });

        socket.on('startGame',() => {
            gameStarted = true;
            dealer.buildDeck();
            tableCards = dealer.drawCard(5);

            player_turn = (player_turn+1) % players.length;
            players[player_turn].lastBet = minimumBet/2;
            playerSockets[player_turn].emit("blindBet",minimumBet/2);
            player_turn = (player_turn+1) % players.length;
            players[player_turn].lastBet = minimumBet;
            playerSockets[player_turn].emit("blindBet",minimumBet);
            io.sockets.emit("setupStartGame",[getAllPlayersData(),minimumBet]);
            playerSockets.forEach(socket => {
                handCards = dealer.drawCard(2);

                if(handCards != false) {
                    players[playerSockets.indexOf(socket)].hand = handCards;
                    socket.emit("gameStarted",[tableCards.slice(0,3),handCards]);
                }
                else
                    console.log("not enough cards (onStartGame)");
            });
            
            next_turn();
        });
    
        socket.on('passTurn',(playerData) => {
            //resetTimeOut();
            if(socket.id == playerSockets[player_turn].id) {
                players[player_turn] = playerData;

                if(playerData.lastBet > highestBet)
                    highestBet = playerData.lastBet;

                let lastPlayerData = [playerData.number,playerData.lastAction,playerData.lastBet];
                console.log("Update status to all players...");

                io.sockets.emit("updateLastPlayerStatus",[lastPlayerData,highestBet]);
                console.log("Passing Turn...");
                console.log("=====================");
                next_turn();
            }
        });
    
        socket.on('disconnect', () => {
            players.splice(players.indexOf(socket,1));
            playerSockets.splice(players.indexOf(socket,1));
            console.log('A user disconnected from the game.');
            if(players.length==0){
                player_turn = 0;
                turn_count = 0;
                gameStarted = false;
            }
        });
    }
});