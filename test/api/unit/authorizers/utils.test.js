const { expect } = require('chai');
const factory = require('../../support/factory');
const authorizer = require('../../../../api/authorizers/utils');
const siteErrors = require('../../../../api/responses/siteErrors');
const { createSiteUserOrg } = require('../../support/site-user');

describe('Utils authorizer', () => {
  describe('.authorize({ id: userId }, { id: siteId })', () => {
    beforeEach(() => factory.organization.truncate());
    afterEach(() => factory.organization.truncate());

    it('should resolve when user is apart of site org', async () => {
      const { user, site } = await createSiteUserOrg();

      const expected = await authorizer.authorize(user, site);
      return expect(expected.id).to.equal(site.id);
    });

    it('should throw when site does not exist', async () => {
      const user = await factory.user();

      const error = await authorizer.authorize(user, { id: 8675309 }).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      expect(error.message).to.equal(siteErrors.NOT_FOUND);
    });

    it('should throw when user is not apart of site org', async () => {
      const { site } = await createSiteUserOrg();
      const user = await factory.user();

      const error = await authorizer.authorize(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.equal(404);
      expect(error.message).to.equal(siteErrors.NOT_FOUND);
    });

    it('should throw when site is inactive', async () => {
      const { user, site } = await createSiteUserOrg();

      await site.update({ isActive: false });

      const error = await authorizer.authorize(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
    });

    it('should throw when org is inactive', async () => {
      const { user, site, org } = await createSiteUserOrg();

      await org.update({ isActive: false });

      const error = await authorizer.authorize(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.equal(403);
      expect(error.message).to.equal(siteErrors.ORGANIZATION_INACTIVE);
    });
  });

  describe('.isSiteOrgManager({ id: userId }, { id: siteId })', () => {
    beforeEach(() => factory.organization.truncate());
    afterEach(() => factory.organization.truncate());

    it('should resolve when user is manager of site org', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });

      const expected = await authorizer.isSiteOrgManager(user, site);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected).to.have.all.keys('site', 'organization');
    });

    it('should throw when user is user of site org', async () => {
      const { user, site } = await createSiteUserOrg({ roleName: 'user' });

      const error = await authorizer.isSiteOrgManager(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.ORGANIZATION_MANAGER_ACCESS);
    });
  });
});
