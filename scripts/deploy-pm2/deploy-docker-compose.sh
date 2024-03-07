#!/bin/bash
# Pujar aquest fitxer al servidor a on es vulgui desplegar i executar-lo
# <https://help.clouding.io/hc/es/articles/4408985454098-C%C3%B3mo-utilizar-la-llave-privada-para-acceder-por-SSH-PEM->
# Ex connexió ssh: ssh root@dirección_IP_del_servidor -i /ruta/ejemplo/default.pem
# Ex pujar fitxers: scp fitxer.tar root@dirección_IP_del_servidor:/ruta_servidor -i /ruta/ejemplo/default.pem
# CodeBiting - JDH 2022-12-08
# *****************************************************************************


printf "\n\nConfiguration data:"
#printf "\n Dades de connexió amb el GITHUB\n"
#read -p "  Usuari de GitHub: " githubUsername
#read -sp "  Contrasenya:" githubPassword
printf "\n Data for MySQL\n"
read -p "  User: " myuser
read -sp "  Root Password: " mypass
# Check if the enviroment variables are empty (no username or password)
#if [ -z "$myuser" ]; then
#  myuser=default
#  printf "\n -- No user entry\n  ---> DEFAULT USERNAME: default"
#fi
if [ -z "$mypass" ]; then
  mypass=mypass123
  printf "\n -- No password entry.\n  ---> DEFAULT PASSWORD: Mypass123"
fi
# Export values for MySQL docker image
# export MYSQL_USER=myuser
export MYSQL_ROOT_PASSWORD=mypass
export MYSQL_USER=myuser
printf "\n** GET PROJECT REPOSITORY **\n"
sudo mkdir -p /home/root
cd /home/root
sudo git clone https://github.com/Batr0s/multi-tenant-app.git
cd multi-tenant-app/

printf "\n** CREATE/MODIFY CONFIGURATION DB **\n"
# Create the .env file with environtment variables 
touch .env 
sudo bash -c 'echo "DB_HOST='mysql'" > .env'
sudo bash -c 'echo "DB_USER='$myuser'" >> .env'
sudo bash -c 'echo "DB_PASSWORD='$mypass'" >> .env'
sudo bash -c 'echo "DB_DATABASE='tenants_app'" >> .env'
sudo bash -c 'echo "ARTILLERY_TEST_DB='db_test'" >> .env'
sudo bash -c 'echo "DB_USER_TEST='user_test'" >> .env'
sudo bash -c 'echo "DB_PASSWORD_TEST='root'" >> .env'
sudo bash -c 'echo "DB_HOST_TEST='%'" >> .env'
sudo bash -c 'echo "MANDRILL_KEY=''" >> .env'
sudo bash -c 'echo "CRYPTO_KEY='1qazxsw23edcvfr45tgbnhy67ujmki89'" >> .env'
sudo bash -c 'echo "CRYPTO_IV='1qazxsw23edcvfr4'" >> .env'
sudo bash -c 'echo "CRYPTO_ALG='aes-256-cbc'" >> .env'

# --------------------------------------------------------------------------------------------------------
# DB_User password
sed -i "s/mypass123/'$mypass'/g" docker-compose.yml

# Give permissions to "MYSQL_USER"
#docker-compose 
echo "GRANT ALL PRIVILEGES ON cargo_loading.* TO '$myuser'@'localhost' WITH GRANT OPTION;" >> scripts/db/db_creation.sql

# Install docker-compose
printf "\n** Installation docker-compose **\n"
sudo apt update -y
sudo apt install docker-compose -y

printf "\n** Creating SSL **\n"
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./cert.key -out ./cert.crt

printf "\n** Building/Starting docker-compose **\n"
docker-compose up -d
docker-compose
printf "\n*** END ***\n"