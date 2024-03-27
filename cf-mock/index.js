const express = require('express');
const router = require('./routers');
const responses = require('../api/responses');
const { expressLogger, expressErrorLogger } = require('../winston');

const app = express();
const port = 1234;

app.use(expressLogger);
app.use(expressErrorLogger);
app.use(responses);
app.use('/', router);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
