@ echo off
echo Connection to database...
echo.

rem get the path to the .env file
set "env_file=%~dp0..\..\.env"

rem Read the .env file variables
for /f "tokens=1,* delims==" %%a in ('type "%env_file%"') do set "%%a=%%b"

curl http://%IP_VM%:8080/clean-db-test
start cmd /k "artillery run ./test/artillery/virtualM/stock-group.yml --target http://%IP_VM%:8080"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM/stock-ungroup.yml --target http://%IP_VM%:8080"

curl http://%IP_VM%:8080/clean-db-test
start  cmd /k "artillery run ./test/artillery/virtualM/stock-changeloca.yml --target http://%IP_VM%:8080"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM/stock-changelocb.yml --target http://%IP_VM%:8080"

curl http://%IP_VM%:8080/clean-db-test
start cmd /k "artillery run ./test/artillery/virtualM/stock-create.yml --target http://%IP_VM%:8080"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM/stock-divide.yml --target http://%IP_VM%:8080"

curl http://%IP_VM%:8080/clean-db-test
start /WAIT cmd /k "artillery run ./test/artillery/virtualM/stock-update.yml --target http://%IP_VM%:8080"

curl http://%IP_VM%:8080/clean-db-test
start /WAIT cmd /k "artillery run ./test/artillery/virtualM/stock-get.yml --target http://%IP_VM%:8080"