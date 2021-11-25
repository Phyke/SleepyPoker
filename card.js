/*
card.js
 
Implements card.
card is a class with 3 parameters.
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
cardValueHistScoring is used to find highest score from player's card value histogram which could be
    - Four of a kind: 4  cards in same value
    - Three house: 3 cards in same value and 2 cards in same value
    - Three of a kind: 3 cards in same value
    - Two pair: 2 cards in same value and another 2 card in another value
    - Pair: 2 cards in same value

Required parameter
    - cardValueHist:    histogram of cards in player hand and community card (table card) represented in array
                        cardValueHist[i] means the number of cards in hand or table which thier value is i
    - cards:            array of card from player's hand and community card.

return parameter pattern is [score, [value1, /value2, /..., /kicker1, /kicker2, /...]]
    - score:    number value for score ranking as defined above
    - valueN:   n-th value of score ranking
    (optional)
    - kickerN:   n-th kicker card

    example:
        [3, [5, 8, 4]] means this hand win three of a kind with 3 fives, with 2 kickers which are eight and four
        [6, [7, 4, 6]] mean this hand win full house with 3 sevens and 2 fours, with a six as kicker card
*/
function cardValueHistScoring (cardValueHist, cards) {
    //winningCard is value of card with highest score
    let winningCard;
    let cardValueHistTemp = cardValueHist.slice();

    //find the most repeating card value
    let max = Math.max(...cardValueHistTemp);

    //sort card by value in descending order to find kicker card later
    cards.sort(cardSortProperty);

    console.log('notice: Most repeating card calue in value histogram is %d\n', max);

    //4 cards repeating, return four of a kind
    if(max >= 4) {
    
        //winningCard is most value that have 4 repeating cards
        winningCard = cardValueHistTemp.lastIndexOf(max);

        //find kicker card by filter winningCard out
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);

        /*
        return
        score = four of a kind,
        value1 = winningCard, 
        kicker1 = highest value card
        */
        return [FOUR_OAK, [winningCard, cards[0].cardValue]];
    }

    //3 cards repeating, continue to find fullhouse or three of a kind
    if(max == 3) {
        //winningCard is most value that have 3 repeating cards
        winningCard = cardValueHistTemp.lastIndexOf(3);

        //filter winningCard out
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);
        cardValueHistTemp.splice(winningCard, 1);

        //find next most repeating card
        max = Math.max(...cardValueHistTemp);

        /*
        if found any pair, return
        score = full house,
        value1 = winningCard,
        value2 = value of found pair
        */
        if(max >= 2)
            return [FULL_HOUSE, [winningCard, cardValueHistTemp.lastIndexOf(max)]];

        /*
        if not found any pair, return
        score = three of a kind,
        value1 = winningCard,
        kicker1 = most value card,
        kicker2 = secondth most value card
        */
        return [THREE_OAK, [winningCard, cards[0].cardValue, cards[1].cardValue]];
    }

    //2 cards repeating, continue to find two pair or return pair
    if(max == 2) {
        //winningCard is value of found pair
        let winningCard = cardValueHistTemp.lastIndexOf(2);

        //filter winningCard out
        cards = cards.filter(thisCard => thisCard.cardValue != winningCard);
        cardValueHistTemp.splice(winningCard, 1);
        
        //found second pair, 
        if(cardValueHistTemp.includes(2)) {
            //filter second pair value out to find kicker card
            cards = cards.filter(thisCard => thisCard.cardValue != cardValueHistTemp.lastIndexOf(2));

            /*
            return
            score = two pair,
            value1 = winningCard,
            value2 = value of second pair,
            kicker1 = most value card
            */
            return [TWO_PAIR, [winningCard, cardValueHistTemp.lastIndexOf(2), cards[0].cardValue]];
        }

        /*
        if not found second pair, return
        score = pair,
        value1 = winningCard,
        kicker1 = most value card,
        kicker2 = second most value card,
        kicker3 = third most value card
        */
        return [PAIR, [winningCard, cards[0].cardValue, cards[1].cardValue, cards[2].cardValue]];
    }

    //not found any pattern, return high card with 5 kicker cards (return only value)
    cards = cards.splice(0, 5);
    for(let i = 0; i < 5; i++)
        cards[i] = cards[i].cardValue;
    return [HIGH_CARD, cards];
}

