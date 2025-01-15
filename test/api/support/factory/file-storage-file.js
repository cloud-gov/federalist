const fileStorageService = require('./file-storage-service');
const { FileStorageFile } = require('../../../../api/models');

const counters = {};

function increment(key) {
  counters[key] = (counters[key] || 0) + 1;
  return `${key}-${counters[key]}`;
}

async function build(params = {}) {
  let {
    name,
    key,
    fileStorageServiceId = null,
    description = null,
    metadata = null,
  } = params;

  if (!name) {
    name = increment('file-storage-service');
  }

  if (!key) {
    key = increment('/key/path/');
  }

  if (!fileStorageServiceId) {
    const fss = await fileStorageService.create();
    fileStorageServiceId = fss.id;
  }

  return FileStorageFile.create({
    name,
    key,
    fileStorageServiceId,
    description,
    metadata,
  });
}

function create(params) {
  return build(params);
}

function truncate() {
  return FileStorageFile.truncate({
    force: true,
    cascade: true,
  });
}

module.exports = {
  build,
  create,
  truncate,
};
