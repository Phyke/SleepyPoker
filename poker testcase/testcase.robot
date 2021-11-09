***Settings***
Library     Selenium2Library

***Variables***
${url}  http://localhost:5000/
${browser}  chrome

***Test Cases***
๊User0 Hua_hong init
    Open browser  ${url}  ${browser}
    Input Text Into Alert  user0
    Click element  id=id_button_startGame
    Page Should Contain  Choose Your action :
    Click element  id=id_button_call
    Alert should be present  You need to check (not call).
***comments***
User1
    Open browser  ${url}  ${browser}
User2
    Open browser  ${url}  ${browser}
User3
    Open browser  ${url}  ${browser}
    
