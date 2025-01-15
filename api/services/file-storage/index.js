const { FileStorageService } = require('../../models');
const S3Helper = require('../S3Helper');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

async function createSiteFileStorage(site) {
  const { id, s3ServiceName, organizationId } = site.dataValues;

  const serviceInstance = await apiClient.fetchServiceInstance(s3ServiceName);
  const { access_key_id, bucket, region, secret_access_key } =
    await apiClient.fetchServiceInstanceCredentials(s3ServiceName);

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id,
    secretAccessKey: secret_access_key,
    bucket,
    region,
  });

  await s3Client.putObject('', '~assets/');

  const fss = await FileStorageService.create({
    siteId: id,
    organizationId,
    name: 'site-storage',
    serviceId: serviceInstance.guid,
    serviceName: serviceInstance.name,
  });

  return fss;
}

module.exports = {
  createSiteFileStorage,
};
