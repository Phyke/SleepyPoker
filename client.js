const socket = io();
const button_startGame = document.getElementById("id_button_startGame");
const list_status = document.getElementById("id_list_status");
const zone_action = document.getElementById("id_zone_action");
const text_turnStatus = document.getElementById("id_text_turnStatus");
const input_raiseValue = document.getElementById("id_input_raiseValue");
let highestBet = 0;

joinGame();
socket.on("cantJoin", () => {document.write("The game has already started.");});
socket.on("takeSeat", (playerData) => {onTakeSeat(playerData);});
socket.on("gameStarted", (cardsData) => {cardDisplay(cardsData);});
socket.on("requestAction", () => {requestAction();});
socket.on("updateOtherPlayerStatus", (newPlayerData_Bet) => {updateOtherPlayerStatus(newPlayerData_Bet);});

function joinGame() {
    const name = prompt("Please enter your name.");
    socket.emit("joinGame",name);
}
function onTakeSeat(data) {
    playerData = data;
    document.getElementById("id_text_playerNo").innerHTML = playerData.number;
    if(playerData.number == 0) button_startGame.style.visibility = "visible";
}
function startGame() {
    socket.emit("startGame");
    button_startGame.style.visibility = "hidden";
}
function cardDisplay(data) {
    playerData.hand = data[1];
    printCardArray(data[0],"id_zone_table",100);
    printCardArray(data[1],"id_zone_hand",100);
}
function requestAction() {
        text_turnStatus.innerHTML = "Now is your turn!!!";
        zone_action.style.visibility = "visible";
}
function updateOtherPlayerStatus(data) {
        playerDataList = data[0];
        highestBet = data[1];
        list_status.innerHTML = "";
        playerDataList.forEach(playerData => {
            let new_listItem = document.createElement("li");
            new_listItem.innerHTML = "Player " + playerData.number + " : " + playerData.lastAction + " , " + playerData.lastBet;
            list_status.appendChild(new_listItem);
        });
        text_turnStatus.innerHTML = highestBet + "Waiting for other players";
}

function fold() {
    playerData.lastAction = "Fold";
    playerData.folded = true;
    socket.emit("passTurn", playerData);
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
    else {
        playerData.lastAction = "Call";
        playerData.lastBet = highestBet;
        socket.emit("passTurn", playerData);
        zone_action.style.visibility = "hidden";
    }
}

function raise() {
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