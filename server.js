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
let player_turn = 0;
let gameStarted = false;
let highestBet = 20;
let minimumBet = 20;
let raiseTurnCount;
let roundCount = 0;
let allPlayerScore = [];
let forceDisconnect = false;
let connectCount = -1;
//let timeOut;
//const MAX_WAITING = 5000;

class PLAYER {
    constructor (name,number) {
        this.name = name,
        this.number = number,
        this.lastAction = 'None',
        this.lastBet = 0,
        this.wallet = 500,
        this.hand = null,
        this.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        this.cardSuitHist = [0, 0, 0, 0, 0]
    }
}

io.on('connect', (socket) => {
    console.log('A user connected to the server : ',socket.id);
    console.log('Total users now : ',io.engine.clientsCount);
    if(gameStarted) {
        console.log('The game has already started.');
        socket.emit('cantJoin');
        socket.disconnect();
        forceDisconnect = 1;
        console.log("force disconnect user because join after game started");
    }
    else {
        socket.on('joinGame',(username)=>{
            if(gameStarted){
                socket.emit('cantJoin');
                socket.disconnect();
                forceDisconnect = 1;
                console.log("force disconnect user because not input username");
            }
            else {
                connectCount++;
                joinGameS(socket, username);
            }
        });
        socket.on('startGame',() => {
            player_turn = 0;
            roundCount = 0;
            highestBet = 20;
            gameStarted = true;
            raiseTurnCount = players.length;
            allPlayerScore = [];
            setBlindBetS();
            io.sockets.emit("newPlayerJoined",getAllPublicPlayersData());
            io.sockets.emit("setupStartGame",minimumBet);
            sendCardtoPlayers();
            next_turn();
        });
    
        socket.on('passTurn',(playerData) => {
            //resetTimeOut();
            updatePlayerData(playerData);

            if(playerData.lastAction == 'Raise' || playerData.lastAction == 'All-In')
                raiseTurnCount = players.filter(player => player.lastAction != 'Fold' && player.lastAction != 'All-In').length;
            else
                raiseTurnCount--;

            console.log('raiseTurnCount = ', raiseTurnCount);

            if(raiseTurnCount <= 0) {
                roundCount++;
                if(roundCount == 3) io.sockets.emit('gameEnded');
                else{
                    raiseTurnCount = players.filter(player => player.lastAction != 'Fold' && player.lastAction != 'All-In').length;
                    console.log('resetting raiseTurnCount => now raiseTurnCount = ' , raiseTurnCount);
                    console.log('roundCount = ', roundCount);
                    io.sockets.emit('addTableCard',tableCards[roundCount+2]);
                }
            }

            if(roundCount < 3)
                next_turn();
            //if(raiseTurnCount <= 0) io.sockets.emit('gameEnded'); //special case
        });

        socket.on('requestWinner', (data) => {
            allPlayerScore.push(data);
            console.log('data recieve', data[0], data[1]);
            
            let foldedPlayer = players.filter(e => e.lastAction == 'Fold').length;

            console.log(foldedPlayer);
            if(allPlayerScore.length == players.length - foldedPlayer) {
                console.log('allPlayerscore', allPlayerScore);

                let winnerData = dealer.scoreComparison(allPlayerScore);
                console.log('winnerData', winnerData);

                let pot = 0;
                players.forEach(player => {
                    pot += player.lastBet;
                    player.wallet -= player.lastBet;
                })

                winnerData[0].forEach(winner => players[winner].wallet += pot / winnerData[0].length);

                playerSockets.forEach(socket => socket.emit('updateWallet', players[playerSockets.indexOf(socket)].wallet));
                io.sockets.emit('returnWinner', winnerData);
            }
        });

        socket.on('requestRestartGame', () => {
            restartGameS();
        });
    
        socket.on('disconnect', () => {
            if(forceDisconnect) forceDisconnect = false;
            else disconnect(socket);
        });
    }
});

