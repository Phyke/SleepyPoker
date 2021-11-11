const SPADE = 4;
const HEART = 3;
const DIAMOND = 2;
const CLOVER = 1;

const ACE = 14;
const KING = 13;
const QUEEN = 12;
const JACK = 11;

const STRAIGHT_FLUSH = 8;
const FOUR_OAK = 7;
const FULL_HOUSE = 6;
const FLUSH = 5;
const STRAIGHT = 4;
const THREE_OAK = 3;
const TWO_PAIR = 2;
const PAIR = 1;
const HIGH_CARD = [0];

let deck = [];
let cardValueHistogram = [];
let cardSymbolHistogram = [];

class card {
    constructor(cardSymbol, cardValue, imgPath) {
        this.cardSymbol = cardSymbol;
        this.cardValue = cardValue;
        this.imgPath = imgPath;
    }
}

function cardSortProperty(A, B) {
    if(A.cardValue != B.cardValue)
        return A.cardValue - B.cardValue;
    return B.cardSymbol - A.cardSymbol;
}

function cardValueHistDetect (cardValueHist) {
    let max = Math.max(...cardValueHist);
    console.log("Maximum value in value histogram is %d\n", max);
    if(max >= 4)
        return [FOUR_OAK, [cardValueHist.lastIndexOf(max)]];
    if(max == 3)
    {
        let THREE_OAK_Value = cardValueHist.lastIndexOf(3);
        if(cardValueHist.includes(2))
            return [FULL_HOUSE, [THREE_OAK_Value, cardValueHist.lastIndexOf(2)]];
        return [THREE_OAK, [THREE_OAK_Value]];
    }
    if(max == 2)
    {
        let PAIR_Value = cardValueHist.lastIndexOf(2);
        cardValueHist.splice(PAIR_Value, 1);
        if(cardValueHist.includes(2))
            return [TWO_PAIR, [PAIR_Value, [cardValueHist.lastIndexOf(2)]]];
        return [PAIR, [PAIR_Value]];
    }
    return [HIGH_CARD, cardValueHist.lastIndexOf(1)];
}

function cardSymbolHistDetect (cardSymbolHist, cards) {
    let max = Math.max(...cardSymbolHist);
    if(max >= 5) {
        let flushSymbol = cardSymbolHist.indexOf(max);
        cards = cards.filter(thisCard => thisCard.cardSymbol == flushSymbol)
    }
    cards.sort(cardSortProperty);
    let seq = 0;
    for(let i = cards.length - 1; i > 0; i--) {
        //console.log(i, ' ', cards[i]);
        //console.log(i - 1, ' ', cards[i - 1]);
        while(i > 0 && cards[i].cardValue - cards[i - 1].cardValue == 0)
            i--;
        if(i < 1)
            break;
        if(cards[i].cardValue - cards[i - 1].cardValue == 1) {
            seq++;
            //console.log('seq ', seq);
            if(seq == 3 && cards[i].cardValue == 3 && cards[cards.length - 1].cardValue == 14) { // A 2 3 4 5
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [5]];
                return [STRAIGHT, [5]];
            }
            if(seq == 4) {
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [cards[i + 3].cardValue]];
                return [STRAIGHT, [cards[i + 3].cardValue]];
            }
        }
        else
            seq = 0;
    }
    if(max >= 5) {
        let cardsValueFlush = cards.slice(cards.length - 5, cards.length);
        cardsValueFlush.reverse();
        for(let i = 0; i < 5; i++)
            cardsValueFlush[i] = cardsValueFlush[i].cardValue;
        return [FLUSH, cardsValueFlush];
    }
    return [HIGH_CARD];
}

function scoreComparison(allPlayerScore) {
    let winnerNumber = [allPlayerScore[0][0].number], winnerScore = allPlayerScore[0][1];

    for(let i = 1; i < allPlayerScore.length; i++) {
        console.log('current winning player: ', winnerNumber);
        console.log('current winning score: ', winnerScore);
        let currentPlayerScore = allPlayerScore[i][1];

        if(winnerScore[0] < currentPlayerScore[0])
            winnerScore = [];
        
        else if(winnerScore[0] == currentPlayerScore[0]) {
            for(let j = 0; j < currentPlayerScore[1].length; j++) {
                if(winnerScore[1][j] < currentPlayerScore[1][j])
                winnerNumber = [];
            }
            if(winnerNumber != []) {
                winnerNumber.push(allPlayerScore[i][0].number);
            }
        }

        if(winnerNumber == []) {
            winnerNumber = [allPlayerScore[i][0].number];
            winnerScore = currentPlayerScore;
        }
    }
    return [winnerNumber, winnerScore];
}



