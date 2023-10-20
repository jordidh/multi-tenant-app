# multi-tenant-app

Exemple d'aplicació multi tenant

## Referencies

<https://www.clickittech.com/saas/multi-tenant-node-js/>
<https://blog.lftechnology.com/designing-a-secure-and-scalable-multi-tenant-application-on-node-js-15ae13dda778>

## Configuració de l'entorn de treball

Creem un projecte nou a GitHub i el clonem en local

Instal·lem Nodejs 18 o superior

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source ~/.bashrc
nvm install v18.14.2
nvm list

node -v
npm -v
```

Instal·lem el express-generator i creem l'esquelet del projecte

```bash
cd <nom-projecte>
npm install -g express-generator
express -v pug
```

Instal·lem mocha, chai i cypress

```bash
npm install --save-dev mocha chai chai-http dirty-chai cypress
```

Instal·lem i configurem eslintrc

```bash
npm init @eslint/config
# Choose:
# To check syntax, find problems, and enforce code style
# What type of modules does your project use? CommonJS (require/exports)
# Which framework does your project use? None of these
# Does your project use TypeScript? No
# Where does your code run? Node
# Use a popular style guide Standard: https://github.com/standard/standard
# What format do you want your config file to be in? JavaScript
# Which package manager do you want to use? npm

# Add rules to file .eslintrc.js
#    // Use 4 space identation to get the code more compact
#    // In switch-case ident case https://eslint.org/docs/latest/rules/indent#switchcase
#    indent: ['error', 4, { SwitchCase: 1 }],
#    // Use semicolons to make the code easier to read
#    semi: ['error', 'always']
```

Instal·lem i configurem per fer serrvir el hook pre-commit de git

```bash
npm install pre-commit --save-dev

```

Afegim al fitxer package.json els tests que haurà d'executar el pre-commit

```json
  "scripts": {
    "start": "node ./bin/www",
    "test": "node ./node_modules/mocha/bin/mocha",
    "test-apis": "node ./node_modules/mocha/bin/mocha ./test/api/",
    "test-routes": "node ./bin/www & P1=$! && sleep 2 && node ./node_modules/mocha/bin/mocha ./test/routes/v1/ && kill $P1",
    "test-eslint": "node ./node_modules/.bin/eslint app.js bin/www api/*.js routes/*.js"
  },
  "pre-commit": [
    "test-apis",
    "test-routes",
    "test-eslint"
  ],
```

Analitzem i corregim l'estil dels fitxers javascript que tenim ara

```bash
node ./node_modules/.bin/eslint app.js
node ./node_modules/.bin/eslint app.js --fix
node ./node_modules/.bin/eslint bin/www --fix
node ./node_modules/.bin/eslint .eslintrc.js --fix
```

Instal·lem winston per deixar logs i configurem el logger

```bash
npm install --save winston
```

Creem el fitxer amb el logger a `api/logger.js` amb el contingut:

```javascript
const { createLogger, format, transports } = require('winston');

const level = process.env.LOG_LEVEL || 'debug';
const clientName = process.env.CLIENT_CODE || 'TEST_CLIENT';
const serviceName = process.env.SERVICE_CODE || 'cargo-loading-service';

function formatParams (info) {
  const { timestamp, level, message, ...args } = info;

  return `${timestamp} ${level}: ${message} ${Object.keys(args).length
    ? JSON.stringify(args, '', '')
    : ''}`;
}

const developmentFormat = format.combine(
  format.colorize(), // Indiquem que volem colors
  format.timestamp(),
  format.align(),
  format.printf(formatParams)
);

const productionFormat = format.combine(
  format.timestamp(),
  format.align(),
  format.printf(formatParams),
  format.json()
);

let logger;

const transportsCustom = [
  // Allow the use the console to print the messages => PM2 and Docker saves to file
  new transports.Console()
  // Allow to print all the error level messages inside the error.log file
  // new transports.File({ filename: 'logs/error.log', level: 'error' }),
  // Allow to print all the error message inside the all.log file
  // (also the error log that are also printed inside the error.log(
  // new transports.File({ filename: 'logs/all.log' }),
];

if (process.env.NODE_ENV !== 'production') {
  logger = createLogger({
    level,
    format: developmentFormat,
    // transports: [new transports.Console()]
    transports: transportsCustom
  });
} else {
  logger = createLogger({
    level,
    format: productionFormat,
    // En entorn de producció indiquem el servei i el client
    defaultMeta: {
      service: serviceName,
      client: clientName
    },
    transports: transportsCustom
  });
}
module.exports = logger;
```

Modifiquem el fitxer `app.js` per deixar de fer servir el logger anterior i fer servir el nou

Instal·lem el `dotenv` per afagar les variables d'entorn

```bash
npm install --save dotenv
```

Creem el fitxer de configuració `.env` i `env.example`

## Funcionalitat de l'aplicació

Es vol desenvolupar una web [multitenant](https://en.wikipedia.org/wiki/Multitenancy) a on cada tenant tindrà les dades en una base de dades pròpia separada dels altres tenants.

### Escenaris

#### Registre del primer usuari i creació del tenant

Quan es vulgui començar a treballar amb l'aplicació ha de crear un usuari i una organització a la que pertanyerà l'usuari. Per aixo ha de fer:

1. L'usuari (serà l'usuari administrador del tenant) ha de poder registrar-se a la web amb nom d'usuari i contrasenya i indicar a quina organització pertany. Les dades han de ser correctes: el nom d'usuari, email i organització han de ser únics.
2. Per verificar que l'adreça de correu és vàlida i l'usuari hi té accés s'ha d'enviar un email amb un enllaç amb un codi d'activació amb un temps de validesa limitat.
3. Quan l'usuari obri el correu i clicki sobre l'enllaç amb el codi d'activació, s'ha de verificar que aquest codi existeix i és vàlid i crear una base de dades específica per aquest tenant (usuari i organització) amb les dades inicials.
4. El nou usuari ja podrà fer login a l'aplicació i haurà de poder veure les dades particulars de la seva organització.

#### Registre d'usuaris addicionals al tenant

L'usuari administrador del tenant ha de poder donar d'alta nous usuaris (nom d'usuari i email) que puguin accedir a l'organització. Per aixó ha de fer:

1. Accedir a la pantalla de registre d'usuaris.
2. Prémer sobre el botó de crear un nou usuari.
3. Introduïr les dades del nou usuari (email i nom d'usuari han de ser únics).
4. S'enviarà un email d'invitació i activació de l'usuari amb un enllaç a l'aplicació amb una període de validesa limitada..
5. Quan el nou usuari prémi l'enllaç del email s'activarà l'usuari.
6. El nou usuari ja podrà fer login a l'aplicació i haurà de poder veure les dades particulars de la seva organització.
