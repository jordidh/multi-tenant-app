const express = require('express');
const router = express.Router();
const tenant = require('../api/tenant');
const logger = require('../api/logger');
// Load .env file to process.env variables
require('dotenv').config();
const mailchimpClient = require('@mailchimp/mailchimp_transactional')(process.env.MANDRILL_KEY);

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'nu+warehouses' });
});

router.get('/login', function (req, res, next) {
    res.render('login', { title: 'nu+warehouses' });
});

router.post('/login', async function (req, res, next) {
    console.log(`${(new Date()).toISOString()} - [POST]/of/ received ${JSON.stringify(req.body)}`);

    const loginResult = await tenant.loginDb(req.body.username, req.body.password);
    if (loginResult.errors.length > 0) {
        res.render('login', { title: 'nu+warehouses', message: { type: 'error', text: `${loginResult.data}: ${loginResult.errors[0].message}` } });
    }
    const accessToken = loginResult.data.accessToken;
    const refreshToken = loginResult.data.refreshToken;
    // const conn = loginResult.data.conn;
    res.render('tenant', { title: 'nu+warehouses', accessToken, refreshToken });
});

router.get('/register', function (req, res, next) {
    res.render('register', { title: 'nu+warehouses', PATTERN_PASSWORD: tenant.PATTERN_PASSWORD, PASSNOTEQUAL: tenant.PASSNOTEQUAL, ERRORPATTERNPASS: tenant.ERRORPATTERNPASS });
});

/**
 * POST /register : Register a new tenant, a new organization and a new user
 * @param {*} req : req.body contains the following attributes:
 *  {"firstname":"","lastname":"","username":"","password1":"","password2":"","email":"","organization":"","vatnumber":"","country":"","city":"","zipcode":"","address":"","submitCode":"Register"}
 * @param {*} res
 * @param {*} next
 */
router.post('/register', async function (req, res, next) {
    console.log(`${(new Date()).toISOString()} - [POST]/of/ received ${JSON.stringify(req.body)}`);

    // Check passwords are equal
    if (req.body.password1 !== req.body.password2) {
        logger.error(tenant.PASSNOTEQUAL);
        res.render('register', { title: 'nu+warehouses', message: { type: 'error', text: tenant.PASSNOTEQUAL } });
        return;
    }
    // Check passwords match minimum requirements
    if (tenant.isValidPassword(req.body.password1) === false) {
        logger.error(tenant.ERRORPATTERNPASS);
        res.render('register', { title: 'nu+warehouses', message: { type: 'error', text: tenant.ERRORPATTERNPASS } });
        return;
    }

    // Parse req.body to organization and user objects
    const organization = {
        name: req.body.organization,
        vat_number: req.body.vatnumber,
        country: req.body.country,
        city: req.body.city,
        zipcode: req.body.zipcode,
        address: req.body.address
    };
    const user = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        password1: req.body.password1,
        email: req.body.email
    };

    // Creation of the activation link
    const creationResult = await tenant.createTenant(organization, user);
    if (creationResult.errors && creationResult.errors.length > 0) {
        res.render('register', { title: 'nu+warehouses', message: { type: 'error', text: `${creationResult.data}: ${creationResult.errors[0].message}` } });
        return;
    }
    console.log('Link d"activació:' + creationResult.data.activationLink);

    // mailchimp message structure to send the activation link to the user mail.
    const response = await mailchimpClient.messages.send({
        message: {
            subject: 'Activate your account',
            html: `<h2>Click on the link below to activate your account</h2>
                    <p><a href="http://localhost:3000${creationResult.data.activationLink}">
                    Click here to activate your account</a></p>`,
            from_email: 'support@codebiting.com',
            to: [{
                email: user.email
            }
            ]
        }
    });
    console.log(response);
    if (response && response.response && response.response.status !== 200) {
        res.render('register', { message: { type: 'error', text: `${response.response.statusText}` } });
    } else {
        res.render('activate', { userEmail: user.email });
    }
    res.render('activate', { userEmail: user.email });
});

router.get('/activate', async function (req, res, next) {
    try {
        if (req.query.tenant && req.query.user && req.query.code) {
            const userActivation = await tenant.activateAccount(req.query.tenant, req.query.user, req.query.code);
            if (userActivation) {
                res.render('login', { title: 'nu+warehouses', message: { type: 'ok', text: 'Your account has been activated and the organization data base created.' } });
            } else {
                throw new Error('Error during activation');
            }
        } else {
            throw new Error('No activation link in the URL');
        }
    } catch (e) {
        console.log(`${new Date().toISOString()} - [POST]/of/ received ${JSON.stringify(req.query)}`);
        // {"tenant":"2yr1jbwflnggbxcx","user":"1","code":"oLFgy/vM3B-Sk%22:$_q%p"}
        res.render('activate', { title: 'nu+warehouses' });
    }
});

router.get('/account', function (req, res, next) {
    res.render('account', { title: 'nu+warehouses' });
});

module.exports = router;
