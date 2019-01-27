@echo off

:main
cls
supervisor -e .js,.json,.sqlite -w bot.js,strings.json,config.json,help.js -n success bot.js
pause
set /p yn=Would you like to restart?
if %yn%==y goto main
if %yn%==no exit