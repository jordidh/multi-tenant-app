#!/bin/bash
# Pujar aquest fitxer al servidor a on es vulgui desplegar i executar-lo
# <https://help.clouding.io/hc/es/articles/4408985454098-C%C3%B3mo-utilizar-la-llave-privada-para-acceder-por-SSH-PEM->
# Ex connexió ssh: ssh root@dirección_IP_del_servidor -i /ruta/ejemplo/default.pem
# Ex pujar fitxers: scp fitxer.tar root@dirección_IP_del_servidor:/ruta_servidor -i /ruta/ejemplo/default.pem
# CodeBiting - JDH 2022-12-08
# *****************************************************************************
# scp scripts/deploypm2/deploy-clouding-pm2.sh acandela@10.0.2.6:/home/acandela

printf "\n\n Recollim dades per fer la configuració"
#printf "\n Dades de connexió amb el GITHUB\n"
#read -p "  Usuari de GitHub: " githubUsername
#read -sp "  Contrasenya:" githubPassword
printf "\n Dades de connexió amb MySQL\n"
read -p "  Usuari de BD MySql: " mysqlUsername
read -sp "  Contrasenya:" mysqlPassword

printf "\n*** PAS 1: Configuració de la màquina i el S.O.\n"

printf "\n --> Creem les carpetes destí si no existeixen\n"
# Note that this will also create any intermediate directories that don't exist; for instance,
# will create directories foo, foo/bar, and foo/bar/baz if they don't exist.
sudo mkdir -p /home/root/multitenant

printf "\n --> Configurem PERL per que no aparegui l'error 'warning: Falling back to a fallback locale'\n"
sudo locale-gen ca_ES.UTF-8 
sudo dpkg-reconfigure locales

printf "\n --> Configurem el timezone\n"
timedatectl status
timedatectl set-timezone Europe/Andorra

printf "\n --> Desactivem les actualitzacions de Ubuntu per evitar trencar dependències"
systemctl stop packagekit
systemctl disable packagekit

# PAS 0: Instal·lem els serveis bàsics a sobre de la imatge de ubuntu-20.04 LTS de google
printf "\n*** PAS 2: Instal·lació dels serveis bàsics a sobre de la imatge de ubuntu-20.04 LTS de google\n"

# Git: no cal instal·lar git, ja està preinstal·lat

# NODE:
# Retrieve the installation script for your preferred version: https://github.com/nodesource/distributions/blob/master/README.md
printf "\n Instal·lació de NODE"
cd ~
# Node.js LTS (v16.x). The nodejs package contains both the node and npm binaries
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

# PM2
printf "\n Instal·lació de PM2"
sudo npm install pm2 -g
pm2 completion install
pm2 install pm2-logrotate

# MySQL 8
printf "\n Instal·lació de MySQL"
sudo apt update
sudo apt install mysql-server -y

# No instalem mysql_secure_installation ja que no li pots dir que no vols instal·lar el pluguin de validació de passwords,
# posis el que psisi l'instal·la. Quan s'instal·la s'ha de canviar l'usuari root per que tingui contrasenya, sinó s'entra
# en un bucle infinit.
#
# En la versió 8, per defecte, no hi ha usuaris anònims
# En la versió 8, per defecte, no hi ha usuaris amb accés remot
# En la versió 8, per defecte, no hi ha bases de dades de test

printf "\n - Enable mysql remote access"
printf "\n - sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf"
printf "\n - bind-address   = 0.0.0.0"
printf "\n - sudo systemctl restart mysql"
# Find and replace text within a file using commands:
# sed = Stream EDitor
# -i = in-place (i.e. save back to the original file)
# The command string:
#   s = the substitute command
#   original = a regular expression describing the word to replace (or just the word itself)
#   new = the text to replace it with
#   g = global (i.e. replace all and not just the first occurrence)
# file.txt = the file name
sudo sed -i 's/127.0.0.1/0.0.0.0/g' /etc/mysql/mysql.conf.d/mysqld.cnf
# Afegim nous paràmetres al fitxer de configuració de mysql
# Here you can see queries with especially long duration
sudo bash -c 'echo "" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "# Custom Parameters" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "slow_query_log = 1" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "slow_query_log_file = /var/log/mysql/mysql-slow.log" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "long_query_time = 2" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
# Posem el character set
sudo bash -c 'echo "character-set-client-handshake = FALSE" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "character-set-server = utf8mb4" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "collation-server = utf8mb4_unicode_ci" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
# Posem el timeout de connexions en mode SLEEP a 600
sudo bash -c 'echo "wait_timeout = 600" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
sudo bash -c 'echo "max_allowed_packet = 64M" >> /etc/mysql/mysql.conf.d/mysqld.cnf'
# Augmentar el màxmim numero de connexions a 512
sudo bash -c 'echo "max_connections = 512" >> /etc/mysql/mysql.conf.d/mysqld.cnf'

sudo systemctl restart mysql
# Testejar que tot funciona correctament
#sudo systemctl status mysql.service
sudo mysqladmin version

# Revisem que els usuaris tinguin els pluguins correctes
#sudo mysql -e "SELECT User, Host, plugin FROM mysql.user;"
#printf "\n MySQL instalada. Verifica que l'usuari root té el plugin d'autenticació auth_socket, per poder crear i instal·lar totes les BD. Continua? (s/n) "
#read continua
#if [[ $continua != "s" ]] 
#then
#    exit 0
#fi


