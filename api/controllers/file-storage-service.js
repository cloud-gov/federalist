const EventCreator = require('../services/EventCreator');
const { canCreateSiteStorage } = require('../authorizers/file-storage');
const { serializeFileStorageService } = require('../serializers/file-storage');
const { wrapHandlers } = require('../utils');
const { Event } = require('../models');
const { SiteFileStorageSerivce } = require('../services/file-storage');

module.exports = wrapHandlers({
  async create(req, res) {
    const { params, user } = req;
    const siteId = parseInt(params.site_id, 10);

    try {
      const { site } = await canCreateSiteStorage({ id: user.id }, { id: siteId });

      const siteStorageService = new SiteFileStorageSerivce(site, user.id);
      const client = await siteStorageService.init();
      const fss = await client.createFileStorageService();

      EventCreator.audit(
        Event.labels.ORG_MANAGER_ACTION,
        user,
        'Site File Storage Service Created',
        fss,
      );

      const data = serializeFileStorageService(fss);
      return res.send(data);
    } catch (error) {
      return res.status(error.status).send(error);
    }
  },
});
