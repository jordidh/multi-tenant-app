const express = require('express');
const router = express.Router();
const database = require('../../api/database');

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

const accessJwtOptions = {
    jwtFromRequest: ExtractJwt.fromBodyField('token'),
    secretOrKey: process.env.ACCESS_SECRET_KEY,
    ignoreExpiration: false
};

const refreshJwtOptions = {
    jwtFromRequest: ExtractJwt.fromBodyField('token'),
    secretOrKey: process.env.REFRESH_SECRET_KEY,
    ignoreExpiration: false
};

passport.use('accessToken', new JwtStrategy(accessJwtOptions, async (jwtPayload, done) => {
    const conn = await database.getPromisePool().getConnection();
    const sql = 'SELECT user_name FROM users WHERE user_name = ?';
    const resultQuery = await conn.execute(sql, [jwtPayload.sub]);
    if (resultQuery[0].length === 1) {
        done(null, { username: resultQuery[0][0].user_name });
    } else {
        done(null, false);
    }
}));

passport.use('resfreshToken', new JwtStrategy(refreshJwtOptions, async (jwtPayload, done) => {
    const conn = await database.getPromisePool().getConnection();
    const sql = 'SELECT user_name FROM users WHERE user_name = ?';
    const resultQuery = await conn.execute(sql, [jwtPayload.sub]);
    if (resultQuery[0].length === 1) {
        done(null, { username: resultQuery[0][0].user_name });
    } else {
        done(null, false);
    }
}));

router.post('/protected', passport.authenticate('accessToken', { session: false }), (req, res) => {
    // Després de l'autenticació, controlaríem si l'usuari está autoritzat per fer servir el recurs o no.
    res.json({ message: 'User authenticated.' });
});

router.post('/renew-access-token', passport.authenticate('resfreshToken', { session: false }), (req, res) => {
    const newAccessToken = createAccessToken(req.user.username);
    res.json({ new_access_token: newAccessToken });
});

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

function createAccessToken (user) {
    const expiresIn = '60s';
    const token = jwt.sign({ sub: user }, process.env.ACCESS_SECRET_KEY, {
        expiresIn
    });
    console.log('New access token: ' + token);
    return token;
}

module.exports = router;
