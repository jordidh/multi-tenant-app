@ echo off
echo Connection to database...
echo.

rem get the path to the .env file
set "env_file=%~dp0..\..\.env"

rem Read the .env file variables
for /f "tokens=1,* delims==" %%a in ('type "%env_file%"') do set "%%a=%%b"

curl http://localhost:3000/clean-db-test
start cmd /k "artillery run ./test/artillery/local/stock-group.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-ungroup.yml"

curl http://localhost:3000/clean-db-test
start  cmd /k "artillery run ./test/artillery/local/stock-changeloca.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-changelocb.yml"

curl http://localhost:3000/clean-db-test
start cmd /k "artillery run ./test/artillery/local/stock-create.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-divide.yml"

curl http://localhost:3000/clean-db-test
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-update.yml"

curl http://localhost:3000/clean-db-test
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-get.yml"