const socket = io();
const button_startGame      = document.getElementById('id_button_startGame');
const list_status           = document.getElementById('id_list_status');
const zone_action           = document.getElementById('id_zone_action');
const text_turnStatus       = document.getElementById('id_text_turnStatus');
const text_playerName       = document.getElementById('id_text_playerName');
const text_playerNo         = document.getElementById('id_text_playerNo');
const text_playerWallet     = document.getElementById('id_text_playerWallet');
const text_playerLastAction = document.getElementById('id_text_playerLastAction');
const input_raiseValue      = document.getElementById('id_input_raiseValue');
const dialog_gameRules      = document.getElementById('id_dialog_gameRules');
const text_player_score     = document.getElementById('id_text_player_score');
const text_winner_playerno  = document.getElementById('id_text_winner_playerno');
const text_winner_score     = document.getElementById('id_text_winner_score');
const dialog_inputUsername  = document.getElementById('id_dialog_inputUsername');
const input_username        = document.getElementById('id_input_username');
const button_submitUsername = document.getElementById('id_button_submitUsername');
const button_restartGame    = document.getElementById('id_button_restartGame');
const zone_table_print      = document.getElementById('id_zone_table_print');
const zone_hand_print       = document.getElementById('id_zone_hand_print');
const zone_winner           = document.getElementById('id_zone_winner');
let highestBet = 20;
let tableCard = [];
let playerCount = 0;
let playerData;

dialog_inputUsername.show();

//all socket and function calling display here
socket.on('takeSeat', (playerDatafromServer) => {takeSeat(playerDatafromServer);});
socket.on('cantJoin', () => {document.write('<h1 style="text-align:center">The game has already started.<h1>');});
socket.on('updateAllPlayerStatus', (allPublicPlayersData) => {updateAllPlayerStatus(allPublicPlayersData);});

socket.on('updatePlayerData', (playerDataTemp) => {updatePlayerData(playerDataTemp)});
socket.on('sendCard', (cardsData) => {cardRecieveandDisplay(cardsData);});

socket.on('requestAction', () => {requestAction();});
socket.on('updateHighestBet', (newHighestBet) => {updateHighestBet(newHighestBet);});
socket.on('addTableCard', (nextTableCard) => {addTableCard(nextTableCard);});

socket.on('gameEnded', (hostDisconnectStatus) => {gameEnded(hostDisconnectStatus);});
socket.on('updateWallet', (wallet) => {updateWallet(wallet);});
socket.on('returnWinner', (winnerData) => {showWinner(winnerData);});
socket.on('restartGame', (allPublicPlayersData) => {restartGame(allPublicPlayersData);});
socket.on('kickEmptyWallet', () => {document.write('<h1 style="text-align:center">You have been kicked becuase you don\'t have any money left.<br>Please refresh the page to join a new game.<h1>');});

socket.on('hostDisconnected', () => {document.write('<h1 style="text-align:center">Host disconnected<br>Please refresh the page to join a new game.<h1>');});

//submitUsername send name submitted by player to server
function submitUsername() {
    //player must input name
    if(input_username.value == '') {
        alert('Your username cannot be empty.');
    }

    //player submit name, hide name form and send name to server
    else {
        dialog_inputUsername.style.visibility = 'hidden';
        socket.emit('joinGame',input_username.value);
    }
}

//takeSeat retrive player data sent from server and update local player data, then display player on left side of screen
function takeSeat(playerDatafromServer) {
    //update player data
    playerData = playerDatafromServer;
    
    //display player data on left side of screen
    text_playerName.innerHTML = playerData.name;
    text_playerNo.innerHTML = playerData.number + 1;        // +1 for readability
    text_playerWallet.innerHTML = playerData.wallet;

    //player is the host of the game, display 'start game' button
    if(playerData.number == 0)
        button_startGame.style.visibility = 'visible';
}

//startGame is activated when player 0 click 'start game' button, send signal to server to start game
function startGame() {
    //player number is accepted, must be between 2 - 6 players
    if(playerCount >= 2 && playerCount <= 6) {
        //send signal to server
        socket.emit('startGame');
        
        //hide start game button
        button_startGame.style.visibility = 'hidden';
    }

    //player number is unaccepted, alert player
    else{
        alert('Player count must be between 2 - 6 players');
    }
}

//cardRecieveandDisplay recieve table cards and hands card from server
function cardRecieveandDisplay(cardsData) {
    //update table card and player's hand
    tableCard = cardsData[0];
    playerData.hand = cardsData[1];

    //cards on table and player hand will be used to calculate score, update cards histograms
    let cardsToCount = cardsData[0].concat(cardsData[1])
    console.log(cardsToCount);
    updateCardHist(cardsToCount);

    //display table card and player's hand card on their zone
    printCardArray(tableCard, zone_table_print);
    printCardArray(playerData.hand, zone_hand_print);

    //display current score
    text_player_score.innerHTML = scoreToText(scoreCheck());
    zone_winner.style.visibility = 'visible';
}

