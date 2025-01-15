const { Op } = require('sequelize');
const { toInt } = require('../utils');
const {
  isEmptyOrBranch,
  isEmptyOrUrl,
  isValidSubdomain,
} = require('../utils/validators');

const afterValidate = (site) => {
  if (site.defaultBranch === site.demoBranch) {
    const error = new Error('Default branch and demo branch cannot be the same');
    error.status = 403;
    throw error;
  }
  if (site.domain && site.domain === site.demoDomain) {
    const error = new Error('Domain and demo domain cannot be the same');
    error.status = 403;
    throw error;
  }
};

const validationFailed = (site, options, validationError) => {
  const messages = validationError.errors.map((err) => `${err.path}: ${err.message}`);

  const error = new Error(messages.join('\n'));
  error.status = 403;
  throw error;
};

const associate = ({
  Build,
  Domain,
  FileStorageService,
  Organization,
  OrganizationRole,
  Site,
  SiteBranchConfig,
  SiteBuildTask,
  User,
  UserAction,
  UserEnvironmentVariable,
}) => {
  // Associations
  Site.hasMany(Build, {
    foreignKey: 'site',
  });
  Site.hasMany(Domain, {
    foreignKey: 'siteId',
  });
  Site.hasMany(FileStorageService, {
    foreignKey: 'siteId',
  });
  Site.hasMany(SiteBranchConfig, {
    foreignKey: 'siteId',
  });
  Site.hasMany(UserAction, {
    as: 'userActions',
    foreignKey: 'siteId',
  });
  Site.hasMany(UserEnvironmentVariable, {
    foreignKey: 'siteId',
  });
  Site.belongsTo(Organization, {
    foreignKey: 'organizationId',
  });
  Site.hasMany(SiteBuildTask, {
    foreignKey: 'siteId',
  });

  // Scopes
  Site.addScope('byIdOrText', (search) => {
    const query = {};

    const id = toInt(search);
    if (id) {
      query.where = { id };
    } else {
      query.where = {
        [Op.or]: [
          {
            owner: {
              [Op.substring]: search,
            },
          },
          {
            repository: {
              [Op.substring]: search,
            },
          },
        ],
      };
    }
    return query;
  });
  Site.addScope('byOrg', (id) => ({
    include: [
      {
        model: Organization,
        where: { id },
      },
    ],
  }));
  // this name is a relic from when Site's had Users, now it describes Users
  // with access to the Site via an Organization
  // don't call this scope directly because it requires the below `includes`
  // from `withOrgUsers
  Site.addScope('forUser', (user) => ({
    where: {
      '$Organization.OrganizationRoles.userId$': user.id,
    },
  }));

  Site.addScope('withOrgUsers', () => ({
    include: [
      {
        model: Organization,
        required: false,
        include: [
          {
            model: OrganizationRole,
            include: User,
          },
        ],
      },
    ],
  }));
};

const beforeValidate = (site) => {
  if (site.repository) {
    site.repository = site.repository.toLowerCase();
  }
  if (site.owner) {
    site.owner = site.owner.toLowerCase();
  }
};

async function getOrgUsers() {
  const site = this;

  const { Site } = site.sequelize.models;

  const foundSite = await Site.withOrgUsers().findOne({ where: { id: site.id } });

  return foundSite.Organization.OrganizationRoles.map((role) => role.User);
}

module.exports = (sequelize, DataTypes) => {
  const Site = sequelize.define(
    'Site',
    {
      demoBranch: {
        type: DataTypes.STRING,
        validate: {
          isEmptyOrBranch,
        },
      },
      demoDomain: {
        type: DataTypes.STRING,
        validate: {
          isEmptyOrUrl,
        },
      },
      defaultConfig: {
        type: DataTypes.JSONB,
      },
      defaultBranch: {
        type: DataTypes.STRING,
        defaultValue: 'master',
        validate: {
          isEmptyOrBranch,
        },
      },
      domain: {
        type: DataTypes.STRING,
        validate: {
          isEmptyOrUrl,
        },
      },
      engine: {
        type: DataTypes.ENUM,
        values: ['hugo', 'jekyll', 'node.js', 'static'],
        defaultValue: 'static',
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      previewConfig: {
        type: DataTypes.JSONB,
      },
      demoConfig: {
        type: DataTypes.JSONB,
      },
      publishedAt: {
        type: DataTypes.DATE,
      },
      repository: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      repoLastVerified: {
        type: DataTypes.DATE,
        defaultValue: new Date(),
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      s3ServiceName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      awsBucketName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      awsBucketRegion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      awsBucketKeyUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      config: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isValidSubdomain,
        },
      },
      basicAuth: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.config.basicAuth || {};
        },
        set(basicAuth) {
          this.setDataValue('config', {
            ...this.config,
            basicAuth,
          });
        },
      },
      containerConfig: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.config.containerConfig || {};
        },
        set(containerConfig) {
          this.setDataValue('config', {
            ...this.config,
            containerConfig,
          });
        },
      },
      organizationId: {
        type: DataTypes.INTEGER,
        references: 'Organization',
      },
      webhookId: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: 'site',
      hooks: {
        beforeValidate,
        afterValidate,
        validationFailed,
      },
      paranoid: true,
    },
  );

  Site.associate = associate;
  Site.orgScope = (id) => ({
    method: ['byOrg', id],
  });
  Site.searchScope = (search) => ({
    method: ['byIdOrText', search],
  });
  Site.forUser = (user) =>
    Site.scope([{ method: ['forUser', user] }, { method: ['withOrgUsers'] }]);
  Site.withOrgUsers = () =>
    Site.scope({
      method: ['withOrgUsers'],
    });
  Site.domainFromContext = (context) => (context === 'site' ? 'domain' : 'demoDomain');
  Site.branchFromContext = (context) =>
    context === 'site' ? 'defaultBranch' : 'demoBranch';
  Site.prototype.getOrgUsers = getOrgUsers;
  return Site;
};
