# Partim d’una imatge mínima de node 18.12.1 LTS https://hub.docker.com/_/node
FROM node:lts-alpine
# Indicar el creador
LABEL maintainer="Codebiting - JDH"
# Instalem wget
RUN apk update && apk add wget
# Creem un directori per l'aplicacio i descarreguem el projecte
RUN mkdir -p /usr/src/app
# Establim el directori de treball
WORKDIR /usr/src/app
# Copiem el nostre projecte a dins del contenidor
COPY ./ /usr/src/app/
RUN ls -l /usr/src/app
# Eliminem el directori node_modules per solucionar problema d'incompatibilitat amb la biblioteca bcrypt. (npm install l'instal·la sense problemes)
RUN rm -rf node_modules
# Instal·lem les depencencies. Si les instal·lem per produccio fer: npmci --only=production
RUN npm install --production
# Exposem el port de l'aplicacio
EXPOSE 3000
# Definim la comanda per executar l'aplicacio
CMD ["node", "bin/www"]