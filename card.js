/*
card.js
 
Implements _CARD.
_CARD is a class with 3 parameters.
    - Card value ranged from 2 - 14, 11 - 14 represent jack to ace.
    - Card suit ranged from 1 - 4 represent clover, diamond, heart, and spade.
    - image path for display in html element
 
Include functions to
    - build card deck
    - draw random and specific card
    - sort card
    - find poker score from card values and suits histogram
    - compare score and display card
    - display card
 
 Created by Prombot Cherdchoo and Wanna Wannasin
 This file is built for online poker game project in CPE327 class.
 */

//define number value for card suit
const SPADE = 4;
const HEART = 3;
const DIAMOND = 2;
const CLOVER = 1;

//define number value for non-number card value
const ACE = 14;
const KING = 13;
const QUEEN = 12;
const JACK = 11;

//define number value for score ranking, OAK stand for of a kind
const STRAIGHT_FLUSH = 8;
const FOUR_OAK = 7;
const FULL_HOUSE = 6;
const FLUSH = 5;
const STRAIGHT = 4;
const THREE_OAK = 3;
const TWO_PAIR = 2;
const PAIR = 1;
const HIGH_CARD = 0;

//built in card deck
let deck = [];

/*
card is a class with 3 parameters.
    - Card value ranged from 2 - 14, 11 - 14 represent jack to ace.
    - Card suit ranged from 1 - 4 represent clover, diamond, heart, and spade.
    - image path for display in html element
*/
class card {
    constructor(cardSuit, cardValue, imgPath) {
        this.cardSuit = cardSuit;
        this.cardValue = cardValue;
        this.imgPath = imgPath;
    }
}

//comparator function for _CARD class, sort card by its value and suit in descending order
function cardSortProperty(A, B) {
    if(A.cardValue != B.cardValue)
        return B.cardValue - A.cardValue;
    return B.cardSuit - A.cardSuit;
}

/*
Required parameter
    - cardValueHist:    histogram of cards in player hand and community card (table card) represented in array
                        cardValueHist[i] means the number of cards in hand or table which thier value is i
    - cards:            array of _CARD from player's hand and community card.

This function is used to find card score from card value histogram, then find kicker card value

return parameter pattern is [score, [value1, /value2, /..., /kicker1, /kicker2, /...]]
    - score:    number value for score ranking as defined above
    - valueN:   n-th value of score ranking
    (optional)
    - kickerN:   n-th kicker card

    example:
        [3, [5, 8, 4]] means this hand win three of a kind with 3 fives, with 2 kickers which are eight and four
        [6, [7, 4, 6]] mean this hand win full house with 3 sevens and 2 fours, with a kicker which are six
*/
function cardValueHistDetect (cardValueHist, cards) {
    let winningCard;
    let max = Math.max(...cardValueHist);
    cards.sort(cardSortProperty);

    console.log('Maximum value in value histogram is %d\n', max);
    if(max >= 4) {
        winningCard = cardValueHist.lastIndexOf(max);
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);
        return [FOUR_OAK, [winningCard, cards[0].cardValue]];
    }
    if(max == 3)
    {
        winningCard = cardValueHist.lastIndexOf(3);
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);
        let len = cards.length;
        if(cardValueHist.includes(2)) {
            return [FULL_HOUSE, [winningCard, cardValueHist.lastIndexOf(2)]];
        }
        return [THREE_OAK, [winningCard, cards[0].cardValue, cards[1].cardValue]];
    }
    if(max == 2)
    {
        let winningCard = cardValueHist.lastIndexOf(2);
        cardValueHist.splice(winningCard, 1);
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);
        let len = cards.length;
        if(cardValueHist.includes(2)) {
            cards = cards.filter(thisCard => thisCard.cardValue != cardValueHist.lastIndexOf(2));
            let len = cards.length;
            return [TWO_PAIR, [winningCard, cardValueHist.lastIndexOf(2), cards[0].cardValue]];
        }
        return [PAIR, [winningCard, cards[0].cardValue, cards[1].cardValue, cards[2].cardValue]];
    }
    cards = cards.splice(0, 5);
    for(let i = 0; i < 5; i++)
        cards[i] = cards[i].cardValue;
    return [HIGH_CARD, cards];
}

