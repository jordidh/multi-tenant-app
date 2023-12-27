const express = require('express');
const router = express.Router();
const tenant = require('../api/tenant');
const logger = require('../api/logger');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'nu+warehouses' });
});

router.get('/login', function (req, res, next) {
    res.render('login', { title: 'nu+warehouses' });
});

router.post('/login', function (req, res, next) {
    console.log(`${(new Date()).toISOString()} - [POST]/of/ received ${JSON.stringify(req.body)}`);
    // {"username":"","user":"","submitCode":"Login"}

    res.render('login', { title: 'nu+warehouses' });
});

router.get('/register', function (req, res, next) {
    res.render('register', { title: 'nu+warehouses', patternPassword: tenant.PATTERN_PASSWORD });
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
        logger.error('Password error');
        res.render('register', { show: 'visible', message: { type: 'error', text: 'Passwords are not equal' } });
        return;
    }
    // Check passwords match minimum requirements
    if (tenant.isValidPassword(req.body.password1) === false) {
        logger.error('Password error');
        res.render('register', { show: 'visible', message: { type: 'error', text: 'Error the password must have: 8 characters, one lowercase letter, one uppercase letter, one digit and one character: @$!%*#?&^' } });
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

    const creationResult = await tenant.createTenant(organization, user);
    if (creationResult.errors && creationResult.errors.length > 0) {
        res.render('error', { message: `${creationResult.data}: ${creationResult.errors[0].message}`, error: {} });
        return;
    }

    res.render('activate', { activationLink: creationResult.data.activationLink });
});

router.get('/activate', async function (req, res, next) {
    try {
        if (req.query.tenant && req.query.user && req.query.code) {
            const userActivation = await tenant.activateAccount(req.query.tenant, req.query.user, req.query.code);
            if (userActivation) {
                res.render('login', { title: 'nu+warehouses', activated: true });
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
