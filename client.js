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
const text_winner_score     = document.getElementById("id_text_winner_score");
let highestBet = 20;

joinGame();
socket.on("cantJoin", () => {document.write("The game has already started.");});
socket.on("takeSeat", (playerData) => {onTakeSeat(playerData);});
socket.on("gameStarted", (cardsData) => {cardRecieveAndDisplay(cardsData);});
socket.on("blindBet", (betValue) => {setBlindBet(betValue)});
socket.on("requestAction", () => {requestAction();});
socket.on("setupStartGame", (startGameData) => {setupStartGame(startGameData);});
socket.on("updateLastPlayerStatus", (lastPlayerData_highestBet) => {updateLastPlayerStatus(lastPlayerData_highestBet);});
socket.on("addTableCard", (nextTableCard) => {addTableCard(nextTableCard);});
socket.on("gameEnded", () => {gameEnded();});
socket.on('returnWinner', ([winnerNumber, winnerScore]) => {showWinner(winnerNumber, winnerScore);});

function joinGame() {
    const name = prompt("Please enter your name.");
    socket.emit("joinGame",name);
}

function onTakeSeat(data) {
    playerData = data;
    console.log(data.cardValueHist);
    text_playerName.innerHTML = playerData.name;
    text_playerNo.innerHTML = playerData.number;
    text_playerWallet.innerHTML = playerData.wallet;
    if(playerData.number == 0) button_startGame.style.visibility = "visible";
}

function startGame() {
    socket.emit("startGame");
    button_startGame.style.visibility = "hidden";
}

function cardRecieveAndDisplay(data) {
    tableCard = data[0];
    playerData.hand = data[1];
    console.log(data[0].concat(data[1]));
    updateCardHist(data[0].concat(data[1]));
    printCardArray(data[0],"id_zone_table_print",100);
    printCardArray(data[1],"id_zone_hand_print",100);
}

function addTableCard(data) {
    tableCard.push(data);
    printCard(data,"id_zone_table_print",100);
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
    playerData.lastBet = data;
}
function requestAction() {
    text_turnStatus.innerHTML = "Now is your turn!!!";
    zone_action.style.visibility = "visible";
}
function setupStartGame(data) {
    playerDataList = data[0];
    highestBet = data[1];
    playerDataList.forEach(playerData => {
        let new_listItem = document.createElement("li");
        new_listItem.innerHTML = "Player " + playerData.number + " : " + playerData.lastAction + " , " + playerData.lastBet;
        list_status.appendChild(new_listItem);
    });
    text_turnStatus.innerHTML = "Waiting for other players";
}

function updateLastPlayerStatus(data) {
    highestBet = data[1];
    listItems = list_status.querySelectorAll('li');
    listItems[data[0][0]].innerHTML = 'Player ' + data[0][0] + ' : ' + data[0][1] + ' , ' + data[0][2];
    text_turnStatus.innerHTML = 'Waiting for other players';
}

function gameEnded() {
    text_turnStatus.innerHTML = 'The game is ended.';
    zone_action.style.visibility = 'hidden';
    let playerScore = scoreCheck();
    text_player_score.innerHTML = 'Your highest score is:<br>' + scoreToText(playerScore);
    socket.emit('requestWinner', [playerData, playerScore]);
}

function showWinner(winnerNumber, winnerScore) {
    let winnerNumberText = '';
    console.log(winnerNumber);
    for(let i = 0; i < winnerNumber.length; i++)
        winnerNumberText = winnerNumberText + winnerNumber[i] + ' ';
    console.log(winnerNumberText);
    text_winner_score.innerHTML = 'The winner is Player:<br>' + winnerNumberText + '<br><br>Winner score:<br>' + scoreToText(winnerScore);
}

function fold() {
    playerData.lastAction = "Fold";
    playerData.folded = true;
    socket.emit('passTurn', playerData);
    zone_action.style.visibility = "hidden";
}

function check() {
    if(playerData.lastBet < highestBet) {
        alert("You can't check, you need to call or raise");
    }
    else {
        playerData.lastAction = "Check";
        socket.emit("passTurn", playerData);
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
        zone_action.style.visibility = "hidden";
    }
}

function raise() {
    input_raiseValue.value = '';
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
        zone_action.style.visibility = "hidden";
    }
}

function allIn() {

}

function showGameRules() {
    dialog_gameRules.show();
}

function closeGameRules() {
    dialog_gameRules.close();
}
