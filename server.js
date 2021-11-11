//dependencies
const { table } = require('console');
const express = require('express');
const http = require('http');
const { connect } = require('http2');
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
let player_turn = 0;
let gameStarted = false;
let highestBet = 20;
let minimumBet = 20;
let raiseTurnCount;
let roundCount = 0;
let allPlayerScore = [];
//let timeOut;
//const MAX_WAITING = 5000;

class PLAYER {
    constructor (name,number) {
        this.name = name,
        this.number = number,
        this.lastAction = "None",
        this.lastBet = 0,
        this.status = null,
        this.wallet = 100,
        this.hand = null,
        this.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        this.cardSymbolHist = [0, 0, 0, 0, 0]
    }
}

io.on('connect', (socket) => {
    console.log("A user connected to the server : ",socket.id);
    console.log("Total users now : ",io.engine.clientsCount);
    if(gameStarted) {
        console.log("The game has already started.");
        socket.emit("cantJoin");
        socket.on('disconnect', () => {console.log('A user disconnected after cant join, due to game already started');});
    }
    else {
        socket.on("joinGame",(username)=>{joinGameS(socket,username);});
        socket.on('startGame',() => {
            gameStarted = true;
            raiseTurnCount = players.length;
            setBlindBetS();
            sendCardtoPlayers();
            next_turn();
        });
    
        socket.on('passTurn',(playerData) => {
            //resetTimeOut();
            updatePlayerData(socket, playerData);

            if(playerData.lastAction == "Raise")
                raiseTurnCount = players.length - 1;
            else raiseTurnCount--;

            console.log("raiseTurnCount = ", raiseTurnCount);

            if(raiseTurnCount <= 0) {
                roundCount++;
                if(roundCount == 3) io.sockets.emit("gameEnded");
                else{
                    raiseTurnCount = players.length;
                    console.log("reseting raisecount now raiseTurnCount = " , raiseTurnCount);
                    console.log("roundCount = ", roundCount);
                    io.sockets.emit("addTableCard",tableCards[roundCount+2]);
                }
            }

            if(roundCount < 3)
                next_turn();
            //if(raiseTurnCount <= 0) io.sockets.emit("gameEnded"); //special case
        });

        socket.on('requestWinner', (data) => {
            allPlayerScore.push(data);
            console.log('data recieve', data[0].number, data[1]);
            if(allPlayerScore.length == players.length) {
                console.log('allPlayerscore', allPlayerScore);
                let winnerData = dealer.scoreComparison(allPlayerScore);
                console.log('winnerData', winnerData);
                playerSockets.forEach(socket => {
                    socket.emit('returnWinner', winnerData);
                });
            }
        });
    
        socket.on('disconnect', () => {disconnect(socket);});
    }
});

function next_turn(){
    player_turn = (player_turn+1) % players.length;
    while(players[player_turn].folded == true) {
        turn_count++;
        raiseTurnCount--;
        player_turn = (player_turn+1) % players.length;
    }

    if(raiseTurnCount <= 0) io.sockets.emit("gameEnded");
    
    else {
        playerSockets[player_turn].emit('requestAction');
        console.log("turn count = " , turn_count);
        console.log("player turn = " , player_turn);
        turn_count++;
    }
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

function joinGameS(socket,username) {
    playerSockets.push(socket);
    let newPlayer = new PLAYER(username,players.length);
    players.push(newPlayer);
    socket.emit('takeSeat',newPlayer);
}

function setBlindBetS() {
    player_turn = (player_turn+1) % players.length;
    players[player_turn].lastBet = minimumBet/2;
    playerSockets[player_turn].emit("blindBet",minimumBet/2);
    player_turn = (player_turn+1) % players.length;
    players[player_turn].lastBet = minimumBet;
    playerSockets[player_turn].emit("blindBet",minimumBet);
    io.sockets.emit("setupStartGame",[getAllPlayersData(),minimumBet]);
}

function sendCardtoPlayers() {
    dealer.buildDeck();
    tableCards = [];
    tableCards = dealer.drawCard(5);
    /*
    tableCards.push(dealer.pickCard(new dealer.card(1, 2, "c_img/C1.png")));
    tableCards.push(dealer.pickCard(new dealer.card(1, 3, "c_img/C3.png")));
    tableCards.push(dealer.pickCard(new dealer.card(1, 4, "c_img/C4.png")));
    tableCards.push(dealer.pickCard(new dealer.card(1, 5, "c_img/C5.png")));
    tableCards.push(dealer.pickCard(new dealer.card(1, 6, "c_img/C6.png")));
    */
    playerSockets.forEach(socket => {
        handCards = dealer.drawCard(2);

        if(handCards != false) {
            players[playerSockets.indexOf(socket)].hand = handCards;
            socket.emit("gameStarted",[tableCards.slice(0,3),handCards]);
        }
        else
            console.log("not enough cards (onStartGame)");
    });
}

function updatePlayerData(socket,playerData) {
    if(socket.id == playerSockets[player_turn].id) {
        players[player_turn] = playerData;

        if(playerData.lastBet > highestBet)
            highestBet = playerData.lastBet;

        let lastPlayerData = [playerData.number,playerData.lastAction,playerData.lastBet];
        console.log("Update status to all players...");

        io.sockets.emit("updateLastPlayerStatus",[lastPlayerData,highestBet]);
        console.log("Passing Turn...");
        console.log("=====================");
    }
}

function disconnect(socket) {
    players.splice(players.indexOf(socket,1));
    playerSockets.splice(players.indexOf(socket,1));
    console.log('A user disconnected from the game.');
    if(players.length==0){
        player_turn = 0;
        turn_count = 0;
        roundCount = 0;
        highestBet = 20;
        raiseTurnCount = null;
        gameStarted = false;
    }
}