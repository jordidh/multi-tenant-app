@REM httpss://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/

@ echo off
echo Connection to database...
echo.

rem get the path to the .env file
set "env_file=%~dp0..\..\.env"

rem Read the .env file variables
for /f "tokens=1,* delims==" %%a in ('type "%env_file%"') do set "%%a=%%b"

curl https://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/clean-db-test
echo.
start cmd /k "artillery run ./test/artillery/cloudrun/stock-group.yml"
start /WAIT cmd /k "artillery run ./test/artillery/cloudrun/stock-ungroup.yml"

curl https://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/clean-db-test
echo.
start  cmd /k "artillery run ./test/artillery/cloudrun/stock-changeloca.yml"
start /WAIT cmd /k "artillery run ./test/artillery/cloudrun/stock-changelocb.yml"

curl https://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/clean-db-test
echo.
start cmd /k "artillery run ./test/artillery/cloudrun/stock-create.yml"
start /WAIT cmd /k "artillery run ./test/artillery/cloudrun/stock-divide.yml"

curl https://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/clean-db-test
echo.
start /WAIT cmd /k "artillery run ./test/artillery/cloudrun/stock-update.yml"

curl https://multi-tenant-app-zmcwk2fdmq-lz.a.run.app/clean-db-test
echo.
start /WAIT cmd /k "artillery run ./test/artillery/cloudrun/stock-get.yml"