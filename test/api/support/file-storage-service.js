const sinon = require('sinon');
const factory = require('./factory');
const { createSiteUserOrg } = require('./site-user');
const CloudFoundryAPIClient = require('../../../api/utils/cfApiClient');
const S3Helper = require('../../../api/services/S3Helper');
const { SiteFileStorageSerivce } = require('../../../api/services/file-storage');

async function createSiteConfig({ roleName = 'user' } = {}) {
  const { site, user, org } = await createSiteUserOrg({ roleName });
  const access_key_id = 'access-key-1';
  const bucket = 'bucke-1';
  const region = 'region-1';
  const secret_access_key = 'secret-key-1';
  const instance1 = await factory.createCFAPIResource({
    name: site.s3ServiceName,
  });

  return {
    org,
    site,
    access_key_id,
    bucket,
    region,
    secret_access_key,
    instance1,
    user,
  };
}

async function stubSiteS3({
  putObjectResolves = true,
  putObjectRejects = null,
  fetchServiceInstanceResolves = true,
  fetchServiceInstanceRejects = null,
  fetchCredentialsResolves = true,
  fetchCredentialsRejects = null,
  roleName = 'user',
} = {}) {
  const { org, site, user, access_key_id, bucket, region, secret_access_key, instance1 } =
    await createSiteConfig({ roleName });

  if (fetchServiceInstanceResolves && !fetchServiceInstanceRejects) {
    sinon
      .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
      .withArgs(site.s3ServiceName)
      .resolves(instance1);
  }

  if (fetchServiceInstanceRejects) {
    sinon
      .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstance')
      .withArgs(site.s3ServiceName)
      .rejects(fetchServiceInstanceRejects);
  }

  if (fetchCredentialsResolves && !fetchCredentialsRejects) {
    sinon
      .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstanceCredentials')
      .withArgs(site.s3ServiceName)
      .resolves({
        access_key_id,
        bucket,
        region,
        secret_access_key,
      });
  }

  if (fetchCredentialsRejects) {
    sinon
      .stub(CloudFoundryAPIClient.prototype, 'fetchServiceInstanceCredentials')
      .withArgs(site.s3ServiceName)
      .rejects(fetchCredentialsRejects);
  }

  if (putObjectResolves && !putObjectRejects) {
    sinon
      .stub(S3Helper.S3Client.prototype, 'putObject')
      .withArgs('', '~assets/')
      .resolves(putObjectResolves);
  }

  if (putObjectRejects) {
    sinon
      .stub(S3Helper.S3Client.prototype, 'putObject')
      .withArgs('', '~assets/')
      .rejects(putObjectRejects);
  }

  return {
    org,
    site,
    access_key_id,
    bucket,
    region,
    secret_access_key,
    instance1,
    user,
  };
}

async function createFileStorageServiceClient() {
  const { site, user, ...props } = await stubSiteS3();
  const siteStorageService = new SiteFileStorageSerivce(site, user.id);
  const client = await siteStorageService.init();
  await client.createFileStorageService();

  sinon.restore();

  return {
    ...props,
    client,
    site,
    user,
  };
}

module.exports = {
  createSiteConfig,
  createFileStorageServiceClient,
  stubSiteS3,
};