function next_turn(){
    player_turn = (player_turn+1) % players.length;
    while(players[player_turn].lastAction == 'Fold' || players[player_turn].lastAction == 'All-In')
        player_turn = (player_turn+1) % players.length;
    
        console.log('player_turn before emit = ', player_turn);
        playerSockets[player_turn].emit('requestAction');
        console.log('player turn = ' , player_turn);
    //triggerTimeout();
}

/*function triggerTimeout(){
  timeOut = setTimeout(()=>{
    next_turn();
  },MAX_WAITING);
}

function resetTimeOut(){
   if(typeof timeOut === 'object'){
     console.log('timeout reset');
     clearTimeout(timeOut);
   }
}*/

function getAllPublicPlayersData() {
    let allPlayersData = [];
    for(let i = 0; i < players.length; i++){
        allPlayersData.push([players[i].number,players[i].name,players[i].lastBet,players[i].lastAction]);
    }
    return allPlayersData;
}

function joinGameS(socket,username) {
    playerSockets.push(socket);
    let newPlayer = new PLAYER(username,connectCount);
    players.push(newPlayer);
    socket.emit('takeSeat',newPlayer);
    io.sockets.emit('newPlayerJoined',getAllPublicPlayersData());
}

function setBlindBetS() {
    player_turn = (player_turn+1) % players.length;
    console.log("set small blind for player ", player_turn);
    players[player_turn].lastBet = minimumBet/2;
    io.sockets.emit("blindBet",[players[player_turn].number,minimumBet/2]);
    player_turn = (player_turn+1) % players.length;
    console.log("set big blind for player ", player_turn);
    players[player_turn].lastBet = minimumBet;
    io.sockets.emit("blindBet",[players[player_turn].number,minimumBet]);
}

function sendCardtoPlayers() {
    dealer.buildDeck();
    tableCards = [];
    tableCards = dealer.drawCard(5);
    /*
    tableCards.push(dealer.pickCard(new dealer.card(1, 2, 'c_img/C1.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 3, 'c_img/C3.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 4, 'c_img/C4.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 5, 'c_img/C5.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 6, 'c_img/C6.png')));
    */
    playerSockets.forEach(socket => {
        handCards = dealer.drawCard(2);

        if(handCards != false) {
            players[playerSockets.indexOf(socket)].hand = handCards;
            socket.emit('sendCard',[tableCards.slice(0,3),handCards]);
        }
        else
            console.log('not enough cards (onStartGame)');
    });
}

function updatePlayerData(playerData) {
    players[player_turn] = playerData;

    if(playerData.lastBet > highestBet)
        highestBet = playerData.lastBet;

    let lastPlayerData = [playerData.number, playerData.name, playerData.lastBet, playerData.lastAction];
    console.log('Update status to all players...');
    console.log(lastPlayerData);
    io.sockets.emit("newPlayerJoined",getAllPublicPlayersData());
    io.sockets.emit("updateLastPlayerStatus",highestBet);
    console.log("Passing Turn...");
    console.log("=====================");
}

function restartGameS() {
    gameStarted = false;
    players.forEach(playerData => {
        playerData.lastBet = 0;
        playerData.lastAction = 'None';
        playerData.hand = [];
        playerData.status = null;
        playerData.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        playerData.cardSuitHist = [0, 0, 0, 0, 0];
    });
    io.sockets.emit('restartGame',getAllPublicPlayersData());
}

function disconnect(socket) {
    let spliceTarget = playerSockets.indexOf(socket);
    /*console.log('============Before players splice============');
    console.log('splicetarget = ', spliceTarget);
    console.log(players);
    console.log(playerSockets);*/
    players.splice(spliceTarget,1);
    /*console.log('============After players splice, Before sockets splice============');
    console.log('splicetarget = ', spliceTarget);
    console.log(players);
    console.log(playerSockets);*/
    playerSockets.splice(spliceTarget,1);
    /*console.log("============After socketss splice============");
    console.log("splicetarget = ", spliceTarget);
    console.log(players);
    console.log(playerSockets);*/
    console.log('A user disconnected from the game.');
    io.sockets.emit('newPlayerJoined',getAllPublicPlayersData());
    if(players.length==0){
        gameStarted = false;
        connectCount = -1;
    }
}