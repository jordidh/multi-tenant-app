#!/bin/bash

echo "Connection to database..."
echo

# Obtener la ruta al archivo .env
env_file="../../.env"

# Leer las variables del archivo .env
while IFS="=" read -r key value; do
  export "$key=$value"
done < "$env_file"

# Conexión a MySQL usando variables de .env y ejecutar las declaraciones
sudo -S docker exec -i multi-tenant-app_mysql_1 mysql -u "$DB_USER_TEST" -p"$DB_PASSWORD_TEST" -D "$DB_DATABASE_TEST" -e "
DELETE FROM register;
DELETE FROM stock;
DELETE FROM location;
DELETE FROM unit;
DELETE FROM product;
INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01', 'descripcio de prova1', 1), (2, 'UNIT02', 'descripcio de prova', 10);
INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01', 'descripcio de prova');
INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2');
INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);
"