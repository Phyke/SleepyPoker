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

//joinGame();
dialog_inputUsername.show();
socket.on('takeSeat', (playerData) => {onTakeSeat(playerData);});
socket.on('cantJoin', () => {document.write('The game has already started.');});
socket.on('newPlayerJoined', (allPublicPlayersData) => {newPlayerJoined(allPublicPlayersData);});

socket.on('setupStartGame', (startGameData) => {setupStartGame(startGameData);});
socket.on('blindBet', (betValue) => {setBlindBet(betValue)});
socket.on('sendCard', (cardsData) => {cardRecieveAndDisplay(cardsData);});

socket.on('requestAction', () => {requestAction();});
socket.on('updateHighestBet', (lastPlayerData_highestBet) => {updateHighestBet(lastPlayerData_highestBet);});
socket.on('addTableCard', (nextTableCard) => {addTableCard(nextTableCard);});

socket.on('gameEnded', () => {gameEnded();});
socket.on('updateWallet', (wallet) => updateWallet(wallet));
socket.on('returnWinner', (winnerData) => {showWinner(winnerData);});
socket.on('restartGame', (allPublicPlayersData) => {restartGameC(allPublicPlayersData);});

function submitUsername() {
    if(input_username.value == '') {
        alert('Your username cannot be empty.');
    }
    else {
        dialog_inputUsername.style.visibility = 'hidden';
        socket.emit('joinGame',input_username.value);
    }
}

function joinGame() {
    const name = prompt('Please enter your name.');
    socket.emit('joinGame',name);
}

function onTakeSeat(data) {
    playerData = data;
    console.log(data.cardValueHist);
    text_playerName.innerHTML = playerData.name;
    text_playerNo.innerHTML = playerData.number + 1; // +1 เพื่อ readability
    text_playerWallet.innerHTML = playerData.wallet;
    if(playerData.number == 0) button_startGame.style.visibility = 'visible';
}

function startGame() {
    if(playerCount >= 2 && playerCount <= 6) {
        socket.emit('startGame');
        button_startGame.style.visibility = 'hidden';
    }
    else{
        alert('Player count must be between 2 - 6 players');
    }
}

function cardRecieveAndDisplay(data) {
    tableCard = data[0];
    playerData.hand = data[1];
    console.log(data[0].concat(data[1]));
    updateCardHist(data[0].concat(data[1]));
    printCardArray(data[0],zone_table_print,100);
    printCardArray(data[1],zone_hand_print,100);
}

function addTableCard(data) {
    tableCard.push(data);
    printCard(data,zone_table_print,100);
    console.log(data);
    updateCardHist([data]);
}

function updateCardHist(data) {
    for(let i = 0; i < data.length; i++) {
        playerData.cardValueHist[data[i].cardValue]++;
        playerData.cardSuitHist[data[i].cardSuit]++;
    }
    console.log(playerData.cardSuitHist, playerData.cardValueHist);
}

function scoreCheck() {
    let scoreValue, scoreSuit;
    scoreValue = cardValueHistDetect(playerData.cardValueHist, tableCard.concat(playerData.hand));
    scoreSuit = cardSuitHistDetect(playerData.cardSuitHist, tableCard.concat(playerData.hand));
    console.log('score from value ', scoreValue, ' score from suit ', scoreSuit);
    if(scoreValue[0] >= scoreSuit[0])
        return scoreValue;
    return scoreSuit;
}

function setBlindBet(data) {
    console.log(data);
    if(data[0] == playerData.number) playerData.lastBet = data[1];
    //list_status.rows[data[0]+2].cells[2].innerHTML = data[1];
}
function requestAction() {
    text_turnStatus.innerHTML = 'Now is your turn!!!';
    text_turnStatus.style.backgroundColor = 'forestgreen';
    zone_action.style.visibility = 'visible';
}

function newPlayerJoined(allPublicPlayerData) {
    playerCount = allPublicPlayerData.length;
    console.log('new player joined');
    while(list_status.rows.length > 2) list_status.deleteRow(2);
    allPublicPlayerData.forEach(playerData => {
        let new_tableRow = list_status.insertRow(list_status.length);
        let new_tableData1 = new_tableRow.insertCell(0);
        let new_tableData2 = new_tableRow.insertCell(1);
        let new_tableData3 = new_tableRow.insertCell(2);
        let new_tableData4 = new_tableRow.insertCell(3);
        new_tableData1.innerHTML = playerData[0]+1; // plus one for user understanding
        new_tableData2.innerHTML = playerData[1];
        new_tableData3.innerHTML = playerData[2];
        new_tableData4.innerHTML = playerData[3];
    });
}

function setupStartGame(data) {
    highestBet = data;
    text_turnStatus.innerHTML = 'Waiting for other players';
    text_turnStatus.style.backgroundColor = 'firebrick';
}

