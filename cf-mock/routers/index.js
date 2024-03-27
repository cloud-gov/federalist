const express = require('express');

const apiRouter = express.Router();
const mainRouter = express.Router();

apiRouter.use(require('./service-credential-binding'));
// apiRouter.use(require('./build'));

mainRouter.use('/v3', apiRouter);
mainRouter.use(require('./oauth'));

module.exports = mainRouter;
