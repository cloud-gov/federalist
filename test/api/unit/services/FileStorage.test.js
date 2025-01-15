const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const EventCreator = require('../../../../api/services/EventCreator');
const { createSiteFileStorage } = require('../../../../api/services/file-storage');
const CloudFoundryAPIClient = require('../../../../api/utils/cfApiClient');
const S3Helper = require('../../../../api/services/S3Helper');
const { FileStorageService } = require('../../../../api/models');

describe('FileStorage services', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await factory.organization.truncate();
  });

  afterEach(async () => {
    sinon.restore();
    await factory.organization.truncate();
  });

  describe('createSiteFileStorage', () => {
    it('should create a site file storage service', async () => {
      const org = await factory.organization.create();
      const site = await factory.site({ organizationId: org.id });
      const access_key_id = 'access-key-1';
      const bucket = 'bucke-1';
      const region = 'region-1';
      const secret_access_key = 'secret-key-1';
      const instance1 = await factory.createCFAPIResource({
        name: site.s3ServiceName,
      });

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .resolves(instance1);

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstanceCredentials')
        .withArgs(site.s3ServiceName)
        .resolves({
          access_key_id,
          bucket,
          region,
          secret_access_key,
        });

      sinon
        .stub(S3Helper.S3Client.prototype, 'putObject')
        .withArgs('', '~assets/')
        .resolves();

      const expected = await createSiteFileStorage(site);
      const {
        dataValues: { id, siteId, organizationId },
      } = expected;

      const fss = await FileStorageService.findOne({
        where: { siteId: site.id, organizationId: org.id },
      });

      expect(id).to.be.equal(fss.id);
      expect(siteId).to.be.equal(site.id);
      expect(organizationId).to.be.equal(org.id);
    });

    it('should throw if s3 service does not exist', async () => {
      const org = await factory.organization.create();
      const site = await factory.site({ organizationId: org.id });

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .throws();

      const expected = await createSiteFileStorage(site).catch((e) => e);
      expect(expected).to.be.throw;
    });

    it('should throw if service has no credentials', async () => {
      const org = await factory.organization.create();
      const site = await factory.site({ organizationId: org.id });
      const instance1 = await factory.createCFAPIResource({
        name: site.s3ServiceName,
      });

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .resolves(instance1);

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstanceCredentials')
        .withArgs(site.s3ServiceName)
        .throws();

      const expected = await createSiteFileStorage(site).catch((e) => e);
      expect(expected).to.be.throw;
    });

    it('should throw if service cannot create s3 path', async () => {
      const org = await factory.organization.create();
      const site = await factory.site({ organizationId: org.id });
      const access_key_id = 'access-key-1';
      const bucket = 'bucke-1';
      const region = 'region-1';
      const secret_access_key = 'secret-key-1';
      const instance1 = await factory.createCFAPIResource({
        name: site.s3ServiceName,
      });

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
        .withArgs(site.s3ServiceName)
        .resolves(instance1);

      sinon
        .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstanceCredentials')
        .withArgs(site.s3ServiceName)
        .resolves({
          access_key_id,
          bucket,
          region,
          secret_access_key,
        });

      sinon
        .stub(S3Helper.S3Client.prototype, 'putObject')
        .withArgs('', '~assets/')
        .throws();

      const expected = await createSiteFileStorage(site).catch((e) => e);
      expect(expected).to.be.throw;
    });
  });
});
