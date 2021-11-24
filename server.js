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

let players = [];
let playerSockets = [];
let gameStarted = false;
let allPlayerScore = [];

let highestBet = 20;
let minimumBet = 20;

let raiseTurn;
let playerTurn = 0;

let round = 0;

let forceDisconnect = false;
let connectCount = -1;

let disconnectedPlayerList = [];
//let timeOut;
//const MAX_WAITING = 5000;

class PLAYER {
    constructor (name, number) {
        this.name = name,
        this.number = number,
        this.lastAction = 'None',
        this.lastBet = 0,
        this.wallet = 1000,
        this.hand = null,
        this.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        this.cardSuitHist = [0, 0, 0, 0, 0]
    }
}

io.on('connect', (socket) => {
    console.log('notice: A user connected to the server : ', socket.id);
    console.log('notice: Total users now : ', io.engine.clientsCount);
    if(gameStarted) {
        console.log('alert: The game has already started.');
        socket.emit('cantJoin');
        socket.disconnect();
        forceDisconnect = true;
        console.log('alert: force disconnect user because join after game started');
    }
    else {
        socket.on('joinGame',(username)=>{
            if(gameStarted){
                socket.emit('cantJoin');
                socket.disconnect();
                forceDisconnect = true;
                console.log('alert: force disconnect user because not input username');
            }
            else {
                connectCount++;
                joinGameS(socket, username);
            }
        });

        socket.on('startGame', () => {
            playerTurn = 0;
            raiseTurn = players.length;
            round = 0;
            allPlayerScore = [];

            highestBet = minimumBet;
            gameStarted = true;

            setBlindBet();
            io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
            io.sockets.emit('setupStartGame', minimumBet);
            sendCardtoPlayers();
            nextTurn();
        });
    
        socket.on('passTurn',(playerData) => {
            //resetTimeOut();
            updatePlayerData(playerData);

            let activePlayer = players.filter(player => player.lastAction != 'Fold' && player.lastAction != 'All-In').length - 1;

            if(playerData.lastAction == 'Raise' || playerData.lastAction == 'All-In')
                raiseTurn = activePlayer;
            else
                raiseTurn--;

            console.log('raiseTurn = ', raiseTurn);

            while(raiseTurn < 0 && round < 3) {
                round++;
                if(round == 3) io.sockets.emit('gameEnded');
                else{
                    raiseTurn = activePlayer;
                    console.log('notice: new round: ', round, ' raiseTurn: ', raiseTurn);
                    io.sockets.emit('addTableCard',tableCards[round + 2]);
                }
            }

            if(round < 3)
                nextTurn();
            //if(raiseTurn <= 0) io.sockets.emit('gameEnded'); //special case
        });

        socket.on('requestWinner', (returnScore) => {
            allPlayerScore.push(returnScore);
            console.log('notice: score recieve from player ', returnScore[0], ' score: ', returnScore[1]);
            
            let foldPlayer = players.filter(e => e.lastAction == 'Fold').length;

            console.log('notice: foldPlayer: ', foldPlayer);
            if(allPlayerScore.length == players.length - foldPlayer)
                returnWinnerandSplitPot();
        });

        socket.on('requestRestartGame', () => {
            clearDisconnectedPlayer();
            restartGame();
        });
    
        socket.on('disconnect', () => {
            let playerIndex = playerSockets.indexOf(socket);
            if(forceDisconnect) forceDisconnect = false;
            else if(!gameStarted && playerIndex > -1) { //ใส่ชื่อแล้ว ออกก่อนเริ่มเกม
                disconnect(1,playerIndex);
            }
            else if(gameStarted && playerIndex > -1) { //ใส่ชื่อแล้ว ออกระหว่างเกม
                disconnect(2,playerIndex);
                raiseTurn--;
                if(disconnectedPlayerList.length == players.length) {
                    gameStarted = false;
                    connectCount = -1;
                    players = [];
                    playerSockets = [];
                    disconnectedPlayerList = [];
                    restartGame();
                }
                else if(playerTurn == playerSockets.indexOf(socket)) nextTurn();
            }
            else if(!gameStarted && playerIndex == -1) {
                disconnect(3,playerIndex);
            }
        });
    }
});

