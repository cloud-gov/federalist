const { pick } = require('../utils');

const dateFields = ['createdAt', 'updatedAt'];

const allowedFileStorageServiceFields = ['id', 'metadata', ...dateFields];

const serializeFileStorageService = (serializable) => {
  return pick(allowedFileStorageServiceFields, serializable.dataValues);
};

module.exports = {
  serializeFileStorageService,
};
