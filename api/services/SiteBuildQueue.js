const url = require('url');
const config = require('../../config');
const CloudFoundryAPIClient = require('../utils/cfApiClient');
const BullQueueClient = require('../utils/bullQueueClient');
const { buildViewLink, buildUrl } = require('../utils/build');
const GithubBuildHelper = require('./GithubBuildHelper');
const S3Helper = require('./S3Helper');

const apiClient = new CloudFoundryAPIClient();

const defaultBranch = build => build.branch === build.Site.defaultBranch;
const demoBranch = build => build.branch === build.Site.demoBranch;

const siteConfig = (build) => {
  let siteBuildConfig;
  if (defaultBranch(build)) {
    siteBuildConfig = build.Site.defaultConfig;
  } else if (demoBranch(build)) {
    siteBuildConfig = build.Site.demoConfig;
  } else {
    siteBuildConfig = build.Site.previewConfig;
  }
  return siteBuildConfig || {};
};

const baseURLForDomain = rawDomain => url.parse(rawDomain).path.replace(/(\/)+$/, '');

const sitePrefixForBuild = rawDomain => baseURLForDomain(rawDomain).replace(/^(\/)+/, '');

const baseURLForBuild = build => baseURLForDomain(buildViewLink(build, build.Site));

const statusCallbackURL = build => [
  url.resolve(config.app.hostname, '/v0/build'),
  build.id,
  'status',
  build.token,
].join('/');

const buildUEVs = uevs => (uevs
  ? uevs.map(uev => ({
    name: uev.name,
    ciphertext: uev.ciphertext,
  }))
  : []);

const generateDefaultCredentials = build => ({
  AWS_DEFAULT_REGION: config.s3.region,
  AWS_ACCESS_KEY_ID: config.s3.accessKeyId,
  AWS_SECRET_ACCESS_KEY: config.s3.secretAccessKey,
  STATUS_CALLBACK: statusCallbackURL(build),
  BUCKET: config.s3.bucket,
  BASEURL: baseURLForBuild(build),
  BRANCH: build.branch,
  CONFIG: JSON.stringify(siteConfig(build)),
  REPOSITORY: build.Site.repository,
  OWNER: build.Site.owner,
  SITE_PREFIX: sitePrefixForBuild(buildUrl(build, build.Site)),
  GITHUB_TOKEN: (build.User || {}).githubAccessToken, // temp hot-fix
  GENERATOR: build.Site.engine,
  BUILD_ID: build.id,
  USER_ENVIRONMENT_VARIABLES: JSON.stringify(buildUEVs(build.Site.UserEnvironmentVariables)),
});

const buildContainerEnvironment = async (build) => {
  const defaultCredentials = generateDefaultCredentials(build);

  if (!defaultCredentials.GITHUB_TOKEN) {
    defaultCredentials.GITHUB_TOKEN = await GithubBuildHelper.loadBuildUserAccessToken(build);
  }

  if (build.Site.s3ServiceName === config.s3.serviceName) {
    return defaultCredentials;
  }

  return apiClient
    .fetchServiceInstanceCredentials(build.Site.s3ServiceName)
    .then(credentials => ({
      ...defaultCredentials,
      AWS_DEFAULT_REGION: credentials.region,
      AWS_ACCESS_KEY_ID: credentials.access_key_id,
      AWS_SECRET_ACCESS_KEY: credentials.secret_access_key,
      BUCKET: credentials.bucket,
    }));
};

const setupBucket = async (build, buildCount) => {
  if (buildCount > 1) return true;

  const credentials = await apiClient.fetchServiceInstanceCredentials(build.Site.s3ServiceName);
  const {
    access_key_id, // eslint-disable-line
    bucket,
    region,
    secret_access_key, // eslint-disable-line
  } = credentials;

  const s3Client = new S3Helper.S3Client({
    accessKeyId: access_key_id,
    secretAccessKey: secret_access_key,
    bucket,
    region,
  });

  // Wait until AWS credentials are usable in case we had to
  // provision new ones. This may take up to 10 seconds.
  await s3Client.waitForCredentials();

  return true;
};

const SiteBuildQueue = {
  bullClient: new BullQueueClient('site-build-queue'),
};

SiteBuildQueue.messageBodyForBuild = build => buildContainerEnvironment(build)
  .then(environment => ({
    environment: Object.keys(environment).map(key => ({
      name: key,
      value: environment[key],
    })),
    containerName: build.Site.containerConfig.name,
    containerSize: build.Site.containerConfig.size,
  }));

SiteBuildQueue.sendBuildMessage = async (build, buildCount) => {
  const message = await SiteBuildQueue.messageBodyForBuild(build);
  await setupBucket(build, buildCount);

  return SiteBuildQueue.bullClient.add(message);
};

module.exports = SiteBuildQueue;
