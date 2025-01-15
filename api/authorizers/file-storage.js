const siteErrors = require('../responses/siteErrors');
const { FileStorageService } = require('../models');
const { isSiteOrgManager, isSiteUser } = require('./utils');

const canCreateSiteStorage = async ({ id: userId }, { id: siteId }) => {
  const { site, organization } = await isSiteOrgManager({ id: userId }, { id: siteId });

  const fss = await FileStorageService.findOne({ where: { siteId } });

  if (fss) {
    throw {
      status: 403,
      message: siteErrors.SITE_FILE_STORAGE_EXISTS,
    };
  }

  return { site, organization };
};

async function canViewSiteStorageActions({ id: userId }, { id: siteId }) {
  const { site, organization } = await isSiteOrgManager({ id: userId }, { id: siteId });

  const fileStorageService = await FileStorageService.findOne({ where: { siteId } });

  if (!fileStorageService) {
    throw {
      status: 404,
      message: siteErrors.NOT_FOUND,
    };
  }

  return { site, organization, fileStorageService };
}

async function canManageSiteStorageFile({ id: userId }, { id: siteId }) {
  await isSiteUser({ id: userId }, { id: siteId });

  const fss = await FileStorageService.findOne({ where: { siteId } });

  if (!fss) {
    throw {
      status: 404,
      message: siteErrors.NOT_FOUND,
    };
  }

  return true;
}

module.exports = {
  canCreateSiteStorage,
  canViewSiteStorageActions,
  canManageSiteStorageFile,
};
