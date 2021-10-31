class card {
    constructor(cardName, imgPath) {
        this.cardName = cardName;
        this.imgPath = imgPath;
    }
}

//creating a deck which represent a physical deck which we can add cards to it or draw cards from it.
//the physical deck is not contain duplicated cards.
function createDeck() {
    const deck = [];
    const cardType = ["C","D","H","S"];
    const cardValue =  ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    for(let i = 0; i < 4; i++) {
        for(let j = 0; j < 13; j++) {
            deck.push(new card(cardType[i] + cardValue[j], "c_img/" + cardType[i] + cardValue[j] + ".png"));
        }
    }
    return deck;
}

//this function input a card(object) and the array it will be added to (usually a physical deck).
//this function won't allow to add a card which already exist in the array.
//this function return boolean value, meaning we can check if adding card is successful or not.
/*function addCard(card, targetArray) {
    let foundCard = targetArray.filter(e => e.cardName == card.cardName).length;
    if(foundCard) {
        console.log("Card " + card.cardName + " is already exist in targetArray");
        return false;
    }
    else {
        console.log("Card " + card.cardName + " is added into targetArray");
        deck.push(card);
        return true;
    }
}*//*

//this function input a card(object) and the array it will be drawn from (usually a physical deck).
//this function won't allow to draw a card which is not exist in the array.
//this function return false if can't draw, and return card(object) if success.
function drawCard(card, targetArray) {
    let foundCard = targetArray.filter(e => e.cardName == card.cardName).length;
    if(!foundCard) {
        console.log("Card " + card.cardName + " is not exist in targetArray");
        return false;
    }
    else {
        let index = targetArray.findIndex(e => e.cardName == card.cardName);
        drawedCard = targetArray.splice(index,1);
        console.log("Card " + drawedCard[0].cardName + " is drawn from targetArray");
        return drawedCard[0];
    }
}*/

//this function input how many cards to draw and the array it will be drawn from (usually a physical deck).
//this function will not draw furthur if the array is empty.
//this function return false if can't draw any card. and return array of cards(object) if can draw at least one.
function drawRandomCard(drawCount, targetArray) {
    const drawedCardList = [];
    for(let i = 0; i < drawCount; i++) {
        if(targetArray.length == 0) break;
        let randomIndex = Math.floor(Math.random() * targetArray.length);
        drawedCard = targetArray.splice(randomIndex,1);
        console.log("Card " + drawedCard[0].cardName + " is drawn from targetArray");
        drawedCardList.push(drawedCard[0]);
    }
    if(drawedCardList.length > 0) return drawedCardList;
    else return false;
}

function printCard(card, targetHtmlElementID, width) {
    const element_target = document.getElementById(targetHtmlElementID);
    const element_cardImg = document.createElement("img");
    element_cardImg.src = card.imgPath;
    element_cardImg.width = width;
    element_target.appendChild(element_cardImg);
}

function printCardArray(cardArray, targetHtmlElementID, width) {
    for(let i = 0; i < cardArray.length; i++)
        printCard(cardArray[i], targetHtmlElementID, width)
}

//printCard(deck[0],"table",100);
//printCardArray(deck,"output",100);
//printCardArray(drawRandomCard(5,deck),"table",100);
//printCardArray(drawRandomCard(5,deck),"hand",100);

module.exports = {
    createDeck,
    drawRandomCard,
};