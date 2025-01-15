const { expect } = require('chai');
const factory = require('../../support/factory');
const { FileStorageDomain } = require('../../../../api/models');

describe('FileStorageDomain model', () => {
  afterEach(() =>
    Promise.all([
      factory.fileStorageService.truncate(),
      factory.organization.truncate(),
      FileStorageDomain.truncate(),
    ]),
  );

  it('requires `names` and `fileStorageServiceId` foreign key', async () => {
    const names = 'test.gov';
    const defaultState = 'pending';
    const fss = await factory.fileStorageService.create();

    const fsd = await FileStorageDomain.create({
      names,
      fileStorageServiceId: fss.id,
    });

    expect(fsd.names).to.equal(names);
    expect(fsd.state).to.equal(defaultState);
    expect(fsd.fileStorageServiceId).to.equal(fss.id);
    expect(fsd.metadata).to.equal(null);
    expect(fsd.serviceName).to.equal(null);
    expect(fsd.serviceId).to.equal(null);
    expect(fsd.createdAt).to.be.instanceOf(Date);
    expect(fsd.updatedAt).to.be.instanceOf(Date);
    expect(fsd.deletedAt).to.equal(null);
  });

  it('allows updates of `serviceName` and `serviceId`', async () => {
    const names = 'test.gov';
    const defaultState = 'pending';
    const serviceName = 'service-name';
    const serviceId = '123-abc';
    const fss = await factory.fileStorageService.create();

    const fsd = await FileStorageDomain.create({
      names,
      fileStorageServiceId: fss.id,
    });

    await fsd.update({ serviceName, serviceId });

    expect(fsd.names).to.equal(names);
    expect(fsd.state).to.equal(defaultState);
    expect(fsd.fileStorageServiceId).to.equal(fss.id);
    expect(fsd.metadata).to.equal(null);
    expect(fsd.serviceName).to.equal(serviceName);
    expect(fsd.serviceId).to.equal(serviceId);
    expect(fsd.createdAt).to.be.instanceOf(Date);
    expect(fsd.updatedAt).to.be.instanceOf(Date);
    expect(fsd.deletedAt).to.equal(null);
  });

  it('allows only comma delimited, fully qualifed domain names', async () => {
    const namesList = ['test.gov', 'one.test.gov,two.test.gov'];
    const defaultState = 'pending';

    namesList.map(async (names) => {
      const fss = await factory.fileStorageService.create();

      const fsd = await FileStorageDomain.create({
        names,
        fileStorageServiceId: fss.id,
      });

      expect(fsd.names).to.equal(names);

      expect(fsd.state).to.equal(defaultState);
      expect(fsd.fileStorageServiceId).to.equal(fss.id);
      expect(fsd.metadata).to.equal(null);
      expect(fsd.serviceName).to.equal(null);
      expect(fsd.serviceId).to.equal(null);
      expect(fsd.createdAt).to.be.instanceOf(Date);
      expect(fsd.updatedAt).to.be.instanceOf(Date);
      expect(fsd.deletedAt).to.equal(null);
    });
  });

  it('allows only proper `state` enum values', async () => {
    const names = 'test.gov';

    FileStorageDomain.States.values.map(async (state) => {
      const fss = await factory.fileStorageService.create();

      const fsd = await FileStorageDomain.create({
        names,
        fileStorageServiceId: fss.id,
        state,
      });

      expect(fsd.names).to.equal(names);
      expect(fsd.state).to.equal(state);
      expect(fsd.fileStorageServiceId).to.equal(fss.id);
      expect(fsd.metadata).to.equal(null);
      expect(fsd.serviceName).to.equal(null);
      expect(fsd.serviceId).to.equal(null);
      expect(fsd.createdAt).to.be.instanceOf(Date);
      expect(fsd.updatedAt).to.be.instanceOf(Date);
      expect(fsd.deletedAt).to.equal(null);
    });
  });

  it('should error with invalid fully qualifed domain names', async () => {
    const names = 'notadomaingov';
    const fss = await factory.fileStorageService.create();

    const error = await FileStorageDomain.create({
      names,
      fileStorageServiceId: fss.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors[0].path).to.equal('names');
  });

  it('should error without `fileStorageServiceId` foreign key', async () => {
    const names = 'test.gov';

    const error = await FileStorageDomain.create({
      names,
      fileStorageServiceId: '987654321',
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error invalid state value', async () => {
    const names = 'test.gov';
    const fss = await factory.fileStorageService.create();

    const error = await FileStorageDomain.create({
      names,
      fileStorageServiceId: fss.id,
      state: 'not a state',
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
    expect(error.errors[0].path).to.equal('state');
  });
});
