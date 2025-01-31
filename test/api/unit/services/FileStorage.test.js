const path = require('node:path');
const { expect } = require('chai');
const sinon = require('sinon');
const factory = require('../../support/factory');
const {
  stubSiteS3,
  createFileStorageServiceClient,
} = require('../../support/file-storage-service');
const EventCreator = require('../../../../api/services/EventCreator');
const S3Helper = require('../../../../api/services/S3Helper');
const { FileStorageService, FileStorageUserAction } = require('../../../../api/models');
const { SiteFileStorageSerivce } = require('../../../../api/services/file-storage');

const initErrorMessage = 'Initialize the class instance with `await instance.init()`';

describe('FileStorage services', () => {
  beforeEach(async () =>
    Promise.all([
      sinon.stub(EventCreator, 'error').resolves(),
      await factory.organization.truncate(),
    ]),
  );

  afterEach(async () =>
    Promise.all([sinon.restore(), await factory.organization.truncate()]),
  );

  describe('SiteFileStorageSerivce', () => {
    it('should initialize with proper s3 creds', async () => {
      const {
        org,
        site,
        access_key_id,
        bucket,
        region,
        secret_access_key,
        instance1,
        user,
      } = await stubSiteS3();

      const siteStorageService = new SiteFileStorageSerivce(site, user.id);
      const client = await siteStorageService.init();

      expect(client.access_key_id).to.be.eq(access_key_id);
      expect(client.bucket).to.be.eq(bucket);
      expect(client.region).to.be.eq(region);
      expect(client.secret_access_key).to.be.eq(secret_access_key);
      expect(client.s3ServiceName).to.be.eq(site.s3ServiceName);
      expect(client.id).to.be.eq(site.id);
      expect(client.organizationId).to.be.eq(org.id);
      expect(client.serviceInstance).to.be.eq(instance1);
      expect(client.s3Client).to.be.instanceOf(S3Helper.S3Client);
    });

    it('should create the ~assets base directory for s3', async () => {
      const expected = { message: 'success' };
      const { site } = await stubSiteS3({
        putObjectResolves: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(site);
      const client = await siteStorageService.init();

      const result = await client.createAssetRoot();
      expect(result).to.deep.eq(expected);
    });

    it('should throw with invalid s3 service', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { site } = await stubSiteS3({
        fetchServiceInstanceRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(site);
      const error = await siteStorageService.init().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });

    it('should throw with invalid s3 credentials', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { site } = await stubSiteS3({
        fetchCredentialsRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(site);
      const error = await siteStorageService.init().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });

    it('should throw with invalid createAssetRoot', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { site } = await stubSiteS3({
        putObjectRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(site);
      const client = await siteStorageService.init();
      const error = await client.createAssetRoot().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });
  });

  describe('createFileStorageService', () => {
    it('should create a site file storage service', async () => {
      const { org, site } = await stubSiteS3();
      const siteStorageService = new SiteFileStorageSerivce(site);
      const client = await siteStorageService.init();

      const expected = await client.createFileStorageService();
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

    it('throws if it cannot create file storage asset root', async () => {
      const message = 'Error occured';
      const expected = Error(message);
      const { site } = await stubSiteS3({
        putObjectRejects: expected,
      });

      const siteStorageService = new SiteFileStorageSerivce(site);
      const client = await siteStorageService.init();
      const error = await client.createFileStorageService().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(message);
    });

    it('should throw if not initialized', async () => {
      const { site } = await stubSiteS3();
      const siteStorageService = new SiteFileStorageSerivce(site);

      const error = await siteStorageService.createFileStorageService().catch((e) => e);

      expect(error).to.be.throw;
      expect(error.message).to.be.eq(initErrorMessage);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory with a name and path', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory/';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should append trailing slash if not provided', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}/`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should normalize the path', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b///c';
      const name = 'another-directory///';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').resolves();

      const results = await client.createDirectory(basepath, name);

      const fsua = await FileStorageUserAction.findOne({
        where: {
          fileStorageFileId: results.id,
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua.method).to.be.eq(FileStorageUserAction.METHODS.POST);
      expect(fsua.description).to.be.eq(
        FileStorageUserAction.ACTION_TYPES.CREATE_DIRECTORY,
      );
    });

    it('should not create a file or user action on s3 error', async () => {
      const { client, user } = await createFileStorageServiceClient();
      const basepath = '/a/b/c';
      const name = 'another-directory/';
      const key = path.join(client.S3_BASE_PATH, basepath, name);
      const s3stub = sinon.stub(S3Helper.S3Client.prototype, 'putObject').rejects();

      const error = await client.createDirectory(basepath, name).catch((e) => e);

      expect(error).to.be.throw;

      const fsua = await FileStorageUserAction.findAll({
        where: {
          fileStorageServiceId: client.fileStorageServiceId,
          userId: user.id,
        },
      });

      expect(s3stub.calledOnceWith('', `${key}`)).to.be.eq(true);
      expect(fsua).to.be.empty;
    });
  });

  describe('uploadSiteFileStorageFile', () => {});
});
