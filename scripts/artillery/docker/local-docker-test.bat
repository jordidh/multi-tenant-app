@ echo off
echo Connection to database...
echo.

rem get the path to the .env file
set "env_file=%~dp0..\..\..\.env"

rem Read the .env file variables
for /f "tokens=1,* delims==" %%a in ('type "%env_file%"') do set "%%a=%%b"

rem Connection to mysql using .env variables and execute the statements
docker exec -i multi-tenant-app-mysql-1 mysql -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product; ^
 INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10); ^
 INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'); ^
 INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
 INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start cmd /k "artillery run ./test/artillery/virtualM-docker/stock-group.yml --target http://localhost:3000"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM-docker/stock-ungroup.yml --target http://localhost:3000"

rem Connection to mysql using .env variables and execute the statements
docker exec -i multi-tenant-app-mysql-1 mysql -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product; ^
 INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10); ^
 INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'); ^
 INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
 INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start cmd /k "artillery run ./test/artillery/virtualM-docker/stock-create.yml --target http://localhost:3000"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM-docker/stock-divide.yml --target http://localhost:3000"

rem Connection to mysql using .env variables and execute the statements
docker exec -i multi-tenant-app-mysql-1 mysql -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product; ^
 INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10); ^
 INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'); ^
 INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
 INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start  cmd /k "artillery run ./test/artillery/virtualM-docker/stock-changeloca.yml --target http://localhost:3000"
start /WAIT cmd /k "artillery run ./test/artillery/virtualM-docker/stock-changelocb.yml --target http://localhost:3000"

rem Connection to mysql using .env variables and execute the statements
docker exec -i multi-tenant-app-mysql-1 mysql -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product; ^
 INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10); ^
 INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'); ^
 INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
 INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start /WAIT cmd /k "artillery run ./test/artillery/virtualM-docker/stock-update.yml --target http://localhost:3000"

rem Connection to mysql using .env variables and execute the statements
docker exec -i multi-tenant-app-mysql-1 mysql -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product; ^
 INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10); ^
 INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova'); ^
 INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
 INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start /WAIT cmd /k "artillery run ./test/artillery/virtualM-docker/stock-get.yml --target http://localhost:3000"