//creating a deck which represent a physical deck which we can add cards to it or draw cards from it.
//the physical deck is not contain duplicated cards.
function buildDeck() {
    const cardType = ["C","D","H","S"];
    const cardValue =  ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    deck = [];
    try
    {
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 13; j++) {
                deck.push(new card(i + 1, j + 2, "c_img/" + cardType[i] + cardValue[j] + ".png"));
            }
        }
    }
    catch(err)
    {
        return false;
    }

    return true;
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
}*/

//this function input a card(object) and the array it will be drawn from (usually a physical deck).
//this function won't allow to draw a card which is not exist in the array.
//this function return false if can't draw, and return card(object) if success.
function pickCard(card) {
    let foundCard = deck.filter(e => e.cardValue == card.cardValue && e.cardSymbol == card.cardSymbol).length;
    if(!foundCard) {
        console.log("Card " + card.cardName + " is not exist in deck");
        return false;
    }
    else {
        let index = deck.findIndex(e => e.cardValue == card.cardValue && e.cardSymbol == card.cardSymbol);
        let drawedCard = deck.splice(index,1);
        console.log("Card " + drawedCard[0].cardName + " is drawn from deck");
        return drawedCard[0];
    }
}

//this function input how many cards to draw and the array it will be drawn from (usually a physical deck).
//this function will not draw furthur if the array is empty.
//this function return false if can't draw any card. and return array of cards(object) if can draw at least one.
function drawCard(drawCount) {
    let drawedCardList = [];

    for(let i = 0; i < drawCount && deck.length > 0; i++) {

        let randomIndex = Math.floor(Math.random() * deck.length);
        let drawedCard = deck.splice(randomIndex, 1);
        
        console.log("Card " + drawedCard[0].cardSymbol + " " + drawedCard[0].cardValue + " is drawn from targetArray");
        drawedCardList.push(drawedCard[0]);
    }

    console.log(deck.length, ' cards left in deck');
    if(drawedCardList.length == drawCount) return drawedCardList;

    else
    {
        console.log("Not enough card to draw, please start game again");
        return false;
    }
}

function printCard (card, targetHtmlElementID, width) {
    const element_target = document.getElementById(targetHtmlElementID);
    const element_cardImg = document.createElement("img");

    element_cardImg.src = card.imgPath;
    //element_cardImg.width = width;
    element_cardImg.className = "cardimg";
    element_target.appendChild(element_cardImg);
}

function printCardArray (cardArray, targetHtmlElementID, width) {
    for(let i = 0; i < cardArray.length; i++)
        printCard(cardArray[i], targetHtmlElementID, width)
}

function scoreToText(score) {
    if(score.length > 1) {
        for(let i = 0; i < score[1].length; i++) {
            if(score[1][i] == ACE)
                score[1][i] = 'A';
            else if(score[1][i] == KING)
                score[1][i] = 'K';
            else if(score[1][i] == QUEEN)
                score[1][i] = 'Q';
            else if(score[1][i] == JACK)
                score[1][i]= 'J';
        }
    }
    if(score[0] == STRAIGHT_FLUSH){
        if(score[1] == 'A')
            return 'Royal Flush';
        return 'Straight Flush with high card ' + score[1][0];
    }
    if(score[0] == FOUR_OAK)
        return 'Four of a kind with ' + score[1][0];
    if(score[0] == FULL_HOUSE)
        return 'Full house with ' + score[1][0] + ' and ' + score[1][1];
    if(score[0] == FLUSH)
        return 'Flush with ' + score[1][0] + ' ' + score[1][1] + ' ' + score[1][2] + ' ' + score[1][3] + ' ' + score[1][4];
    if(score[0] == STRAIGHT)
        return 'Straight with high card ' + score[1][0];
    if(score[0] == THREE_OAK)
        return 'Three of a kind with ' + score[1][0];
    if(score[0] == TWO_PAIR)
        return 'Two pair with ' + score[1][0] + ' and ' + score[1][1];
    if(score[0] == PAIR)
        return 'Pair with ' + score[1][0];
    return 'High card';
}

//printCard(deck[0],"table",100);
//printCardArray(deck,"output",100);
//printCardArray(drawRandomCard(5,deck),"table",100);
//printCardArray(drawRandomCard(5,deck),"hand",100);

module.exports = {
    card,
    buildDeck,
    drawCard,
    pickCard,
    scoreComparison
};