function cardSuitHistDetect (cardSuitHist, cards) {
    let max = Math.max(...cardSuitHist);

    if(max >= 5)
        cards = cards.filter(thisCard => thisCard.cardSuit == cardSuitHist.indexOf(max))
    
    //เรียงไพ่จากมากไปน้อย
    cards.sort(cardSortProperty);
    let seq = 0;

    for(let i = 0; i < cards.length - 1; i++) {
        //ข้ามไพ่ซ้ำ
        while(i < cards.length - 1 && cards[i].cardValue - cards[i + 1].cardValue == 0)
            i++;
        //หยุดทันทีหากข้ามไพ่ซ้ำจนไพ่หมด
        if(i >= cards.length - 1)
            break;
        //นับจำนวนไพ่เรียงกัน
        if(cards[i].cardValue - cards[i + 1].cardValue == 1) {
            seq++;

            //กรณีพิเศษ ถ้าไพ่เรียงกัน 5 4 3 2 และไพ่ที่มีค่ามากที่สุดเป็น Ace
            if(seq == 3 && cards[i].cardValue == 3 && cards[0].cardValue == 14) {

                //ถ้า flush ด้วย คืนค่า straight flush ถ้าไม่ คืนค่า straight เฉย ๆ
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [5]];
                return [STRAIGHT, [5]];
            }
            
            //ถ้าไพ่เรียงกัน 5 ใบ
            if(seq == 4) {
                //ถ้า flush ด้วย คืนค่า straight flush ถ้าไม่ คืนค่า straight เฉย ๆ
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [cards[i].cardValue + 3]];
                return [STRAIGHT, [cards[i].cardValue + 3]];
            }
        }
        //ถ้าไพ่ไม่เรียงกัน เริ่มนับใหม่
        else
            seq = 0;
    }
    //ถ้า flush คืนค่าไพ่ที่มีดอกตรง และมีค่ามากที่สุด 5 ใบ
    if(max >= 5) {

        //กลับด้านไพ่ เพื่อเรียงไพ่จากมากไปน้อย
        for(let i = 0; i < 5; i++)
            cards[i] = cards[i].cardValue;
        return [FLUSH, cards];
    }
    //ถ้าไม่เข้าข่ายรูปแบบใด ๆ คืนค่า high card
    cards = cards.splice(0, 5);
    return [HIGH_CARD, cards];
}

function scoreComparison(allPlayerScore) {
    let i, j;
    let winnerNumber = [], winnerScore = allPlayerScore[0][1];
    winnerNumber.push(allPlayerScore[0][0]);

    for(i = 1; i < allPlayerScore.length; i++) {
        console.log('current winning player: ', winnerNumber);
        console.log('current winning score: ', winnerScore);
        let currentPlayerScore = allPlayerScore[i][1];

        if(winnerScore[0] < currentPlayerScore[0])
            winnerNumber = [];
        
        else if(winnerScore[0] == currentPlayerScore[0]) {
            for(j = 0; j < currentPlayerScore[1].length; j++) {
                if(winnerScore[1][j] != currentPlayerScore[1][j]) {
                    if(winnerScore[1][j] < currentPlayerScore[1][j])
                        winnerNumber = [];
                    break;
                }
                else if(j == currentPlayerScore[1].length - 1)
                    winnerNumber.push(allPlayerScore[i][0]);
            }
            if(j == currentPlayerScore[1].length) {
                winnerNumber.push(allPlayerScore[i][0]);
            }
        }

        if(!winnerNumber.length) {
            winnerNumber.push(allPlayerScore[i][0]);
            winnerScore = currentPlayerScore;
        }
    }
    return [winnerNumber, winnerScore];
}