//addTableCard uodate table card at the beginning of each round
function addTableCard(nextTableCard) {
    //push new card to table cards list
    tableCard.push(nextTableCard);
    console.log('notice: client recieve new table card: ', nextTableCard);

    //print new table card in table zone
    printCard(nextTableCard,zone_table_print, 100);

    //update cards histograms
    updateCardHist([nextTableCard]);

    //display current score
    text_player_score.innerHTML = scoreToText(scoreCheck());
}

//updateCardHist will update player's cards histograms from new card sent to player (maybe cards on hand or on table)
function updateCardHist(data) {
    //update both histogram by every new cards
    for(let i = 0; i < data.length; i++) {
        playerData.cardValueHist[data[i].cardValue] = playerData.cardValueHist[data[i].cardValue] + 1;
        playerData.cardSuitHist[data[i].cardSuit] = playerData.cardSuitHist[data[i].cardSuit] + 1;
    }
    console.log('notice: updated card suit histogram: ', playerData.cardSuitHist);
    console.log('notice: updated card value histogram: ', playerData.cardValueHist);
}

//updatePlayerData is used to update player's data on client side
function updatePlayerData(playerDataTemp) {
    playerData = playerDataTemp;
    text_playerNo.innerHTML = playerData.number + 1;
}

//updateHighestBet will be called at begin of every turn to update highest bet made by players, and will send player to waiting state
function updateHighestBet(newHighestBet) {
    //update highest bet
    highestBet = newHighestBet;

    //send player to eaiting state
    text_turnStatus.innerHTML = "Waiting for other players";
    text_turnStatus.style.backgroundColor = "firebrick";
}

//requestAction will display action button to player
function requestAction() {
    //update player screen to notice player it's their turn
    text_turnStatus.innerHTML = 'Now is your turn!!!';
    text_turnStatus.style.backgroundColor = 'forestgreen';

    //show action button
    zone_action.style.visibility = 'visible';
}

//updateAllPlayerStatus will update all public player data in right side table
function updateAllPlayerStatus(allPublicPlayerData) {
    //update player count in case of new player join game
    playerCount = allPublicPlayerData.length;
    console.log('notice: player now in game: ', playerCount);

    //delete all player data rows
    while(list_status.rows.length > 2)
        list_status.deleteRow(2);
    
    //insert all updated players' data into table
    allPublicPlayerData.forEach(playerData => {
        let new_tableRow = list_status.insertRow(list_status.length);
        let new_tableData1 = new_tableRow.insertCell(0);
        let new_tableData2 = new_tableRow.insertCell(1);
        let new_tableData3 = new_tableRow.insertCell(2);
        let new_tableData4 = new_tableRow.insertCell(3);
        new_tableData1.innerHTML = playerData[0] + 1; // +1 for readability
        new_tableData2.innerHTML = playerData[1];
        new_tableData3.innerHTML = playerData[2];
        new_tableData4.innerHTML = playerData[3];
    });
}

//scoreCheck calculate player's score from both histograms and compare them, then return the higher score
function scoreCheck() {
    //retrive score calculated from cardValueHistScoring and cardSuitHistScoring
    let scoreValue, scoreSuit;
    scoreValue = cardValueHistScoring(playerData.cardValueHist, tableCard.concat(playerData.hand));
    scoreSuit = cardSuitHistScoring(playerData.cardSuitHist, tableCard.concat(playerData.hand));

    console.log('score from value ', scoreValue, ' score from suit ', scoreSuit);

    //return higher score
    if(scoreValue[0] >= scoreSuit[0])
        return scoreValue;
    return scoreSuit;
}

//gameEnded will tell all player that game is ended, calculate player score and send them to server to find winner (if player not folded)
function gameEnded(hostDisconnectStatus) {
    //host left, game ended. tell player to leave
    if(hostDisconnectStatus == true)
        text_turnStatus.innerHTML = 'The game is ended. (Host has left, everyone should leave the game)';
    
    //tell player that the game is ended
    else
        text_turnStatus.innerHTML = 'The game is ended.';
    
    zone_action.style.visibility = 'hidden';

    //calculate player's score
    let playerScore = scoreCheck();

    //player not folded, send player score to server
    if(playerData.lastAction.localeCompare('Fold'))
        socket.emit('requestWinner', [playerData.number, playerScore]);

    //convert playerScore to text and display at the bottom-left side of screen
    text_player_score.innerHTML = scoreToText(playerScore);

    //player is host, display restart game button
    if(playerData.number == 0)
        button_restartGame.style.visibility = 'visible';
}

