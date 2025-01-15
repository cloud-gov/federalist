const { expect } = require('chai');
const factory = require('../../support/factory');
const authorizer = require('../../../../api/authorizers/file-storage');
const siteErrors = require('../../../../api/responses/siteErrors');
const { createSiteUserOrg } = require('../../support/site-user');

describe('file-storage authorizer', () => {
  describe('.canCreateSiteStorage({ id: userId }, { id: siteId })', () => {
    beforeEach(() => factory.organization.truncate());
    afterEach(() => factory.organization.truncate());

    it('should pass with an org manager and no existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({
        roleName: 'manager',
      });

      const expected = await authorizer.canCreateSiteStorage(user, site);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected).to.have.all.keys('site', 'organization');
    });

    it('should pass with org manager, no site storage but org storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
      });

      const expected = await authorizer.canCreateSiteStorage(user, site);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected).to.have.all.keys('site', 'organization');
    });

    it('should fail with an org manager and an existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer.canCreateSiteStorage(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.SITE_FILE_STORAGE_EXISTS);
    });
  });

  describe('.canViewSiteStorageActions({ id: userId }, { id: siteId })', () => {
    beforeEach(() => factory.organization.truncate());
    afterEach(() => factory.organization.truncate());

    it('should pass with an org manager an existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      const fss = await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const expected = await authorizer.canViewSiteStorageActions(user, site);
      expect(expected.site.id).to.equal(site.id);
      expect(expected.organization.id).to.equal(org.id);
      expect(expected.fileStorageService.id).to.equal(fss.id);
      expect(expected).to.have.all.keys('site', 'organization', 'fileStorageService');
    });

    it('should fail with an org manager and no site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
      });

      const error = await authorizer
        .canViewSiteStorageActions(user, site)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(404);
      expect(error.message).to.be.equal(siteErrors.NOT_FOUND);
    });

    it('should fail with an org user and site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'user' });
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer
        .canViewSiteStorageActions(user, site)
        .catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(403);
      expect(error.message).to.be.equal(siteErrors.ORGANIZATION_MANAGER_ACCESS);
    });
  });

  describe('.canManageSiteStorageFile({ id: userId }, { id: siteId })', () => {
    beforeEach(() => factory.organization.truncate());
    afterEach(() => factory.organization.truncate());

    it('should pass with an org manager an existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const expected = await authorizer.canManageSiteStorageFile(user, site);
      expect(expected).to.equal(true);
    });

    it('should pass with an org user an existing site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'user' });
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const expected = await authorizer.canManageSiteStorageFile(user, site);
      expect(expected).to.equal(true);
    });

    it('should fail with an org manager and no site storage', async () => {
      const { user, site, org } = await createSiteUserOrg({ roleName: 'manager' });
      await factory.fileStorageService.create({
        organizationId: org.id,
      });

      const error = await authorizer.canManageSiteStorageFile(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(404);
      expect(error.message).to.be.equal(siteErrors.NOT_FOUND);
    });

    it('should fail with an non org user and site storage', async () => {
      const { site, org } = await createSiteUserOrg({ roleName: 'user' });
      const user = await factory.user();
      await factory.fileStorageService.create({
        organizationId: org.id,
        siteId: site.id,
      });

      const error = await authorizer.canManageSiteStorageFile(user, site).catch((e) => e);
      expect(error).to.be.throw;
      expect(error.status).to.be.equal(404);
      expect(error.message).to.be.equal(siteErrors.NOT_FOUND);
    });
  });
});
