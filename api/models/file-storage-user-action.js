const ACTION_TYPES = [
  'CREATE_SITE_FILE_STORAGE_SERVICE',
  'CREATE_ORGANIZATION_FILE_STORAGE_SERVICE',
  'UPLOAD_FILE',
  'RENAME_FILE',
  'MOVE_FILE',
  'DELETE_FILE',
].reduce((acc, cur) => {
  return { ...acc, [cur]: cur };
}, {});

function associate({ FileStorageFile, FileStorageService, FileStorageUserAction, User }) {
  FileStorageUserAction.belongsTo(FileStorageService, {
    foreignKey: 'fileStorageServiceId',
  });

  FileStorageUserAction.belongsTo(FileStorageFile, {
    foreignKey: 'fileStorageFileId',
  });

  FileStorageUserAction.belongsTo(User, {
    foreignKey: 'userId',
  });
}

function define(sequelize, DataTypes) {
  const FileStorageUserAction = sequelize.define(
    'FileStorageUserAction',
    {
      method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
      },
      metadata: {
        type: DataTypes.JSON,
      },
    },
    {
      tableName: 'file_storage_user_action',
      paranoid: false,
      timestamps: true,
      updatedAt: false,
    },
  );

  FileStorageUserAction.associate = associate;

  FileStorageUserAction.prototype.ACTION_TYPES = ACTION_TYPES;

  return FileStorageUserAction;
}

module.exports = define;
