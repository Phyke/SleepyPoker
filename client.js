const socket = io();
const button_startGame      = document.getElementById("id_button_startGame");
const list_status           = document.getElementById("id_list_status");
const zone_action           = document.getElementById("id_zone_action");
const text_turnStatus       = document.getElementById("id_text_turnStatus");
const text_playerName       = document.getElementById("id_text_playerName");
const text_playerNo         = document.getElementById("id_text_playerNo");
const text_playerWallet     = document.getElementById("id_text_playerWallet");
const text_playerLastAction = document.getElementById("id_text_playerLastAction");
const input_raiseValue      = document.getElementById("id_input_raiseValue");
const dialog_gameRules      = document.getElementById("id_dialog_gameRules");
const text_player_score     = document.getElementById("id_text_player_score");
const text_winner_playerno  = document.getElementById("id_text_winner_playerno");
const text_winner_score     = document.getElementById("id_text_winner_score");
const dialog_inputUsername  = document.getElementById("id_dialog_inputUsername");
const input_username        = document.getElementById("id_input_username");
const button_submitUsername = document.getElementById("id_button_submitUsername");
const button_restartGame    = document.getElementById("id_button_restartGame");
const zone_table_print      = document.getElementById("id_zone_table_print");
const zone_hand_print       = document.getElementById("id_zone_hand_print");
const zone_winner           = document.getElementById("id_zone_winner");
let highestBet = 20;
let tableCard = [];
let playerCount = 0;

//joinGame();
dialog_inputUsername.show();
socket.on("cantJoin", () => {document.write("The game has already started.");});
socket.on("takeSeat", (playerData) => {onTakeSeat(playerData);});
socket.on("sendCard", (cardsData) => {cardRecieveAndDisplay(cardsData);});
socket.on("blindBet", (betValue) => {setBlindBet(betValue)});
socket.on("requestAction", () => {requestAction();});
socket.on("setupStartGame", (startGameData) => {setupStartGame(startGameData);});
socket.on("updateLastPlayerStatus", (lastPlayerData_highestBet) => {updateLastPlayerStatus(lastPlayerData_highestBet);});
socket.on("addTableCard", (nextTableCard) => {addTableCard(nextTableCard);});
socket.on("gameEnded", () => {gameEnded();});
socket.on("returnWinner", (winnerData) => {showWinner(winnerData);});
socket.on("restartGame", (allPublicPlayersData) => {restartGameC(allPublicPlayersData);});
socket.on("newPlayerJoined", (allPublicPlayersData) => {newPlayerJoined(allPublicPlayersData);});

function submitUsername() {
    if(input_username.value == "") {
        alert("Your username can't be empty.");
    }
    else {
        dialog_inputUsername.style.visibility = "hidden";
        socket.emit("joinGame",input_username.value);
    }
}

function joinGame() {
    const name = prompt("Please enter your name.");
    socket.emit("joinGame",name);
}

function onTakeSeat(data) {
    playerData = data;
    console.log(data.cardValueHist);
    text_playerName.innerHTML = playerData.name;
    text_playerNo.innerHTML = playerData.number + 1; // plus one for user understanding
    text_playerWallet.innerHTML = playerData.wallet;
    if(playerData.number == 0) button_startGame.style.visibility = "visible";
}

function startGame() {
    if(playerCount >= 2 && playerCount <= 6) {
        socket.emit("startGame");
        button_startGame.style.visibility = "hidden";
    }
    else{
        alert("Player count must be between 2 - 6 players");
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
        playerData.cardSymbolHist[data[i].cardSymbol]++;
    }
    console.log(playerData.cardSymbolHist, playerData.cardValueHist);
}

function scoreCheck() {
    let scoreValue, scoreSymbol;
    scoreSymbol = cardSymbolHistDetect(playerData.cardSymbolHist, tableCard.concat(playerData.hand));
    scoreValue = cardValueHistDetect(playerData.cardValueHist);
    console.log('score from value ', scoreValue, ' score from symbol ', scoreSymbol);
    if(scoreValue[0] >= scoreSymbol[0])
        return scoreValue;
    return scoreSymbol;
}

function setBlindBet(data) {
    if(data[0] == playerData.number) playerData.lastBet = data[1];
    list_status.rows[data[0]+2].cells[2].innerHTML = data[1];
}
function requestAction() {
    text_turnStatus.innerHTML = "Now is your turn!!!";
    text_turnStatus.style.backgroundColor = "forestgreen";
    zone_action.style.visibility = "visible";
}

