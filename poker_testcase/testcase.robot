***Settings***
Library     Selenium2Library

***Variables***
${url}  http://localhost:5000/
${browser}  chrome

***comments***
--in progress--
Test: enter name, open gamerules
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Click element  id=id_button_submitUsername
    Sleep  1s
    Element Should Contain  id=id_text_playerName  player1
    Click Element  //*[contains(text(),'Game Rules')]
    Page Should Contain  First player is the host who can start the game.
    Click element  //*[contains(text(),'Close')]    
Test: startgame with 1 player
    Click element  id=id_button_startGame
    Alert Should be present  Player count must be between 2 - 6 players
Test: startgame with 2 players
    Open browser  ${url}  ${browser}
    Switch browser  2
    Input Text  id=id_input_username  player2
    Click element  id=id_button_submitUsername
    Sleep  1s
    Element Should Contain  id=id_text_playerName  player2
Test: player2 Check
    Click element  id=id_button_check
    Alert Should be present  You can't check, you need to call or raise
***comments***    
Test: call
    Click element  id=id_button_call
    Alert Should be present  You need to check (not call).
Test: check
    Click element  id=id_button_check
    Page Should Contain  Player 0 : Check
    Click element  id=id_button_check
    Page Should Contain  Player 0 : Check
    Click element  id=id_button_check
    Page Should Contain  The game is ended.
    Close browser
Test: fold
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user0
    Click element  id=id_button_submitUsername
    Element Should Contain  user0
    Click element  id=id_button_startGame
    Click element  id=id_button_fold
    Page Should Contain  Player 0 : Fold
    Close browser
Test: All-in
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user0
    Click element  id=id_button_submitUsername
    Page Should Contain  Your name: user0
    Click element  id=id_button_allin
    Page Should Contain 

***comments***
This test case test success scenario: game can end and show the winner 
by using basic method(only call and check)//all pass    
***Test Cases***
Initial all user and position
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Click element  id=id_button_submitUsername
    Set Window Position  0  0
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player2
    Click element  id=id_button_submitUsername
    Set Window Position  960  0
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player3
    Click element  id=id_button_submitUsername
    Set Window Position  0  540
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player4
    Click element  id=id_button_submitUsername
    Set Window Position  960  540
    Set Window Size  960  540
Test Case-Success: Startgame
    Switch browser  1
    Click element  id=id_button_startGame  
Test Case-Success: Call
    switch browser  4
    Click element  id=id_button_call
    switch browser  1
    Click element  id=id_button_call
    switch browser  2
    Click element  id=id_button_call
Test Case-Success: Check
    Switch browser  3
    Click element  id=id_button_check
    Switch browser  4
    Click element  id=id_button_check
    Switch browser  1
    Click element  id=id_button_check
    Switch browser  2
    Click element  id=id_button_check
    Switch browser  3
    Click element  id=id_button_check
Test Case-Success: Another Check
    Switch browser  4
    Click element  id=id_button_check
    Switch browser  1
    Click element  id=id_button_check
    Switch browser  2
    Click element  id=id_button_check
    Switch browser  3
    Click element  id=id_button_check
Test Case-Success: Game ended -> close browser,showing restart game button
    Switch browser  1
    Page Should Contain  The game is ended.
    Element Should Contain   id=id_button_restartGame  Restart Game
    Sleep  5s
    Switch browser  2
    Page Should Contain  The game is ended.
    Switch browser  3
    Page Should Contain  The game is ended.
    Switch browser  4
    Page Should Contain  The game is ended.
    Close All Browsers

