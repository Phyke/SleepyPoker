***Settings***
Library     Selenium2Library

***Variables***
${url}  http://localhost:5000/
${browser}  chrome

***comments***
This test case test main success scenario: game can end and show the winner 
by using basic way to ending game(all in, fold).   
***Test Cases***
Test Main Success Case: Initial all user and desktop position
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
Test Main Success Case: Startgame
    Switch browser  1
    Click element  id=id_button_startGame  
Test Main Success Case: All players all in, except host doing fold
    switch browser  4
    Click element  id=id_button_allIn
    Sleep  2s
    switch browser  1
    Click element  id=id_button_fold
    Sleep  2s
    switch browser  2
    Click element  id=id_button_allIn
    Sleep  2s
    Switch browser  3
    Click element  id=id_button_allIn
    Sleep  2s
Test Main Success Case: Game ended -> click on restart game button, close browser
    Page Should Contain  The game is ended.
    Switch browser  2
    Page Should Contain  The game is ended.
    Switch browser  4
    Page Should Contain  The game is ended.
    Switch browser  1
    Page Should Contain  The game is ended.
    Sleep  1s
    Element Should Contain   id=id_button_restartGame  Restart Game
    Click element  id=id_button_restartGame
    Element Should Contain   id=id_button_startGame  Start Game
    Sleep  1s
    Close All Browsers

***comments***
This test case test function and action of the system.
***Test Cases***
Test Function: have players more than 6 (use enter to input name)
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Press Keys  //*[contains(text(),'Submit')]  Enter 
    Set Window Position  960  0
    Set Window Size  960  540
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player2
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player3
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player4
    Press Keys  //*[contains(text(),'Submit')]  Enter 
    Sleep  1s
Test Function: have players more than 6 (use click on "Submit" button to input name)
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player5
    Click element  id=id_button_submitUsername
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player6
    Click element  id=id_button_submitUsername
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player7
    Click element  id=id_button_submitUsername
    Sleep  2s
    Switch browser  1
    Click element  id=id_button_startGame
    Sleep  3s
    Alert Should be present  Player count must be between 2 - 6 players
Test Function: Showing "Host disconnected...", when host disconnect before start game
    Close browser
    Switch browser  2
    Page Should Contain  Host disconnected
    Close All Browsers
Test Fucntion: enter name, open gamerules
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Click element  id=id_button_submitUsername
    Sleep  2s
    Element Should Contain  id=id_text_playerName  player1
    Click Element  //*[contains(text(),'Game Rules')]
    Element Should be visible  class=gameRuleItems
    Sleep  2s
    Click element  //*[contains(text(),'Close')]  
Test Function: startgame with 1 player
    Click element  id=id_button_startGame
    Sleep  2s
    Alert Should be present  Player count must be between 2 - 6 players
Test Function: startgame with 2 players
    Open browser  ${url}  ${browser}
    Switch browser  2
    Input Text  id=id_input_username  player2
    Click element  id=id_button_submitUsername
    Set Window Position  960  0
    Sleep  2s
    Element Should Contain  id=id_text_playerName  player2
    Switch browser  1
    Click element  id=id_button_startGame
    Element Should Contain  id=id_text_playerWallet  1000
Test Action: player2 Check
    Switch browser  2
    Element Should Contain  id=id_text_playerWallet  1000
    Click element  id=id_button_check
    Sleep  2s
    Alert Should be present  You cannot check, you need to call or raise
    Table Should Contain  id=id_list_status  None
Test Action: player2 Call, player1 Call and check
    Click element  id=id_button_call
    Table Should Contain  id=id_list_status  Call
    Switch browser  1
    Click element  id=id_button_call
    Sleep  2s
    Alert Should be present  You need to check (not call).
    Table Should Contain  id=id_list_status  None
    Click element  id=id_button_check
    Table Should Contain  id=id_list_status  Check
Test Action: player2 Raise, player1 Call
    Switch browser  2
    Input Text  id=id_input_raiseValue  150
    Sleep  2s
    Click element  id=id_button_raise
    Table Should Contain  id=id_list_status  150
    Table Should Contain  id=id_list_status  Raise
    Switch browser  1
    Click element  id=id_button_call
    Table Should Contain  id=id_list_status  150
    Table Should Contain  id=id_list_status  Call
Test Action: player2 All in, player1 Fold
    Switch browser  2
    Click element  id=id_button_allIn
    Table Should Contain  id=id_list_status  1000
    Table Should Contain  id=id_list_status  All-In
    Sleep  2s
    Switch browser  1
    Click element  id=id_button_fold
    Table Should Contain  id=id_list_status  Fold
    Sleep  2s
    Element Should Contain  id=id_text_winner_playerno  2
    Page Should Contain  The game is ended.
Test Function: check player's wallet (money transfer function)
    Element Should Contain  id=id_text_playerWallet  850
    Switch browser  2
    Element Should Contain  id=id_text_playerWallet  1150
    Sleep  5s
Test Function: Restart game, showing "Start game" button
    Switch browser  1
    click element  id=id_button_restartGame
    sleep  1s
    Element Should Contain   id=id_button_startGame  Start Game
    sleep  1s
Test Function: Check that game can start again
    Click element  id=id_button_startGame
    sleep  1s
    Page Should Contain  Waiting for other players
    sleep  1s
    Close All Browsers
Test Function: Host disconnected between game.
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Set Window Position  0  0
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player2
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Set Window Position  960  0
    Sleep  1s
    Switch browser  1
    Click element  id=id_button_startGame
    Sleep  2s
    Close browser
    Switch browser  2
    Click element  id=id_button_allIn
    Page Should Contain  The game is ended. (Host has left, everyone should leave the game)
    Sleep  2s
    Close browser