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

//when player connect into website
io.on('connect', (socket) => {
    console.log('notice: A user connected to the server : ', socket.id);
    console.log('notice: Total users now : ', io.engine.clientsCount);

    //game already started, disconnect player
    if(gameStarted) {
        //tell user that game is already started
        console.log('alert: The game has already started.');
        socket.emit('cantJoin');

        //disconnect player from socket
        socket.disconnect();
        forceDisconnect = true;
        console.log('alert: force disconnect user because join after game started');
    }

    //game is not started
    else {

        //player submit name
        socket.on('joinGame',(username)=>{

            //game already started before player submit name
            if(gameStarted){
                //tell user that game is already started
                socket.emit('cantJoin');

                //disconnect player from socket
                socket.disconnect();
                forceDisconnect = true;
                console.log('alert: force disconnect user because not input username');
            }

            //game isn't started, push player into player list
            else {
                connectCount++;
                joinGame(socket, username);
            }
        });

        //player 0 click start game
        socket.on('startGame', () => {
            //reset game parameter
            playerTurn = 0;
            raiseTurn = players.length;
            round = 0;
            allPlayerScore = [];
            gameStarted = true;

            //set blind bet for player 1 and player 2
            highestBet = minimumBet;
            setBlindBet();

            //update player status, and start game on client side
            io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
            io.sockets.emit('setupStartGame', minimumBet);

            //draw table cards and hands card, then send cards to display on client side
            sendCardtoPlayers();

            //first turn started
            nextTurn();
        });

        //player finish turn
        socket.on('passTurn',(playerData) => {
            //update player data from last player action
            updatePlayerData(playerData);

            //find number of players that still have to take turn (folded and all-in players' turns will be skipped)
            let activePlayer = players.filter(player => player.lastAction != 'Fold' && player.lastAction != 'All-In').length - 1;

            //player raise or All-in, update new turn count in this round, or else raiseTurn decrease
            if(playerData.lastAction == 'Raise' || playerData.lastAction == 'All-In')
                raiseTurn = activePlayer;
            else
                raiseTurn--;

            console.log('raiseTurn = ', raiseTurn);

            //when all player played in this round
            while(raiseTurn < 0 && round < 3) {
                //round counter increase
                round++;

                //reached round 4, game end
                if(round == 3) io.sockets.emit('gameEnded');

                //start new round
                else{
                    //turn count = number of active player
                    raiseTurn = activePlayer;
                    console.log('notice: new round: ', round, ' raiseTurn: ', raiseTurn);

                    //add new table card for new round
                    io.sockets.emit('addTableCard',tableCards[round + 2]);
                }
            }

            //game is not ended, go to next turn
            if(round < 3)
                nextTurn();
        });

        //when game ended, client will request winner from server with their own score
        socket.on('requestWinner', (returnScore) => {
            //push new player score in to all player score list
            allPlayerScore.push(returnScore);
            console.log('notice: score recieve from player ', returnScore[0], ' score: ', returnScore[1]);
            
            //folded players' score will not be included
            let foldPlayer = players.filter(e => e.lastAction == 'Fold').length;
            console.log('notice: foldPlayer: ', foldPlayer);

            //recieve all non-folded players' score, return winner score to display at client and update bet money
            if(allPlayerScore.length == players.length - foldPlayer)
                returnWinnerandSplitPot();
        });

        //player 0 click restart game, clear disconnected players' data and restart game
        socket.on('requestRestartGame', () => {
            clearDisconnectedPlayer();
            restartGame();
        });

        //player disconnect, need special method to continue game
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

/*
getAllPublicPlayersData retrieve players' data that will be display at every players' screens.
Include:
    - number:       player's number in game
    - name:         player's submitted name
    - lastBet:      player's last placed bet
    - lastAction:   player's last action took in their latest turn, could be fold, call, check, raise, or all-in
*/
function getAllPublicPlayersData() {
    let allPlayersData = [];
    for(let i = 0; i < players.length; i++){
        allPlayersData.push([players[i].number, players[i].name, players[i].lastBet, players[i].lastAction]);
    }
    return allPlayersData;
}

//nextTurn calculate playerTurn to find next player who have to take turn and call them
function nextTurn(){

    //increase playerTurn, if last player took turn, continue to first player
    playerTurn = (playerTurn+1) % players.length;

    //skipping folded and all-in player
    while(players[playerTurn].lastAction == 'Fold' || players[playerTurn].lastAction == 'All-In')
        playerTurn = (playerTurn+1) % players.length;
    
    //call player to take turn by request their action
    console.log('notice: playerTurn to be emit = ', playerTurn);
    playerSockets[playerTurn].emit('requestAction');
}

//unused function
/*
function triggerTimeout(){
  timeOut = setTimeout(()=>{
    nextTurn();
  },MAX_WAITING);
}

function resetTimeOut(){
   if(typeof timeOut === 'object'){
     console.log('timeout reset');
     clearTimeout(timeOut);
   }
}
*/


//joinGame retrive player submitted name and create new player then push to player list
function joinGame(socket, username) {
    //push player's data and socket to player list
    let newPlayer = new PLAYER(username, connectCount);
    players.push(newPlayer);
    playerSockets.push(socket);

    //return created player data to display on client side, then update new player data to every players in the game
    socket.emit('takeSeat', newPlayer);
    io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
}

//setBlindBet set blind bets for player 1 and player 2 at starting of the game
function setBlindBet() {

    //player 1 take small blind (half of minimum bet)
    playerTurn = (playerTurn + 1) % players.length;
    console.log('notice: set small blind for player ', playerTurn);

    players[playerTurn].lastBet = minimumBet / 2;
    io.sockets.emit('blindBet', [players[playerTurn].number, minimumBet / 2]);

    //player 2 take big blind (equal to minimum bet)
    playerTurn = (playerTurn + 1) % players.length;
    console.log('notice: set big blind for player ', playerTurn);

    players[playerTurn].lastBet = minimumBet;
    io.sockets.emit('blindBet', [players[playerTurn].number, minimumBet]);
}

//sendCardtoPlayers draw cards for table and players' hands at the start of the game
function sendCardtoPlayers() {
    //build deck in card.js
    dealer.buildDeck();

    //deal 5 cards to table
    tableCards = dealer.drawCard(5);

    /*
    ==========manual draw for testing==========
    tableCards.push(dealer.pickCard(new dealer.card(1, 2, 'c_img/C1.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 3, 'c_img/C3.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 4, 'c_img/C4.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 5, 'c_img/C5.png')));
    tableCards.push(dealer.pickCard(new dealer.card(1, 6, 'c_img/C6.png')));
    */

    //draw card to each player
    playerSockets.forEach(socket => {
        //draw 2 cards
        handCards = dealer.drawCard(2);

        //draw successfully, send player's cards and first 3 table cards to display at client side
        if(handCards != false) {
            players[playerSockets.indexOf(socket)].hand = handCards;
            socket.emit('sendCard', [tableCards.slice(0, 3), handCards]);
        }

        //draw failed, cannot start game
        else
            console.log('alert: not enough cards (onStartGame)');
    });
}

//updatePlayerData update single player's data in server, update new highest bet if needed, then update player data to all players
function updatePlayerData(playerData) {

    //update player data
    players[playerTurn] = playerData;

    //update highest bet
    if(playerData.lastBet > highestBet)
        highestBet = playerData.lastBet;
    
    //update public player data and highest bet to all players
    console.log('notice: Update status to all players...');
    io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
    io.sockets.emit('updateHighestBet', highestBet);
}

/*
returnWinnerandSplitPot activate when all players' scores were sent to server
this function includes:
    - find winner from allPlayerScore
    - take bet money from player to pot
    - split pot to winners (if needed)
    - update all player wallet
    - return winner data to display on client side
*/
function returnWinnerandSplitPot() {
    console.log('notice: all not fold player score received');

    //find winner from allPlayerScore
    let winnerData = dealer.scoreComparison(allPlayerScore);
    console.log('notice: winnerData ', winnerData);

    //take money from players' bets to pot
    let pot = 0;
    players.forEach(player => {
        pot = pot + player.lastBet;
        player.wallet = player.wallet - player.lastBet;
    });
    console.log('notice: pot summation = ', pot);
    
    //split pot in case of multiple winners, and add money to winners' wallet
    pot = Math.round(pot / winnerData[0].length);
    console.log('notice: pot divided = ', pot);
    winnerData[0].forEach(winner => players[winner].wallet += pot);

    //update player wallet, and send winners' data to display on client side
    playerSockets.forEach(socket =>
        socket.emit('updateWallet', players[playerSockets.indexOf(socket)].wallet)
    );
    io.sockets.emit('returnWinner', winnerData);
}

//restartGame reset player data for next round of game
function restartGame() {
    //game ended
    gameStarted = false;

    //reset player data in server
    players.forEach(playerData => {
        playerData.lastBet = 0;
        playerData.lastAction = 'None';
        playerData.hand = [];
        playerData.status = null;
        playerData.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        playerData.cardSuitHist = [0, 0, 0, 0, 0];
    });

    //send updated public players' data to display on client side
    io.sockets.emit('restartGame', getAllPublicPlayersData());
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