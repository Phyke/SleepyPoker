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

let connectCount = -1;

let disconnectedPlayerList = [];
let hostDisconnectStatus = false;
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
            raiseTurn = players.length - 1;
            round = 0;
            allPlayerScore = [];
            gameStarted = true;

            //set blind bet for player 1 and player 2
            highestBet = minimumBet;
            setBlindBet();

            //update player status, and set highest bet as minimum bet
            io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());
            io.sockets.emit('updateHighestBet', minimumBet);

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

            console.log('notice: now raiseTurn = ', raiseTurn);

            //when all player played in this round, or there is only 1 player left
            if(raiseTurn < 0) {
                //new round
                round++;

                //there is only 1 player left
                while(activePlayer < 1 && round < 3) {
                    io.sockets.emit('addTableCard',tableCards[round + 2]);
                    round++;
                }
                
                //reached round 4, game end
                if(round == 3)
                    io.sockets.emit('gameEnded', hostDisconnectStatus);
                
                //not reached round 4, send new table card to player
                else 
                    io.sockets.emit('addTableCard',tableCards[round + 2]);
                
                //new turn counter for this round
                raiseTurn = activePlayer;
                console.log('notice: new round: ', round, ' raiseTurn: ', raiseTurn);
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
            //detect disconnected player
            let playerIndex = playerSockets.indexOf(socket);

            //game is not started, but disconnected player submitted name
            if(!gameStarted && playerIndex > -1) {

                //disconnected player is host, force players to leave and reset game
                if(players[playerIndex].number == 0) {
                    io.sockets.emit("hostDisconnected");
                    resetGame();
                }

                //disconnect player isn't host, continue to manage disconnected player
                else {
                    disconnect(1, playerIndex);
                }
            }

            //game is started, but disconnected player submitted name
            else if(gameStarted && playerIndex > -1) {
                //disconnected player is host, tell players to leave when game ended
                if(players[playerIndex].number == 0)
                    hostDisconnectStatus = true;

                //continue to manage disconnected player
                disconnect(2, playerIndex);
                raiseTurn--;

                //all player disconnected, reset game
                if(disconnectedPlayerList.length == players.length)
                    resetGame();
                
                //now is during disconnected player, call nextTurn
                else if(playerTurn == playerSockets.indexOf(socket))
                    nextTurn();
            }

            //game is not started, and disconnected player didn't submit name, continue to manage disconnected player
            else if(!gameStarted && playerIndex == -1)
                disconnect(3,playerIndex);
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
    playerSockets[playerTurn].emit('updatePlayerData', players[playerTurn]);

    //player 2 take big blind (equal to minimum bet)
    playerTurn = (playerTurn + 1) % players.length;
    console.log('notice: set big blind for player ', playerTurn);

    players[playerTurn].lastBet = minimumBet;
    playerSockets[playerTurn].emit('updatePlayerData', players[playerTurn]);
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

    //kick player who has not enought money
    for(let i = 0; i < players.length; i++) {
        if(players[i].wallet < minimumBet) {
            playerSockets[i].emit('kickEmptyWallet');
            players.splice(i, 1);
            playerSockets.splice(i, 1);
            i--;
        }
    }

    //reset player data in server and update in client
    for(let i = 0; i < players.length; i++) {
        players[i].number = i;
        players[i].lastBet = 0;
        players[i].lastAction = 'None';
        players[i].hand = [];
        players[i].status = null;
        players[i].cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        players[i].cardSuitHist = [0, 0, 0, 0, 0];
        playerSockets[i].emit('updatePlayerData', players[i]);
    }

    //reset next join player number
    connectCount = players.length - 1;

    //send updated public players' data to display on client side
    io.sockets.emit('restartGame', getAllPublicPlayersData());
}

/*
disconnect will manage disconnected player data according to mode called
which are:
    - mode 1: name submitted, game isn't started
    - mode 2: name subbmited, game is started
    - mode 3: name isn't submitted
*/
function disconnect(mode, playerIndex) {
    //mode 1, delete player data from players list
    if(mode == 1) {
        players.splice(playerIndex, 1);
        playerSockets.splice(playerIndex, 1);
        console.log('alert: A player disconnected from the game.');
    }

    //mode 2
    else if(mode == 2) {
        //force player to fold
        players[playerIndex].lastAction = "Fold";

        //push player into disconnected players list, ready to delete player data when game ended
        disconnectedPlayerList.push(playerIndex);
        console.log('alert: A player disconnected during the game.');
    }

    //mode 3, do nothing since player data isn't inserted
    else if(mode == 3)
        console.log('alert: A non-player disconnected from the game.');
    
    //update player data at client side
    io.sockets.emit('updateAllPlayerStatus', getAllPublicPlayersData());

    //player data is empty, reset game
    if(players.length == 0)
        resetGame();
}

//clearDisconnectedPlayer delete disconnected players' data from player list, ready for next round of game. then clear disconnected players list
function clearDisconnectedPlayer(){
    disconnectedPlayerList.forEach(playerIndex => {
        players.splice(playerIndex, 1);
        playerSockets.splice(playerIndex, 1);
    });
    disconnectedPlayerList = [];
}

//resetGame reset game when all player left
function resetGame(){
    gameStarted = false;
    connectCount = -1;
    players = [];
    playerSockets = [];
    disconnectedPlayerList = [];
    hostDisconnectStatus = false;
}