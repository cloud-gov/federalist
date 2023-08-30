const associate = ({
  BuildTaskType,
  BuildTask,
}) => {
  // Associations
  BuildTaskType.hasMany(BuildTask, {
    foreignKey: 'buildTaskTypeId',
  });
};

module.exports = (sequelize, DataTypes) => {
  const BuildTaskType = sequelize.define(
    'BuildTaskType',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
      },
    }, {
      tableName: 'build_task_type',
    }
  );

  BuildTaskType.associate = associate;
  return BuildTaskType;
};
