const userFactory = require('./user');
const { Site, SiteBranchConfig } = require('../../../../api/models');
const { generateSubdomain } = require('../../../../api/utils');

let siteAttsStep = 1;

function generateUniqueAtts() {
  const res = {
    owner: `repo-owner-${siteAttsStep}`,
    repository: `repo-name-${siteAttsStep}`,
    awsBucketName: `cg-bucket-name-${siteAttsStep}`,
    s3ServiceName: `s3-service-${siteAttsStep}`,
  };
  siteAttsStep += 1;
  return res;
}

function makeAttributes(overrides = {}) {
  let { users } = overrides;

  if (users === undefined) {
    users = Promise.all([userFactory()]);
  }

  const {
    owner, repository, awsBucketName, s3ServiceName,
  } = generateUniqueAtts();

  return {
    owner,
    repository,
    engine: 'jekyll',
    s3ServiceName,
    awsBucketName,
    awsBucketRegion: 'us-gov-west-1',
    defaultBranch: 'main',
    subdomain: generateSubdomain(owner, repository),
    users,
    ...overrides,
  };
}

async function addSiteBranchConfigs(site) {
  const {
    id: siteId,
    defaultBranch,
    demoBranch,
    defaultConfig,
    demoConfig,
    previewConfig,
    demoDomain
  } = site;

  if (defaultBranch) {
    await SiteBranchConfig.create({
      siteId,
      branch: defaultBranch,
      s3Key: `/site/${site.owner}/${site.repository}`,
      config: defaultConfig,
      context: 'site',
    });
  }

  if (demoBranch || demoDomain) {
    await SiteBranchConfig.create({
      siteId,
      s3Key: `/demo/${site.owner}/${site.repository}`,
      branch: demoBranch || 'demo',
      config: demoConfig || {},
      context: 'demo',
    });
  }

  if (previewConfig) {
    await SiteBranchConfig.create({
      siteId,
      config: previewConfig,
      context: 'preview',
    });
  }
}

function site(overrides, options = {}) {
  let site; // eslint-disable-line no-shadow
  let users;

  return Promise.props(makeAttributes(overrides))
    .then((attributes) => {
      users = attributes.users.slice();
      delete attributes.users; // eslint-disable-line no-param-reassign

      return Site.create(attributes);
    })
    .then(async (siteModel) => {
      site = siteModel;
      const userPromises = users.map((user) => site.addUser(user));
      if (!options.noSiteBranchConfig) {
        await addSiteBranchConfigs(site);
      }
      return Promise.all(userPromises);
    })
    .then(() => Site.findByPk(site.id, { include: SiteBranchConfig }));
}

module.exports = site;