# Creem els usuaris dela BD amb el que es treballarà
# Executem sense usuari no contrasenya ja que per defecte root no en té
sudo mysql -e "CREATE USER '$mysqlUsername'@'localhost' IDENTIFIED WITH mysql_native_password BY '$mysqlPassword';"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO '$mysqlUsername'@'localhost' WITH GRANT OPTION;"
sudo mysql -e "FLUSH PRIVILEGES;"

# Mostrem tots els usuaris creats
sudo mysql -e "SELECT User, Host, plugin FROM mysql.user;"

# Percona XtraBackup
printf "\n Instal·lació de Percona XtraBackup"
wget https://repo.percona.com/apt/percona-release_latest.$(lsb_release -sc)_all.deb
sudo dpkg -i percona-release_latest.$(lsb_release -sc)_all.deb
sudo apt-get update
sudo apt update
sudo apt install percona-xtrabackup-80 -y
sudo apt install qpress -y
sudo apt install zstd -y

printf "\n*** PAS 2: Per cada aplicació, descarreguem el projecte de GitHub a dins del host (contenen un fitxer Dockerfile i .dockerignore que copia el projecte a dins del contenidor)\n"

printf "\n --> Descarreguem de github el projecte del ONION\n"
#git clone https://$githubUsername:$githubPassword@github.com/CodeBiting/XXXXXX.git
cd /home/root/multitenant/
sudo git clone https://github.com/Batr0s/multi-tenant-app.git
cd /home/root/multitenant/multi-tenant-app
printf "\n Creem el fitxer de configuració del projecte\n"
sudo touch .env 
sudo bash -c 'echo "DB_HOST='127.0.0.1'" > .env'
sudo bash -c 'echo "DB_USER='$mysqlUsername'" >> .env' 
sudo bash -c 'echo "DB_PASSWORD='$mysqlPassword'" >> .env'

printf "\n*** PAS 3: Instal·lació de dependències\n"

printf "\n -->Instal·lem les dependències de multi-tenant-app\n"
sudo npm install

printf "\n*** PAS 4: Instal·lació de NGINX\n"

printf "\nInstal·lem NGINX\n"
# MÈTODE 1
# Crearem certificats autosignats a: /etc/nginx
# Modificarem la configuració default de nginx de: /etc/nginx/sites-available/default

# Install Niginx
# ==============
# Update your package lists and install Nginx:
sudo apt update
# Install Nginx
sudo apt install nginx -y
sudo ufw status
# systemctl status nginx
nginx -v

# Get a Certificate
# =================
# Next, you will need to purchase or create an SSL certificate. These commands are for a self-signed certificate, but you should get an officially signed certificate if you want to avoid browser warnings.
# Move into the proper directory and generate a certificate:
cd /etc/nginx
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/cert.key -out /etc/nginx/cert.crt
# You will be prompted to enter some information about the certificate. You can fill this out however you’d like; just be aware the information will be visible in the certificate properties. We’ve set the number of bits to 2048 since that’s the minimum needed to get it signed by a CA. If you want to get the certificate signed, you will need to create a CSR.

# Creem el fitxer d'autenticació bàsica
#printf "\n --> Creem el fitxer amb els usuaris d'autenticació bàsica amb les OpenSSL utilities\n"
#sudo sh -c "echo -n 'UUUUUUUUUUUUUUUUUU:' >> /etc/nginx/conf.d/.htpasswd"
#sudo sh -c "openssl passwd -apr1 \"PPPPPPPPPPPPPPPPP\" >> /etc/nginx/conf.d/.htpasswd"

# Configure nginx
# ===============
# Override the configuration of: /etc/nginx/sites-available/default
sudo cp /home/root/multitenant/multi-tenant-app/scripts/deploy-pm2/nginx-default /etc/nginx/sites-available/default

# Test and apply changes: 
sudo nginx -t
#printf "\nNginx configurat correctament? (s/n) "
#read execute
#if [[ $execute != "s" ]] 
#then
#    exit 0
#fi

sudo systemctl restart nginx

printf "\n*** PAS 5: Creació de la BD i els usuaris de BD\n"
# Executem al contenidor de la BD la importació del script que es troba al projecte descarregat de github del host
#printf "\n --> Creem les BD\n"
#printf "\n --> Esperem uns segons que el contenidor amb la BD estigui funcionant\n"
#sleep 30
printf "\n --> Creem la BD pel servei\n"
# Creem la BD i donem permisos a l'usuari onion
# Per defecte creem el charset utf8mb4 que té com a default collation utf8mb4_0900_ai_ci (afecta a temes de cerca: ai=accent insensitive, ci=case insensitive)
# només fem servir la opció -i (interactive) però no la (-t) de input device. Contrassenya sense $ ja que sinó no crea la contrasenya correctament
sudo mysql -e "CREATE SCHEMA cargo_loading DEFAULT CHARACTER SET utf8mb4;"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO '$mysqlUsername'@'localhost' WITH GRANT OPTION;"
#printf "\n --> Importem un dump amb el clientID ja establert per l'Onion. Aquesta BD ha de ser diferent per cada client\n"
# NOTA: Aquesta importació no acaba de funcionar, quan onion s'hi connecta falla
# S'executa amb l'usuari onion per tenir permisos
#mysql < /var/lib/onion/apps-conf/onion/cbwms-dump-v16.114.sql
sudo mysql < /home/root/multitenant/multi-tenant-app/scripts/db/db_creation.sql


printf "\n*** PAS 6: Creem els serveis al pm2\n"
cd /home/root/multitenant/multi-tenant-app
# Creem el servei pm2
NODE_ENV=production PORT=3000 pm2 start ./bin/www --name MultitenantApp --max-memory-restart 1G
pm2 save
pm2 startup


printf "\n*** FI ***\n"