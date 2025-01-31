function associate({ FileStorageFile, FileStorageService, FileStorageUserAction }) {
  FileStorageFile.belongsTo(FileStorageService, {
    foreignKey: 'fileStorageServiceId',
  });

  FileStorageFile.hasMany(FileStorageUserAction, {
    foreignKey: 'fileStorageFileId',
  });

  FileStorageFile.addScope('getFileActions', (id) => ({
    include: [
      {
        model: FileStorageUserAction,
        where: { fileStorageFileid: id },
      },
    ],
  }));
}

function define(sequelize, DataTypes) {
  const FileStorageFile = sequelize.define(
    'FileStorageFile',
    {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
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
      tableName: 'file_storage_file',
      paranoid: true,
    },
  );

  FileStorageFile.associate = associate;
  FileStorageFile.getFileActions = (id) => ({
    method: ['getFileActions', id],
  });

  return FileStorageFile;
}

module.exports = define;
