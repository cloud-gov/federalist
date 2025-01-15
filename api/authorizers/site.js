const GitHub = require('../services/GitHub');
const siteErrors = require('../responses/siteErrors');
const { Organization } = require('../models');
const { authorize } = require('./utils');

const authorizeRepositoryAdmin = (user, site) =>
  GitHub.checkPermissions(user, site.owner, site.repository)
    .then((permissions) => {
      if (!permissions.admin) {
        throw {
          message: siteErrors.ADMIN_ACCESS_REQUIRED,
          status: 403,
        };
      }
      return site.id;
    })
    .catch((error) => {
      if (error.status === 404) {
        // authorize user if the site's repo does not exist:
        // When a user attempts to delete a site after deleting the repo, Federalist
        // attempts to fetch the repo but it no longer exists and receives a 404
        return site.id;
      }
      throw {
        message: siteErrors.ADMIN_ACCESS_REQUIRED,
        status: 403,
      };
    });

const createWithOrgs = (organizations, organizationId) => {
  if (!organizationId) {
    throw {
      message: siteErrors.ORGANIZATION_REQUIRED,
    };
  }

  const hasOrg = organizations.find((org) => org.id === organizationId);

  if (!hasOrg) {
    throw {
      message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
      status: 404,
    };
  }

  if (!hasOrg.isActive) {
    throw {
      message: siteErrors.ORGANIZATION_INACTIVE,
      status: 403,
    };
  }
};

const createWithoutOrgs = (organizationId) => {
  if (!organizationId) return;

  throw {
    message: siteErrors.NO_ASSOCIATED_ORGANIZATION,
    status: 404,
  };
};

const create = async (user, siteParams) => {
  const { organizationId } = siteParams;
  const organizations = await Organization.forUser(user).findAll();

  if (organizations.length === 0) {
    createWithoutOrgs(organizationId);
  }

  if (organizations.length > 0) {
    createWithOrgs(organizations, organizationId);
  }
};

const createBuild = (user, site) => authorize(user, site);

const showActions = (user, site) => authorize(user, site);

const findOne = (user, site) => authorize(user, site);

const update = (user, site) => authorize(user, site);

const destroy = (user, site) =>
  authorize(user, site).then(() => authorizeRepositoryAdmin(user, site));

module.exports = {
  create,
  findOne,
  update,
  destroy,
  showActions,
  createBuild,
};