function nextTurn(){
    playerTurn = (playerTurn+1) % players.length;
    while(players[playerTurn].lastAction == 'Fold' || players[playerTurn].lastAction == 'All-In')
        playerTurn = (playerTurn+1) % players.length;
    
        console.log('playerTurn before emit = ', playerTurn);
        playerSockets[playerTurn].emit('requestAction');
        console.log('player turn = ' , playerTurn);
    //triggerTimeout();
}

/*function triggerTimeout(){
  timeOut = setTimeout(()=>{
    nextTurn();
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
        allPlayersData.push([players[i].number, players[i].name, players[i].lastBet, players[i].lastAction]);
    }
    return allPlayersData;
}

function joinGameS(socket,username) {
    playerSockets.push(socket);
    let newPlayer = new PLAYER(username,connectCount);
    players.push(newPlayer);
    socket.emit('takeSeat',newPlayer);
    io.sockets.emit('updateAllPlayerStatus',getAllPublicPlayersData());
}

function setBlindBet() {

    playerTurn = (playerTurn + 1) % players.length;
    console.log('notice: set small blind for player ', playerTurn);
    players[playerTurn].lastBet = minimumBet / 2;
    io.sockets.emit('blindBet', [players[playerTurn].number, minimumBet/2]);

    playerTurn = (playerTurn + 1) % players.length;
    console.log('notice: set big blind for player ', playerTurn);
    players[playerTurn].lastBet = minimumBet;
    io.sockets.emit('blindBet', [players[playerTurn].number, minimumBet]);
}

function sendCardtoPlayers() {
    dealer.buildDeck();
    tableCards = dealer.drawCard(5);
    /*
    ==========manual draw for testing==========
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
            console.log('alert: not enough cards (onStartGame)');
    });
}

function updatePlayerData(playerData) {
    players[playerTurn] = playerData;

    if(playerData.lastBet > highestBet)
        highestBet = playerData.lastBet;

    /*
    let lastPlayerData = [playerData.number, playerData.name, playerData.lastBet, playerData.lastAction];
    console.log(lastPlayerData);
    */
    console.log('notice: Update status to all players...');
    io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
    io.sockets.emit('updateHighestBet', highestBet);
    console.log('Passing Turn...');
    console.log('=====================');
}

function returnWinnerandSplitPot() {
    console.log('notice: all not fold player score received');

    let winnerData = dealer.scoreComparison(allPlayerScore);
    console.log('notice: winnerData ', winnerData);

    let pot = 0;
    players.forEach(player => {
        pot = pot + player.lastBet;
        //console.log('pot during plus = ', pot);
        player.wallet = player.wallet - player.lastBet;
    });

    console.log('notice: pot summation = ', pot);
    pot = Math.round(pot / winnerData[0].length);
    console.log('notice: pot devided = ', pot);
    winnerData[0].forEach(winner => players[winner].wallet += pot);

    playerSockets.forEach(socket => socket.emit('updateWallet', players[playerSockets.indexOf(socket)].wallet));
    io.sockets.emit('returnWinner', winnerData);
}

function restartGame() {
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

function disconnect(mode,playerIndex) {
    if(mode == 1) { //ใส่ชื่อแล้ว ออกก่อนเกมเริ่ม
        players.splice(playerIndex,1);
        playerSockets.splice(playerIndex,1);
        console.log('A user disconnected from the game.');
    }
    else if(mode == 2) { //ใส่ชื่อแล้ว ออกระหว่างเกม
        disconnectedPlayerList.push(playerIndex);
        players[playerIndex].lastAction = "Fold";
        console.log('A user disconnected from the game, during the game.');
    }
    else if(mode == 3) { //ยังไม่ใส่ชื่อแล้วกดออก
        console.log('A user disconnected from the game.');
    }
    
    io.sockets.emit('updateAllPlayerStatus',getAllPublicPlayersData());
    if(players.length==0){
        gameStarted = false;
        connectCount = -1;
    }
}

function clearDisconnectedPlayer(){
    disconnectedPlayerList.forEach(playerIndex => {
        players.splice(playerIndex,1);
        playerSockets.splice(playerIndex,1);
    });
    disconnectedPlayerList = [];
}