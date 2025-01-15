const { expect } = require('chai');
const factory = require('../../support/factory');
const { FileStorageService, Site } = require('../../../../api/models');

describe('FileStorageService model', () => {
  afterEach(() =>
    Promise.all([
      FileStorageService.truncate(),
      factory.organization.truncate(),
      Site.truncate(),
    ]),
  );

  it('requires name, serviceName, serviceId, and organizationId', async () => {
    const name = 'test';
    const org = await factory.organization.create();
    const serviceId = 'abc-123';
    const serviceName = 'services1';

    const fss = await FileStorageService.create({
      name,
      organizationId: org.id,
      serviceId,
      serviceName,
    });

    expect(fss.name).to.equal(name);
    expect(fss.organizationId).to.equal(org.id);
    expect(fss.serviceId).to.equal(serviceId);
    expect(fss.serviceName).to.equal(serviceName);
    expect(fss.metadata).to.equal(null);
    expect(fss.siteId).to.equal(null);
    expect(fss.createdAt).to.be.instanceOf(Date);
    expect(fss.updatedAt).to.be.instanceOf(Date);
    expect(fss.deletedAt).to.equal(null);
  });

  it('allow multiple services with null siteId', async () => {
    const names = ['one', 'two', 'three', 'for'];
    const org = await factory.organization.create();

    await Promise.all(
      names.map(async (name, idx) => {
        const serviceId = `${name}-${idx}`;
        const serviceName = `${name}-service`;
        const fss = await FileStorageService.create({
          name,
          organizationId: org.id,
          serviceId,
          serviceName,
        });

        expect(fss.name).to.equal(name);
        expect(fss.organizationId).to.equal(org.id);
        expect(fss.metadata).to.equal(null);
        expect(fss.serviceId).to.equal(serviceId);
        expect(fss.serviceName).to.equal(serviceName);
        expect(fss.createdAt).to.be.instanceOf(Date);
        expect(fss.updatedAt).to.be.instanceOf(Date);
        expect(fss.deletedAt).to.equal(null);
      }),
    );
  });

  it('should take a valid, optional siteId foreign key', async () => {
    const name = 'test';
    const org = await factory.organization.create();
    const site = await factory.site();
    const serviceId = 'service-123';
    const serviceName = 'service-name';

    const fss = await FileStorageService.create({
      name,
      organizationId: org.id,
      siteId: site.id,
      serviceId,
      serviceName,
    });

    expect(fss.name).to.equal(name);
    expect(fss.organizationId).to.equal(org.id);
    expect(fss.metadata).to.equal(null);
    expect(fss.serviceId).to.equal(serviceId);
    expect(fss.serviceName).to.equal(serviceName);
    expect(fss.siteId).to.equal(site.id);
    expect(fss.createdAt).to.be.instanceOf(Date);
    expect(fss.updatedAt).to.be.instanceOf(Date);
    expect(fss.deletedAt).to.equal(null);
  });

  it('should error with non-unique siteId foreign key', async () => {
    const name = 'test';
    const org = await factory.organization.create();
    const site = await factory.site();
    const serviceId = 'service-123';
    const serviceName = 'service-name';

    const fss = await FileStorageService.create({
      name,
      organizationId: org.id,
      siteId: site.id,
      serviceId,
      serviceName,
    });

    expect(fss.name).to.equal(name);
    expect(fss.organizationId).to.equal(org.id);
    expect(fss.metadata).to.equal(null);
    expect(fss.serviceId).to.equal(serviceId);
    expect(fss.serviceName).to.equal(serviceName);
    expect(fss.siteId).to.equal(site.id);
    expect(fss.createdAt).to.be.instanceOf(Date);
    expect(fss.updatedAt).to.be.instanceOf(Date);
    expect(fss.deletedAt).to.equal(null);

    const error = await FileStorageService.create({
      name,
      organizationId: org.id,
      siteId: site.id,
      serviceId: 'service-456',
      serviceName: 'service-two',
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeUniqueConstraintError');
  });

  it('should error with invalid siteId foreign key', async () => {
    const name = 'test';
    const org = await factory.organization.create();
    const serviceId = 'service-123';
    const serviceName = 'service-name';

    const error = await FileStorageService.create({
      name,
      organizationId: org.id,
      siteId: '90210',
      serviceId,
      serviceName,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error without organizationId', async () => {
    const name = 'test';
    const serviceId = 'service-123';
    const serviceName = 'service-name';

    const error = await FileStorageService.create({
      name,
      organizationId: '123',
      serviceId,
      serviceName,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeForeignKeyConstraintError');
  });

  it('should error without `name`', async () => {
    const org = await factory.organization.create();

    const error = await FileStorageService.create({
      organizationId: org.id,
    }).catch((e) => e);

    expect(error).to.be.an('error');
    expect(error.name).to.eq('SequelizeValidationError');
  });
});
