const { Op } = require('sequelize');
const moment = require('moment');
const { toInt } = require('../utils');
const { sandboxDays } = require('../../config').app;

const associate = ({
  FileStorageService,
  Organization,
  OrganizationRole,
  Role,
  Site,
  User,
}) => {
  // Associations
  Organization.belongsToMany(User, {
    through: OrganizationRole,
    foreignKey: 'organizationId',
    otherKey: 'userId',
  });
  Organization.hasMany(FileStorageService, {
    foreignKey: 'organizationId',
  });
  Organization.hasMany(OrganizationRole, {
    foreignKey: 'organizationId',
  });
  Organization.hasMany(Site, {
    foreignKey: 'organizationId',
  });

  // Scopes
  Organization.addScope('byIdOrName', (search) => {
    const query = {};

    const id = toInt(search);
    if (id) {
      query.where = { id };
    } else {
      query.where = {
        name: {
          [Op.substring]: search,
        },
      };
    }
    return query;
  });

  Organization.addScope('forUser', (user) => ({
    include: [
      {
        model: User,
        required: true,
        where: {
          id: user.id,
        },
      },
      {
        model: OrganizationRole,
        required: true,
        where: {
          userId: user.id,
        },
      },
    ],
  }));

  Organization.addScope('forManagerRole', (user) => ({
    where: {
      isActive: true,
    },
    include: [
      {
        model: OrganizationRole,
        required: true,
        where: {
          userId: user.id,
        },
        include: [
          {
            model: Role,
            required: true,
            where: {
              name: 'manager',
            },
          },
        ],
      },
    ],
  }));

  Organization.addScope('byName', {
    order: [['name', 'ASC']],
  });
};

async function addRoleUser(user, roleName = 'user') {
  const org = this;
  const { Role } = this.sequelize.models;

  const role = await Role.findOne({
    where: {
      name: roleName,
    },
  });

  return org.addUser(user, {
    through: {
      roleId: role.id,
    },
  });
}

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    'Organization',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      isSandbox: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sandboxNextCleaningAt: {
        type: DataTypes.DATE,
      },
      daysUntilSandboxCleaning: {
        type: DataTypes.VIRTUAL,
        get() {
          if (!this.isSandbox || !this.sandboxNextCleaningAt) {
            return null;
          }
          const start = moment(this.sandboxNextCleaningAt).endOf('day');
          const diff = start.diff(moment().endOf('day'));
          return moment.duration(diff).asDays();
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      agency: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isSelfAuthorized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      paranoid: true,
      tableName: 'organization',
      hooks: {
        beforeValidate: (org) => {
          if (!org.isSandbox) {
            org.sandboxNextCleaningAt = null;
          } else if (!org.sandboxNextCleaningAt) {
            org.sandboxNextCleaningAt = moment().add(sandboxDays, 'days').endOf('day');
          }
        },
      },
    },
  );

  Organization.associate = associate;
  Organization.searchScope = (search) => ({
    method: ['byIdOrName', search],
  });
  Organization.forUser = (user) =>
    Organization.scope({
      method: ['forUser', user],
    });
  Organization.forManagerRole = (user) =>
    Organization.scope({
      method: ['forManagerRole', user],
    });
  Organization.prototype.addRoleUser = addRoleUser;
  return Organization;
};
