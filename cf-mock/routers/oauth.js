const jwt = require('jsonwebtoken');
const router = require('express').Router();

router.post('/oauth/token', (req, res) => res.send({
  access_token: jwt.sign({ exp: (Date.now() / 1000) + 600 }, '123abc'),
}));

module.exports = router;
