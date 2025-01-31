const path = require('node:path');
const {
  FileStorageService,
  FileStorageFile,
  FileStorageUserAction,
} = require('../../models');
const S3Helper = require('../S3Helper');
const CloudFoundryAPIClient = require('../../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

class SiteFileStorageSerivce {
  constructor(site, userId) {
    const { id, organizationId, s3ServiceName } = site.dataValues;

    this.S3_BASE_PATH = '~assets/';
    this.id = id;
    this.organizationId = organizationId;
    this.s3ServiceName = s3ServiceName;

    this.access_key_id = null;
    this.bucket = null;
    this.region = null;
    this.secret_access_key = null;
    this.serviceInstance = null;
    this.s3Client = null;
    this.userId = userId;

    this.initialized = null;
    this.fileStorageServiceId = null;
  }

  async init() {
    const serviceInstance = await apiClient.fetchServiceInstance(this.s3ServiceName);

    this.serviceInstance = serviceInstance;

    const { access_key_id, bucket, region, secret_access_key } =
      await apiClient.fetchServiceInstanceCredentials(this.s3ServiceName);

    this.access_key_id = access_key_id;
    this.bucket = bucket;
    this.region = region;
    this.secret_access_key = secret_access_key;

    const s3Client = new S3Helper.S3Client({
      accessKeyId: access_key_id,
      secretAccessKey: secret_access_key,
      bucket,
      region,
    });

    this.s3Client = s3Client;
    this.initialized = true;

    return this;
  }

  async createAssetRoot() {
    this._isInitialized();

    return this.s3Client.putObject('', this.S3_BASE_PATH);
  }

  async createDirectory(basepath, name) {
    await this._getSiteFileStorageService();

    const directoryPath = path.join(this.S3_BASE_PATH, basepath, name, '/');

    await this.s3Client.putObject('', directoryPath);

    const fsf = await FileStorageFile.create({
      name,
      key: directoryPath,
      type: 'directory',
      fileStorageServiceId: this.fileStorageServiceId,
      description: 'directory',
    });

    await FileStorageUserAction.create({
      userId: this.userId,
      fileStorageServiceId: this.fileStorageServiceId,
      fileStorageFileId: fsf.id,
      method: FileStorageUserAction.METHODS.POST,
      description: FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
    });

    return fsf;
  }

  async createFileStorageService() {
    this._isInitialized();

    await this.createAssetRoot();

    const fss = await FileStorageService.create({
      siteId: this.id,
      organizationId: this.organizationId,
      name: 'site-storage',
      serviceId: this.serviceInstance.guid,
      serviceName: this.serviceInstance.name,
    });

    this.fileStorageServiceId = fss.id;

    return fss;
  }

  async deleteFile() {}

  async deleteDirectory() {}

  async listDirectoryFiles() {}

  async uploadFile() {}

  _isInitialized() {
    if (!this.initialized) {
      throw Error('Initialize the class instance with `await instance.init()`');
    }
  }

  async _getSiteFileStorageService() {
    this._isInitialized();

    const { id: siteId } = this;

    const fss = await FileStorageService.findOne({ where: { siteId } });

    if (!fss) {
      throw Error('Site file service must be created.');
    }

    this.fileStorageServiceId = fss.id;
  }
}

module.exports = {
  SiteFileStorageSerivce,
};
