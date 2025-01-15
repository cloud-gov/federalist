const { toInt } = require('../utils');

function associate({
  FileStorageDomain,
  FileStorageFile,
  FileStorageService,
  FileStorageUserAction,
  Organization,
  Site,
}) {
  // Associations
  FileStorageService.belongsTo(Organization, {
    foreignKey: 'organizationId',
  });

  FileStorageService.belongsTo(Site, {
    foreignKey: { name: 'siteId', allowNull: true },
  });

  FileStorageService.hasMany(FileStorageFile, {
    foreignKey: 'fileStorageServiceId',
  });

  FileStorageService.hasOne(FileStorageDomain, {
    foreignKey: 'fileStorageServiceId',
  });

  FileStorageService.hasMany(FileStorageUserAction, {
    foreignKey: 'fileStorageServiceId',
  });

  // Scopes
  FileStorageService.addScope('byId', (search) => {
    const id = toInt(search);

    return {
      where: { id },
    };
  });

  FileStorageService.addScope('bySite', (id) => ({
    include: [
      {
        model: Site,
        required: false,
        where: { id },
      },
    ],
  }));

  FileStorageService.addScope('byOrg', (id) => ({
    include: [
      {
        model: Organization,
        required: true,
        where: { id },
      },
    ],
  }));
}

function define(sequelize, DataTypes) {
  const FileStorageService = sequelize.define(
    'FileStorageService',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      serviceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      serviceName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'file_storage_service',
      paranoid: true,
    },
  );

  FileStorageService.associate = associate;

  FileStorageService.byId = (id) => ({
    method: ['byId', id],
  });
  FileStorageService.siteScope = (siteId) => ({
    method: ['bySite', siteId],
  });
  FileStorageService.orgScope = (orgId) => ({
    method: ['byOrg', orgId],
  });

  return FileStorageService;
}

module.exports = define;
