const { Sequelize, DataTypes } = require('sequelize');
const { postgres } = require('../../config');
const { databaseLogger } = require('../../winston');

const { database, host, password, port, ssl, user: username, retry } = postgres;

const sequelize = new Sequelize(database, username, password, {
  dialect: 'postgres',
  dialectOptions: { ssl },
  host,
  port,
  logging: databaseLogger.info.bind(databaseLogger),
  retry,
});

// Add a permanent global hook to prevent unknowingly hitting this Sequelize bug:
//   https://github.com/sequelize/sequelize/issues/10557#issuecomment-481399247
sequelize.addHook('beforeCount', function (options) {
  if (this._scope.include && this._scope.include.length > 0) {
    options.distinct = true;
    options.col = this._scope.col || options.col || `"${this.options.name.singular}".id`;
  }

  if (options.include && options.include.length > 0) {
    options.include = null;
  }
});

require('./build')(sequelize, DataTypes);
require('./build-log')(sequelize, DataTypes);
require('./build-task-type')(sequelize, DataTypes);
require('./build-task')(sequelize, DataTypes);
require('./file-storage-domain')(sequelize, DataTypes);
require('./file-storage-file')(sequelize, DataTypes);
require('./file-storage-service')(sequelize, DataTypes);
require('./file-storage-user-action')(sequelize, DataTypes);
require('./site')(sequelize, DataTypes);
require('./site-branch-config')(sequelize, DataTypes);
require('./site-build-task')(sequelize, DataTypes);
require('./user')(sequelize, DataTypes);
require('./user-action')(sequelize, DataTypes);
require('./action-type')(sequelize, DataTypes);
require('./user-environment-variable')(sequelize, DataTypes);
require('./event')(sequelize, DataTypes);
require('./role')(sequelize, DataTypes);
require('./organization')(sequelize, DataTypes);
require('./organization-role')(sequelize, DataTypes);
require('./uaa-identity')(sequelize, DataTypes);
require('./domain')(sequelize, DataTypes);

Object.keys(sequelize.models)
  .map((key) => sequelize.models[key])
  .filter((model) => model.associate)
  .forEach((model) => model.associate(sequelize.models));

module.exports = {
  sequelize,
  ...sequelize.models,
};