/*
cardSuitHistScoring is used to find highest score from player's card suit histogram which could be
    - Straight flush: 5 cards in same suit and in sequential order
    - Flush: 5 cards in same suit
    - Straight: 5 cards in sequential order

Required parameter
    - cardSuitHist:     histogram of cards in player hand and community card (table card) represented in array
                        cardSuitHist[i] means the number of cards in hand or table which thier suit is i
    - cards:            array of card from player's hand and community card.

return parameter pattern is [score, [value1, /value2, /...,]]
    - score:    number value for score ranking as defined above
    - valueN:   n-th value of score ranking (n = 1 if straight, n = 1 to 5 if flush)

    example:
        [8, [8]] means this hand win straight flush with high card 8
        [5, [11, 7, 6, 5, 2]] mean this hand win flush with jack, 7, 6, 5, 2
*/
function cardSuitHistScoring (cardSuitHist, cards) {
    //find the most repeating card suit
    let max = Math.max(...cardSuitHist);

    //found flush, filter other suits out and continue to find straight flush
    if(max >= 5)
        cards = cards.filter(thisCard => thisCard.cardSuit == cardSuitHist.indexOf(max))
    
    //sort card by value in descending order to find straight easier, and find highest set of flush later
    cards.sort(cardSortProperty);

    //seq is longest straight sequence counter
    let seq = 0;

    //finding straight in cards
    for(let i = 0; i < cards.length - 1; i++) {
        //skipping repeating card value (pair will be managed in cardSuitHistScoring)
        while(i < cards.length - 1 && cards[i].cardValue == cards[i + 1].cardValue)
            i++;
        
        //check and break if reach end of cards
        if(i >= cards.length - 1)
            break;
        
        //adjacent cards' value is sequential, seq increase
        if(cards[i].cardValue - cards[i + 1].cardValue == 1) {
            seq++;

            /*
            if there are 4 cards in sequence so far and they are 5 4 3 2, check the first card.
            If it is ace, found straight with high card 5
            */
            if(seq == 3 && cards[i].cardValue == 3 && cards[0].cardValue == 14) {

                //found flush earlier, return straight flush, else return straight, both with high card 5
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [5]];
                
                return [STRAIGHT, [5]];
            }
            
            //there 5 cards in sequence, found straight
            if(seq == 4) {

                //found flush earlier, return straight flush, else return straight, both with high card 3 cards before now
                if(max >= 5)
                    return [STRAIGHT_FLUSH, [cards[i].cardValue + 3]];
                
                return [STRAIGHT, [cards[i].cardValue + 3]];
            }
        }

        //adjacent cards is not sequential, recount seq
        else
            seq = 0;
    }

    //found no straight

    //found flush earlier
    if(max >= 5) {

        //return flush with 5 most value card (only value)
        for(let i = 0; i < 5; i++)
            cards[i] = cards[i].cardValue;
        return [FLUSH, cards];
    }

    //not found flush earlier, return score = high card with 5 high cards
    cards = cards.splice(0, 5);
    for(let i = 0; i < 5; i++)
            cards[i] = cards[i].cardValue;
    return [HIGH_CARD, cards];
}