//creating a deck which represent a physical deck which we can add cards to it or draw cards from it.
//the physical deck is not contain duplicated cards.
function buildDeck() {
    const cardType = ['C','D','H','S'];
    const cardValue =  ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    deck = [];
    try
    {
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 13; j++) {
                deck.push(new card(i + 1, j + 2, 'c_img/' + cardType[i] + cardValue[j] + '.png'));
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
        console.log('Card ' + card.cardName + ' is already exist in targetArray');
        return false;
    }
    else {
        console.log('Card ' + card.cardName + ' is added into targetArray');
        deck.push(card);
        return true;
    }
}*/

//this function input a card(object) and the array it will be drawn from (usually a physical deck).
//this function won't allow to draw a card which is not exist in the array.
//this function return false if can't draw, and return card(object) if success.
function pickCard(card) {
    let foundCard = deck.filter(e => e.cardValue == card.cardValue && e.cardSuit == card.cardSuit).length;
    if(!foundCard) {
        console.log('Card ' + card.cardName + ' is not exist in deck');
        return false;
    }
    else {
        let index = deck.findIndex(e => e.cardValue == card.cardValue && e.cardSuit == card.cardSuit);
        let drawedCard = deck.splice(index,1);
        console.log('Card ' + drawedCard[0].cardName + ' is drawn from deck');
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
        
        console.log('Card ' + drawedCard[0].cardSuit + ' ' + drawedCard[0].cardValue + ' is drawn from targetArray');
        drawedCardList.push(drawedCard[0]);
    }

    console.log(deck.length, ' cards left in deck');
    if(drawedCardList.length == drawCount) return drawedCardList;

    else
    {
        console.log('Not enough card to draw, please start game again');
        return false;
    }
}

function printCard (card, targetHtmlElement, width) {
    const element_cardImg = document.createElement('img');

    element_cardImg.src = card.imgPath;
    //element_cardImg.width = width;
    element_cardImg.className = 'cardimg';
    targetHtmlElement.appendChild(element_cardImg);
}

function printCardArray (cardArray, targetHtmlElement, width) {
    for(let i = 0; i < cardArray.length; i++)
        printCard(cardArray[i], targetHtmlElement, width)
}

function scoreToText(score) {
    let text;
    console.log(score[1]);
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

    if(score[0] == STRAIGHT_FLUSH){
        if(score[1][0] == 'A')
            text = 'Royal Flush';
        text = 'Straight Flush with high card ' + score[1][0];
    }

    else if(score[0] == FOUR_OAK) {
        text = 'Four of a kind with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1];
    }

    else if(score[0] == FULL_HOUSE)
        text = 'Full house with ' + score[1][0] + ' and ' + score[1][1];

    else if(score[0] == FLUSH){
        text = 'Flush with';
        score[1].forEach(s => text = text + ' ' + s);
    }

    else if(score[0] == STRAIGHT)
        text = 'Straight with high card ' + score[1][0];

    else if(score[0] == THREE_OAK) {
        text =  'Three of a kind with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1] + ' ' + score[1][2];
    }
    else if(score[0] == TWO_PAIR) {
        text = 'Two pair with ' + score[1][0] + ' and ' + score[1][1];
        text = text + '<br>Kicker Cards: ' + score[1][2];
    }
    else if(score[0] == PAIR) {
        text = 'Pair with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1] + ' ' + score[1][2] + ' ' + score[1][3];
    }
    else {
        text = 'High card<br>Kicker Cards:';
        score[1].forEach(s => text = text + ' ' + s);
    }
    
    return text;
}

//printCard(deck[0],'table',100);
//printCardArray(deck,'output',100);
//printCardArray(drawRandomCard(5,deck),'table',100);
//printCardArray(drawRandomCard(5,deck),'hand',100);

module.exports = {
    card,
    buildDeck,
    drawCard,
    pickCard,
    scoreComparison,
};