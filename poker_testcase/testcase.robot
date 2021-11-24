***Settings***
Library     Selenium2Library

***Variables***
${url}  http://localhost:5000/
${browser}  chrome

***comments***
--PASS--
Test: have players more than 6 (use enter to input name)
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Press Keys  //*[contains(text(),'Submit')]  Enter 
    Set Window Position  960  0
    Set Window Size  960  540
    Sleep  1s
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player2
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player3
    Press Keys  //*[contains(text(),'Submit')]  Enter
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player4
    Press Keys  //*[contains(text(),'Submit')]  Enter 
Test: have players more than 6 (use click on "Submit" button to input name)
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player5
    Click element  id=id_button_submitUsername
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player6
    Click element  id=id_button_submitUsername
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player7
    Click element  id=id_button_submitUsername
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player8
    Click element  id=id_button_submitUsername
    Switch browser  1
    Click element  id=id_button_startGame
    Alert Should be present  Player count must be between 2 - 6 players
    Sleep  5s
    Close All Browsers
***comments***
--Wait for test--
***Test Cases***
Test: enter name, open gamerules
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  player1
    Click element  id=id_button_submitUsername
    Sleep  1s
    Element Should Contain  id=id_text_playerName  player1
    Click Element  //*[contains(text(),'Game Rules')]
    Page Should Contain  The first player to join the game is host.
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
    Switch browser  1
    Click element  id=id_button_startGame
Test: player2 Check
    Switch browser  2
    Click element  id=id_button_check
    Alert Should be present  You can't check, you need to call or raise
Test: player1,2 Call
    Click element  id=id_button_call
    Switch browser  1
    Click element  id=id_button_call
    Alert Should be present  You need to check (not call).
    Click element  id=id_button_check
Test: player2 Raise, player1 Call
    Switch browser  2
    Input Text  id=id_input_raiseValue  150
    Click element  id=id_button_raise
    Switch browser  1
    Click element  id=id_button_call
Test: player2 All in, player1 Fold
    Switch browser  2
    Click element  id=id_button_allIn
    Switch browser  1
    Click element  id=id_button_fold
    Page Should Contain  The game is ended.
Test: Restart game, showing "Start game" button
    click element  id=id_button_restartGame
    sleep  1s
    Element Should Contain   id=id_button_startGame  Start Game
***comments***
This test case test success scenario: game can end and show the winner 
by using basic method(only call and check)   
--PASS--
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
