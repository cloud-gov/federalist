const { expect } = require('chai');
const factory = require('../../support/factory');
const { FileStorageFile } = require('../../../../api/models');

describe('FileStorageFile model', () => {
  afterEach(() =>
    Promise.all([
      factory.fileStorageService.truncate(),
      factory.organization.truncate(),
      factory.fileStorageFile.truncate(),
    ]),
  );

  it('`name`, `key`, `fileStorageServiceId`, `type` is required', async () => {
    const name = 'test.txt';
    const key = `/the/storage/key/${name}`;
    const type = 'text/plain';
    const fss = await factory.fileStorageService.create();

    const fsf = await FileStorageFile.create({
      name,
      key,
      type,
      fileStorageServiceId: fss.id,
    });

    expect(fsf.name).to.equal(name);
    expect(fsf.key).to.equal(key);
    expect(fsf.type).to.equal(type);
    expect(fsf.fileStorageServiceId).to.equal(fss.id);
    expect(fsf.metadata).to.equal(null);
    expect(fsf.description).to.equal(null);
    expect(fsf.createdAt).to.be.instanceOf(Date);
    expect(fsf.updatedAt).to.be.instanceOf(Date);
    expect(fsf.deletedAt).to.equal(null);
  });

  it('saves additional `description` text and `metadata` json', async () => {
    const name = 'test.txt';
    const key = `/the/storage/key/${name}`;
    const fss = await factory.fileStorageService.create();
    const description = 'this is a test';
    const metadata = { type: 'plain/text', size: 1234 };

    const fsf = await FileStorageFile.create({
      name,
      key,
      type: metadata.type,
      fileStorageServiceId: fss.id,
      description,
      metadata,
    });

    expect(fsf.name).to.equal(name);
    expect(fsf.key).to.equal(key);
    expect(fsf.type).to.equal(metadata.type);
    expect(fsf.fileStorageServiceId).to.equal(fss.id);
    expect(fsf.metadata).to.deep.equal(metadata);
    expect(fsf.description).to.equal(description);
    expect(fsf.createdAt).to.be.instanceOf(Date);
    expect(fsf.updatedAt).to.be.instanceOf(Date);
    expect(fsf.deletedAt).to.equal(null);
  });

  it('should error with invalid fileStorageServiceId foreign key', async () => {
    const name = 'test.txt';
    const key = `/the/storage/key/${name}`;
    const type = 'text/plain';

    const error = await FileStorageFile.create({
      name,
      key,
      type,
      fileStorageServiceId: 8675309,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error without name`', async () => {
    const name = null;
    const key = `/the/storage/key/${name}`;
    const fss = await factory.fileStorageService.create();

    const error = await FileStorageFile.create({
      name,
      key,
      fileStorageServiceId: fss.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('should error without a key`', async () => {
    const name = 'test.txt';
    const key = null;
    const type = 'text/plain';
    const fss = await factory.fileStorageService.create();

    const error = await FileStorageFile.create({
      name,
      key,
      type,
      fileStorageServiceId: fss.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });

  it('should error without a type`', async () => {
    const name = 'test.txt';
    const key = 'a/b/c';
    const fss = await factory.fileStorageService.create();

    const error = await FileStorageFile.create({
      name,
      key,
      fileStorageServiceId: fss.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });
});
