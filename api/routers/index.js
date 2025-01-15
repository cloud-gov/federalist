const express = require('express');

const mainRouter = express.Router();

mainRouter.use(require('./auth'));
mainRouter.use(require('./webhook'));
mainRouter.use(require('./main'));
mainRouter.use(require('./report'));

const apiRouter = express.Router();
apiRouter.use(require('./build-log'));
apiRouter.use(require('./build-task'));
apiRouter.use(require('./build'));
apiRouter.use(require('./domain'));
apiRouter.use(require('./file-storage-service'));
apiRouter.use(require('./organization'));
apiRouter.use(require('./organization-role'));
apiRouter.use(require('./published-branch'));
apiRouter.use(require('./user'));
apiRouter.use(require('./published-file'));
apiRouter.use(require('./role'));
apiRouter.use(require('./site'));
apiRouter.use(require('./site-branch-config'));
apiRouter.use(require('./user-action'));
apiRouter.use(require('./user-environment-variable'));

// prefix all api routes with "/v0"
mainRouter.use('/v0', apiRouter);

module.exports = mainRouter;
