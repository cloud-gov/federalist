const router = require('express').Router();
const FileStorageServiceController = require('../controllers/file-storage-service');
const { csrfProtection, sessionAuth } = require('../middlewares');

router.use(sessionAuth);
router.use(csrfProtection);

router.post('/site/:site_id/file-storage-service', FileStorageServiceController.create);

module.exports = router;
