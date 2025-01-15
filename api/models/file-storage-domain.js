const { buildEnum } = require('../utils');
const { isDelimitedFQDN } = require('../utils/validators');

const States = buildEnum([
  'pending',
  'provisioning',
  'failed',
  'provisioned',
  'deprovisioning',
]);

function associate({ FileStorageDomain, FileStorageService }) {
  // Associations
  FileStorageDomain.belongsTo(FileStorageService, {
    foreignKey: 'fileStorageServiceId',
  });

  // Scopes
  FileStorageDomain.addScope('bySerivce', (id) => ({
    include: [
      {
        model: FileStorageService,
        where: { id },
      },
    ],
  }));

  FileStorageDomain.addScope('byState', (state) => ({
    where: {
      state,
    },
  }));
}

function define(sequelize, DataTypes) {
  const FileStorageDomain = sequelize.define(
    'FileStorageDomain',
    {
      names: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isDelimitedFQDN,
        },
      },
      serviceName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      serviceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM,
        values: States.values,
        defaultValue: States.Pending,
        allowNull: false,
        validate: {
          isIn: [States.values],
        },
      },
      metadata: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'file_storage_domain',
      paranoid: true,
    },
  );

  FileStorageDomain.associate = associate;
  FileStorageDomain.siteScope = (serviceId) => ({
    method: ['bySerice', serviceId],
  });
  FileStorageDomain.stateScope = (state) => ({
    method: ['byState', state],
  });
  FileStorageDomain.States = States;
  FileStorageDomain.prototype.isPending = function isPending() {
    return this.state === FileStorageDomain.States.Pending;
  };
  FileStorageDomain.prototype.isProvisioning = function isProvisioning() {
    return this.state === FileStorageDomain.States.Provisioning;
  };
  FileStorageDomain.prototype.namesArray = function namesArray() {
    return this.names.split(',');
  };
  FileStorageDomain.prototype.firstName = function firstName() {
    return this.namesArray()[0];
  };
  return FileStorageDomain;
}

module.exports = define;
