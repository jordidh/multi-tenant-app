@ echo off
echo Connection to database...
echo.

rem get the path to the .env file
set "env_file=%~dp0..\..\.env"

rem Read the .env file variables
for /f "tokens=1,* delims==" %%a in ('type "%env_file%"') do set "%%a=%%b"

rem Connection to mysql using .env variables and execute the statements
mysql -h localhost -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product;^
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova1', 1), (2, 'UNIT02' ,'descripcio de prova', 10);^
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova');^
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start cmd /k "artillery run ./test/artillery/local/stock-group.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-ungroup.yml"

rem Connection to mysql using .env variables and execute the statements
mysql -h localhost -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product;^
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova', 1), (2, 'UNIT02' ,'descripcio de prova', 10);^
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova');^
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start  cmd /k "artillery run ./test/artillery/local/stock-changeloca.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-changelocb.yml"

rem Connection to mysql using .env variables and execute the statements
mysql -h localhost -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product;^
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova', 1), (2, 'UNIT02' ,'descripcio de prova', 10);^
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova');^
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start cmd /k "artillery run ./test/artillery/local/stock-create.yml"
start /WAIT cmd /k "artillery run ./test/artillery/local/stock-divide.yml"

rem Connection to mysql using .env variables and execute the statements
mysql -h localhost -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product;^
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova', 1), (2, 'UNIT02' ,'descripcio de prova', 10);^
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova');^
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start /WAIT cmd /k "artillery run ./test/artillery/local/stock-update.yml"

rem Connection to mysql using .env variables and execute the statements
mysql -h localhost -u %DB_USER_TEST% -p%DB_PASSWORD_TEST% -D %DB_DATABASE_TEST% -e ^
"DELETE FROM register; DELETE FROM stock; DELETE FROM location; DELETE FROM unit; DELETE FROM product;^
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01' ,'descripcio de prova', 1), (2, 'UNIT02' ,'descripcio de prova', 10);^
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01' ,'descripcio de prova');^
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2'); ^
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);"

start /WAIT cmd /k "artillery run ./test/artillery/local/stock-get.yml"