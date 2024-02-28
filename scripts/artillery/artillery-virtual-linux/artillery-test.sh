#!/bin/bash

echo "Connection to database..."
echo

# Obtener la ruta del archivo .env
env_file="./.env"

# Leer las variables del archivo .env
while IFS= read -r line || [[ -n $line ]]; do
    export "$line"
done < "$env_file"

# Conexión a MySQL usando variables del archivo .env y ejecutar las declaraciones SQL
mysql -h localhost -u "$DB_USER" -p"$DB_PASSWORD" -D "$ARTILLERY_TEST_DB" -e "
    DELETE FROM register;
    DELETE FROM stock;
    DELETE FROM location;
    DELETE FROM unit;
    DELETE FROM product;
    INSERT INTO unit (id, code, description, base_unit) VALUES (1, 'UNIT01', 'descripcio de prova', 1);
    INSERT INTO product (id, code, description) VALUES (1, 'PRODUCT01', 'descripcio de prova');
    INSERT INTO location (id, code, description) VALUES (1, 'UBIC01', 'description 1'), (2, 'UBIC02', 'description 2');
    INSERT INTO stock (id, quantity, location_id, product_id, unit_id) VALUES (1, 55, 1, 1, 1), (2, 17, 2, 1, 1);
"

# Ejecutar los comandos Artillery en segundo plano
artillery run ./test/artillery/stock-changeloca.yml &
artillery run ./test/artillery/stock-changelocb.yml &