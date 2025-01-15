const { expect } = require('chai');
const factory = require('../../support/factory');
const { FileStorageUserAction } = require('../../../../api/models');

describe('FileStorageUserAction model', () => {
  afterEach(() =>
    Promise.all([
      factory.fileStorageService.truncate(),
      factory.organization.truncate(),
      factory.fileStorageFile.truncate(),
    ]),
  );

  it(
    'requires `fileStorageServiceId`, `fileStorageFileId`,' + ' `userId`, and `method`',
    async () => {
      const method = 'POST';
      const fsf = await factory.fileStorageFile.create();
      const user = await factory.user();

      const result = await FileStorageUserAction.create({
        method,
        fileStorageFileId: fsf.id,
        fileStorageServiceId: fsf.fileStorageServiceId,
        userId: user.id,
      });

      expect(result.method).to.equal(method);
      expect(result.fileStorageFileId).to.equal(fsf.id);
      expect(result.fileStorageServiceId).to.equal(fsf.fileStorageServiceId);
      expect(result.userId).to.equal(user.id);
      expect(result.description).to.equal(null);
      expect(result.createdAt).to.be.instanceOf(Date);
      expect(result.updatedAt).to.equal(undefined);
      expect(result.deletedAt).to.equal(undefined);
    },
  );

  it('should have an optional description', async () => {
    const method = 'POST';
    const description = 'Created file';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const result = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: user.id,
      description,
    });

    expect(result.method).to.equal(method);
    expect(result.fileStorageFileId).to.equal(fsf.id);
    expect(result.fileStorageServiceId).to.equal(fsf.fileStorageServiceId);
    expect(result.userId).to.equal(user.id);
    expect(result.description).to.equal(description);
    expect(result.createdAt).to.be.instanceOf(Date);
    expect(result.updatedAt).to.equal(undefined);
    expect(result.deletedAt).to.equal(undefined);
  });

  it('should error with invalid fileStorageFileId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: '999999',
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: user.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error with invalid fileStorageServiceId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();
    const user = await factory.user();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: '999999',
      userId: user.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error with invalid userId foreign key', async () => {
    const method = 'POST';
    const fsf = await factory.fileStorageFile.create();

    const error = await FileStorageUserAction.create({
      method,
      fileStorageFileId: fsf.id,
      fileStorageServiceId: fsf.fileStorageServiceId,
      userId: '99999999',
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });
});