//updateWallet update player's wallet, and display new wallet worth
function updateWallet(wallet) {
    playerData.wallet = wallet;
    text_playerWallet.innerHTML = wallet;
}

//showWinner retrieve winnerData from server then display winner data and score at bottom-left side of screen
function showWinner(winnerData) {
    //retrieve winnerNumber and winnerScore drom winnerData
    let winnerNumber = winnerData[0], winnerScore = winnerData[1];
    
    //convert winnerNumber array to text
    let winnerNumberText = '';
    winnerNumber.forEach(number =>
        winnerNumberText = winnerNumberText.concat((number + 1).toString() + ', ')
    );
    winnerNumberText = winnerNumberText.slice(0, winnerNumberText.length - 2);

    //display winner data and score
    text_winner_playerno.innerHTML = winnerNumberText;
    text_winner_score.innerHTML = scoreToText(winnerScore);
}

//requestRestartGame activate when 'restart game' button is clicked, send signal to server
function requestRestartGame() {
    socket.emit('requestRestartGame');
}

//restartGame activate when server tell all client to restart game
function restartGame(allPublicPlayersData) {
    //reset screen
    zone_table_print.innerHTML = '';
    zone_hand_print.innerHTML = '';
    text_player_score.innerHTML = '';
    text_winner_playerno.innerHTML = '';
    text_winner_score.innerHTML = '';
    text_playerLastAction.innerHTML = 'None';
    text_turnStatus.innerHTML = 'Welcome';
    text_turnStatus.style.backgroundColor = 'black';
    input_raiseValue.value = '0';
    zone_winner.style.visibility = 'hidden';
    button_restartGame.style.visibility = 'hidden';
    updateAllPlayerStatus(allPublicPlayersData);
    if(playerData.number == 0)
        button_startGame.style.visibility = 'visible';

    //reset game data
    tableCard = [];
    highestBet = 20;

    //update player data
    playerData.lastBet = 0;
    playerData.lastAction = 'None';
    playerData.hand = [];
    playerData.status = null;
    playerData.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    playerData.cardSuitHist = [0, 0, 0, 0, 0];
}

//fold action
function fold() {
    playerData.lastAction = 'Fold';
    socket.emit('passTurn', playerData);
    text_playerLastAction.innerHTML = 'Fold';
    zone_action.style.visibility = 'hidden';
}

//check action
function check() {
    //someone raise, player must call or raise higher
    if(playerData.lastBet < highestBet) {
        alert('You cannot check, you need to call or raise');
    }

    else {
        playerData.lastAction = 'Check';
        socket.emit('passTurn', playerData);
        text_playerLastAction.innerHTML = 'Check';
        zone_action.style.visibility = 'hidden';
    }
}

//call action
function call() {
    //player's money is less than highest bet, must all-in
    if(playerData.wallet < highestBet) {
        alert('You do not have enough money.');
    }

    //player's money is equal to highest bet, auto all-in
    else if(playerData.wallet == highestBet)
        allIn();
    
    //player already called, cannot call
    else if(playerData.lastBet == highestBet) {
        alert('You need to check (not call).');
    }

    //player call
    else {
        playerData.lastAction = 'Call';
        playerData.lastBet = highestBet;
        socket.emit('passTurn', playerData);
        text_playerLastAction.innerHTML = 'Call';
        zone_action.style.visibility = 'hidden';
    }
}

//raise action
function raise() {
    //get raise value from html input
    let raiseValue = parseInt(input_raiseValue.value);
    console.log('notice: Comparing raiseValue = ' + raiseValue + 'vs highestBet = ' + highestBet);

    //player cannot raise less than highest bet
    if(raiseValue <= highestBet)
        alert('You must raise more than current highest bet');
    
    //player cannot raise higher than player's money
    else if(raiseValue > playerData.wallet)
        alert('You do not have enough money.');

    //player raise equal to player's money, auto all-in
    else if(playerData.wallet == raiseValue)
        allIn();
    
    //player raise
    else {
        playerData.lastAction = 'Raise';
        playerData.lastBet = raiseValue;
        socket.emit('passTurn', playerData);
        text_playerLastAction.innerHTML = 'Raise';
        zone_action.style.visibility = 'hidden';
    }
}

//all-in action
function allIn() {
    playerData.lastAction = 'All-In';
    playerData.lastBet = playerData.wallet;
    socket.emit('passTurn', playerData);
    text_playerLastAction.innerHTML = 'All-In';
    zone_action.style.visibility = 'hidden';
}

//three function to activate html element
function showGameRules() {
    dialog_gameRules.show();
}

function closeGameRules() {
    dialog_gameRules.close();
}

input_username.addEventListener("keydown", (event) => {
    if(event.key == "Enter") {
        event.preventDefault();
        button_submitUsername.click();
    }
});