/*
scoreComparison is used to compare and find highest score from players' score

Required parameter
    allPlayerScore: array of score returned from cardValueHistScoring and cardSuitHistScoring

return parameter pattern is [[number], [score, [value1, /value2, /..., /kicker1, /kicker2, /...]]]
    - number:   number of winning player, could has more than 1 player
    - score:    number value for score ranking as defined above
    - valueN:   n-th value of score ranking
    (optional)
    - kickerN:  n-th kicker card

    example:
        [[1], [8, [8]]] means player 1 win straight flush with high card 8
        [[2, 4], [6, [7, 4, 6]]] mean player 2 and player 4 win full house with 3 sevens and 2 fours, with a six as kicker card
*/
function scoreComparison(allPlayerScore) {
    //winnerNumber is array of players' number who have winnerScore, winnerScore is winners' score
    //initiate them for comparison
    let winnerNumber = [-1], winnerScore = [-1, []];

    //check every player score
    allPlayerScore.forEach(playerScore => {

        //retrieve number and score from allPlayerScore
        let number = playerScore[0], score = playerScore[1];

        console.log('notice: Current player: ', number);
        console.log('notice: Current score: ', score);
        
        //current winning card score is lower than current player card score, replace winnerNumber and winnerScore
        if(winnerScore[0] < score[0]){
            winnerNumber = [number];
            winnerScore = score;
        }

        //current winning card score is equal to current player card score, continue to check card score value and kicker
        else if(winnerScore[0] == score[0]) {

            for(let i = 0; i < score[1].length; i++){

                //two card value is not the same, stop checking
                if(winnerScore[1][i] != score[1][i]){

                    //current winning card score is lower than current player card score, replace winnerNumber and winnerScore
                    if(winnerScore[1][i] < score[1][i]){
                        winnerNumber = [number];
                        winnerScore = score;
                    }

                    break;
                }

                //every card score value is the same (tie), push current player number into winnerNumber
                else if(i == score[1].length - 1)
                    winnerNumber.push(number)
                
            }
        }
        
        console.log('notice: Current winning player: ', winnerNumber);
        console.log('notice: Current winning score: ', winnerScore);
    });

    return [winnerNumber, winnerScore];

    /*
    old score comparison
    for(i = 1; i < allPlayerScore.length; i++) {
        console.log('current winning player: ', winnerNumber);
        console.log('current winning score: ', winnerScore);
        let currentScore = allPlayerScore[i][1];

        if(winnerScore[0] < currentScore[0])
            winnerNumber = [];
        
        else if(winnerScore[0] == currentScore[0]) {
            for(j = 0; j < currentScore[1].length; j++) {
                if(winnerScore[1][j] < currentScore[1][j]) {
                    winnerNumber = [];
                    break;
                }
            }
            if(winnerNumber.length) {
                winnerNumber.push(allPlayerScore[i][0]);
            }
        }

        if(!winnerNumber.length) {
            winnerNumber.push(allPlayerScore[i][0]);
            winnerScore = currentScore;
        }
    }*/
}


