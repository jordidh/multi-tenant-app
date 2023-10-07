const express = require('express');
const router = express.Router();
const tenant = require('../api/tenant');

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
    res.render('register', { title: 'nu+warehouses' });
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
        res.render('error', { message: 'Passwords are not equal', error: {} });
        return;
    }
    // Check passwords match minimum requirements
    if (tenant.isValidPassword(req.body.password1) === false) {
        res.render('error', { message: 'Password do not match minimum strength requirements', error: {} });
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

    res.render('register', { title: 'nu+warehouses' });
});

router.get('/activate', function (req, res, next) {
    res.render('activate', { title: 'nu+warehouses' });
});

router.get('/account', function (req, res, next) {
    res.render('account', { title: 'nu+warehouses' });
});

module.exports = router;