function updateHighestBet(newHighestBet) {
    //console.log(data);
    /*
    list_status.deleteRow(data[0][0]+2);
    let new_tableRow = list_status.insertRow(data[0][0]+2);
    let new_tableData1 = new_tableRow.insertCell(0);
    let new_tableData2 = new_tableRow.insertCell(1);
    let new_tableData3 = new_tableRow.insertCell(2);
    let new_tableData4 = new_tableRow.insertCell(3);
    new_tableData1.innerHTML = data[0][0]+1; // plus one for user understanding
    new_tableData2.innerHTML = data[0][1];
    new_tableData3.innerHTML = data[0][2];
    new_tableData4.innerHTML = data[0][3];
    */
    highestBet = newHighestBet;
    text_turnStatus.innerHTML = "Waiting for other players";
    text_turnStatus.style.backgroundColor = "firebrick";
}

function gameEnded() {
    text_turnStatus.innerHTML = 'The game is ended.';
    zone_action.style.visibility = 'hidden';
    let playerScore = scoreCheck();
    if(playerData.lastAction.localeCompare('Fold'))
    socket.emit('requestWinner', [playerData.number, playerScore]);
    text_player_score.innerHTML = scoreToText(playerScore);
    if(playerData.number == 0) button_restartGame.style.visibility = 'visible';
}

function updateWallet(wallet) {
    playerData.wallet = wallet;
    text_playerWallet.innerHTML = wallet;
}

function showWinner(winnerData) {
    let winnerNumber = winnerData[0], winnerScore = winnerData[1];
    let winnerNumberText = '';
    winnerNumber.forEach(number => winnerNumberText = winnerNumberText.concat((number + 1).toString() + ', '));
    winnerNumberText = winnerNumberText.slice(0, winnerNumberText.length - 2);
    text_winner_playerno.innerHTML = winnerNumberText;
    text_winner_score.innerHTML = scoreToText(winnerScore);
    zone_winner.style.visibility = 'visible';
}

function requestRestartGame() {
    socket.emit('requestRestartGame');
}

function restartGameC(allPublicPlayersData) {
    zone_table_print.innerHTML = '';
    zone_hand_print.innerHTML = '';
    text_player_score.innerHTML = '';
    text_winner_playerno.innerHTML = '';
    text_winner_score.innerHTML = '';
    text_playerLastAction.innerHTML = 'None';
    text_turnStatus.innerHTML = 'Welcome';
    text_turnStatus.style.backgroundColor = 'black';
    input_raiseValue.value = '0';
    tableCard = [];
    highestBet = 20;
    console.log(allPublicPlayersData);
    playerData.lastBet = 0;
    playerData.lastAction = 'None';
    playerData.hand = [];
    playerData.status = null;
    playerData.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    playerData.cardSuitHist = [0, 0, 0, 0, 0];
    newPlayerJoined(allPublicPlayersData);
    button_restartGame.style.visibility = 'hidden';
    zone_winner.style.visibility = 'hidden';
    if(playerData.number == 0) button_startGame.style.visibility = 'visible';
}

function fold() {
    playerData.lastAction = 'Fold';
    socket.emit('passTurn', playerData);
    text_playerLastAction.innerHTML = 'Fold';
    zone_action.style.visibility = 'hidden';
}

function check() {
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

function call() {
    if(playerData.wallet < highestBet) {
        alert('You do not have enough money.');
    }
    else if(playerData.lastBet == highestBet) {
        alert('You need to check (not call).');
    }
    else if(playerData.wallet == highestBet)
        allIn();
    else {
        playerData.lastAction = 'Call';
        playerData.lastBet = highestBet;
        socket.emit('passTurn', playerData);
        text_playerLastAction.innerHTML = 'Call';
        zone_action.style.visibility = 'hidden';
    }
}

function raise() {
    let raiseValue = parseInt(input_raiseValue.value);
    console.log('Comparing raiseValue = ' + raiseValue + 'vs highestBet = ' + highestBet);
    if(raiseValue <= highestBet) {
        alert('You must raise more than current highest bet');
    } 
    else if(raiseValue > playerData.wallet) {
        alert('You do not have enough money.');
    }
    else if(playerData.wallet == raiseValue)
        allIn();
    else {
        playerData.lastAction = 'Raise';
        playerData.lastBet = raiseValue;
        socket.emit('passTurn', playerData);
        text_playerLastAction.innerHTML = 'Raise';
        zone_action.style.visibility = 'hidden';
    }
    raiseValue = 0;
    console.log(typeof(raiseValue));
}

function allIn() {
    playerData.lastAction = 'All-In';
    playerData.lastBet = playerData.wallet;
    socket.emit('passTurn', playerData);
    text_playerLastAction.innerHTML = 'All-In';
    zone_action.style.visibility = 'hidden';
}

function showGameRules() {
    dialog_gameRules.show();
}

function closeGameRules() {
    dialog_gameRules.close();
}