/*
buildDeck is used to build deck of 52 cards to use in poker game, the deck will be used to draw or pick to table and players' hand

return true if deck is built with no error
*/
function buildDeck() {
    //array for card suits and card values to make combination of 52 cards
    const cardType = ['C','D','H','S'];
    const cardValue =  ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    
    //clear deck in case of restarting game
    deck = [];

    try
    {
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 13; j++)
                //push new card into deck, one card has card suit, card value, and imagepath for html element
                //suit will start at 1 to 4 and value will start at 2 to 14
                deck.push(new card(i + 1, j + 2, 'c_img/' + cardType[i] + cardValue[j] + '.png'));
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

/*
pickCard is used to pick particular card from a deck, only used to test

Required parameter
    card:   a card with suit and value to pick

return card if successfully pick, return false if can't find card
*/
function pickCard(card) {
    //find card by filtering
    let foundCard = deck.filter(e => e.cardValue == card.cardValue && e.cardSuit == card.cardSuit);

    //found card, return card
    if(foundCard.length) {
        console.log('notice: Card '+ card.cardSuit + ' ' + card.cardValue + ' is drawn from deck');
        return foundCard[0];
    }
    
    //not found card, return false
    else {
        console.log('alert: Card ' + card.cardSuit + ' ' + card.cardValue + ' is not exist in deck');
        return false;
    }
}

/*
pickCard is used to pick random cards from a deck

Required parameter
    drawCount:  number of cards to draw

return (drawCount) card from deck if drew successfully, return false if cards in the deck isn't enough
*/
function drawCard(drawCount) {
    //array of drawn card
    let drawCardList = [];

    //repeat this step (drawCount) times or until deck is empty
    for(let i = 0; i < drawCount && deck.length > 0; i++) {

        //random index and pick card from the deck, the push into drawCardList list
        let randomIndex = Math.floor(Math.random() * deck.length);
        let drawCard = deck.splice(randomIndex, 1);
        drawCardList.push(drawCard[0]);
        
        console.log('notice: Card ' + drawCard[0].cardSuit + ' ' + drawCard[0].cardValue + ' is drawn from deck');
    }

    console.log(deck.length, 'notice: Cards left in deck');

    //drawn card count is equal to requested drawCount, return array of drawn card
    if(drawCardList.length == drawCount)
        return drawCardList;

    //card in the deck is not enough to draw, return false
    else
    {
        console.log('alert: Not enough card to draw, please start game again');
        return false;
    }
}


/*
printCard is used to print single card in html element

Required parameter
    card:               card to print
    targetHtmlElement:  target element to print card
*/
function printCard (card, targetHtmlElement) {
    //create html element to push card image
    const element_cardImg = document.createElement('img');

    //retrive image path from card, define class, and print new card to targeted element
    element_cardImg.src = card.imgPath;
    element_cardImg.className = 'cardimg';
    targetHtmlElement.appendChild(element_cardImg);
}

/*
printCardArray is used to print multiple cards in html element by looping printCard

Required parameter
    card:               card to print
    targetHtmlElement:  target element to print card
*/
function printCardArray (cardArray, targetHtmlElement) {
    for(let i = 0; i < cardArray.length; i++)
        printCard(cardArray[i], targetHtmlElement)
}

/*
scoreToText is used to convert score in numeric pattern to text and return to be printed

Required parameter
    score:  score in numeric patter

return score in text
*/
function scoreToText(score) {
    //text to be return, will contain score, score card value, kicker card
    let text;

    console.log('notice: score to be converted to text: ',score[1]);

    //convert 11 12 13 14 in card value to J, K, Q, A
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

    //seperate case for seperate score ranking, in descending order

    //score is straight flush
    if(score[0] == STRAIGHT_FLUSH){
        //straight flush with Ace, aka. Royal Flush
        if(score[1][0] == 'A')
            text = 'Royal Flush';
        
        //normal straight flush, show 1 card value
        text = 'Straight Flush with high card ' + score[1][0];
    }

    //score is four of a kind, show 1 card value and 1 kicker cards
    else if(score[0] == FOUR_OAK) {
        text = 'Four of a kind with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1];
    }

    //score is full house, show 2 card values
    else if(score[0] == FULL_HOUSE)
        text = 'Full house with ' + score[1][0] + ' and ' + score[1][1];

    //score is flush, show 5 card values
    else if(score[0] == FLUSH){
        text = 'Flush with';
        score[1].forEach(s => text = text + ' ' + s);
    }

    //score is straight, show 1 card value
    else if(score[0] == STRAIGHT)
        text = 'Straight with high card ' + score[1][0];

    //score is three of a kind, show 1 card value and 2 kicker cards
        else if(score[0] == THREE_OAK) {
        text =  'Three of a kind with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1] + ' ' + score[1][2];
    }

    //score is two pair, show 2 card values and 1 kicker card
    else if(score[0] == TWO_PAIR) {
        text = 'Two pair with ' + score[1][0] + ' and ' + score[1][1];
        text = text + '<br>Kicker Cards: ' + score[1][2];
    }

    //score is pair, show 1 card values and 3 kicker cards
    else if(score[0] == PAIR) {
        text = 'Pair with ' + score[1][0];
        text = text + '<br>Kicker Cards: ' + score[1][1] + ' ' + score[1][2] + ' ' + score[1][3];
    }

    //score is high card, show 5 kicker cards
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

//module exported to use in server.js
module.exports = {
    card,
    buildDeck,
    drawCard,
    pickCard,
    scoreComparison,
};