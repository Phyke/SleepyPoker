***Settings***
Library     Selenium2Library

***Variables***
${url}  http://localhost:5000/
${browser}  chrome

***comments***
ยังไม่ได้แก้
Test: enter name, open gamerules
    Open browser  ${url}  ${browser}
    Input Text Into Alert  user0
    Page Should Contain  Your name: user0
    Click Element  //*[contains(text(),'Game Rules')]
    Page Should Contain  First player is the host who can start the game.
    Click element  //*[contains(text(),'Close')]
Test: startgame
    Click element  id=id_button_startGame
    Page Should Contain  Action
    Page Should Contain  Now is your turn!!!
Test: call
    Click element  id=id_button_call
    Alert should be present  You need to check (not call).
Test: check
    Click element  id=id_button_check
    Page Should Contain  Player 0 : Check
    Click element  id=id_button_check
    Page Should Contain  Player 0 : Check
    Page Should Contain  The game is ended.
    Close browser
Test: fold
    Open browser  ${url}  ${browser}
    Input Text Into Alert  user0
    Page Should Contain  Your name: user0
    Click element  id=id_button_startGame
    Click element  id=id_button_fold
    Page Should Contain  Waiting for other players
    Close browser
***Test Cases***
Init all user position
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user0
    Click element  id=id_button_submitUsername
    Set Window Position  0  0
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user1
    Click element  id=id_button_submitUsername
    Set Window Position  960  0
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user2
    Click element  id=id_button_submitUsername
    Set Window Position  0  540
    Set Window Size  960  540
    Open browser  ${url}  ${browser}
    Input Text  id=id_input_username  user3
    Click element  id=id_button_submitUsername
    Set Window Position  960  540
    Set Window Size  960  540
Test success case: Startgame
    Switch browser  1
    Click element  id=id_button_startGame
Test success case: Call
    switch browser  4
    Click element  id=id_button_call
    switch browser  1
    Click element  id=id_button_call
    switch browser  2
    Click element  id=id_button_call
Test success case: Check
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
Test success case: Game ended -> close browser
    Switch browser  1
    Page Should Contain  The game is ended.
    Close browser
    Switch browser  2
    Page Should Contain  The game is ended.
    Close browser
    Switch browser  3
    Page Should Contain  The game is ended.
    Close browser
    Switch browser  4
    Page Should Contain  The game is ended.
    Close browser