function newPlayerJoined(allPublicPlayerData) {
    playerCount = allPublicPlayerData.length;
    console.log("new player joined");
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
    text_turnStatus.innerHTML = "Waiting for other players";
    text_turnStatus.style.backgroundColor = "firebrick";
}

function updateLastPlayerStatus(data) {
    console.log(data);
    highestBet = data[1];
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
    text_turnStatus.innerHTML = "Waiting for other players";
    text_turnStatus.style.backgroundColor = "firebrick";
}

function gameEnded() {
    text_turnStatus.innerHTML = 'The game is ended.';
    zone_action.style.visibility = 'hidden';
    let playerScore = scoreCheck();
    socket.emit('requestWinner', [playerData.number, playerScore]);
    text_player_score.innerHTML = scoreToText(playerScore);
    if(playerData.number == 0) button_restartGame.style.visibility = "visible";
}

function requestRestartGame() {
    socket.emit("requestRestartGame");
}

function restartGameC(allPublicPlayersData) {
    zone_table_print.innerHTML = "";
    zone_hand_print.innerHTML = "";
    text_player_score.innerHTML = "";
    text_winner_playerno.innerHTML = "";
    text_winner_score.innerHTML = "";
    text_playerLastAction.innerHTML = "None";
    text_turnStatus.innerHTML = "Welcome";
    text_turnStatus.style.backgroundColor = "black";
    tableCard = [];
    highestBet = 20;
    console.log(allPublicPlayersData);
    playerData.lastBet = 0;
    playerData.lastAction = "None";
    playerData.hand = [];
    playerData.status = null;
    playerData.cardValueHist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    playerData.cardSymbolHist = [0, 0, 0, 0, 0];
    newPlayerJoined(allPublicPlayersData);
    button_restartGame.style.visibility = "hidden";
    zone_winner.style.visibility = "hidden";
    if(playerData.number == 0) button_startGame.style.visibility = "visible";
}

function showWinner(winnerData) {
    let winnerNumber = winnerData[0], winnerScore = winnerData[1];
    let winnerNumberText = '>';
    for(let i = 0; i < winnerNumber.length; i++)
        winnerNumberText = winnerNumberText + ' ' + winnerNumber[i];
    text_winner_playerno.innerHTML = winnerNumberText;
    text_winner_score.innerHTML = scoreToText(winnerScore);
    zone_winner.style.visibility = "visible";
}

function fold() {
    playerData.lastAction = "Fold";
    playerData.folded = true;
    socket.emit("passTurn", playerData);
    text_playerLastAction.innerHTML = "Fold";
    zone_action.style.visibility = "hidden";
}

function check() {
    if(playerData.lastBet < highestBet) {
        alert("You can't check, you need to call or raise");
    }
    else {
        playerData.lastAction = "Check";
        socket.emit("passTurn", playerData);
        text_playerLastAction.innerHTML = "Check";
        zone_action.style.visibility = "hidden";
    }
}

function call() {
    if(playerData.wallet < highestBet) {
        alert("You don't have enough money.");
    }
    if(playerData.lastBet == highestBet) {
        alert("You need to check (not call).");
    }
    else {
        playerData.lastAction = "Call";
        playerData.lastBet = highestBet;
        socket.emit("passTurn", playerData);
        text_playerLastAction.innerHTML = "Call";
        zone_action.style.visibility = "hidden";
    }
}

function raise() {
    console.log("Comparing input_raiseValue.value = " + input_raiseValue.value + "vs highestBet = " + highestBet);
    if(input_raiseValue.value <= highestBet) {
        alert("You must raise more than current highest bet");
    } 
    else if(input_raiseValue.value > playerData.wallet) {
        alert("You don't have enough money.");
    }
    else {
        playerData.lastAction = "Raise";
        playerData.lastBet = input_raiseValue.value;
        socket.emit("passTurn", playerData);
        text_playerLastAction.innerHTML = "Raise";
        zone_action.style.visibility = "hidden";
    }
    input_raiseValue.value = '';
}

function allIn() {

}

function showGameRules() {
    dialog_gameRules.show();
}

function closeGameRules() {
    dialog_gameRules.close();
}
