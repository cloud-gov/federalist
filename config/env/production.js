const cfenv = require('cfenv');

const { APP_ENV, PRODUCT } = process.env;
const appEnv = cfenv.getAppEnv();

const { space_id: cfSpaceGuid } = appEnv.app;

const servicePrefix = `federalist-${APP_ENV}`;
const productPrefix = `${PRODUCT}-${APP_ENV}`;

// Database Config
const rdsCreds = appEnv.getServiceCreds(`${servicePrefix}-rds`);
if (rdsCreds) {
  module.exports.postgres = {
    database: rdsCreds.db_name,
    host: rdsCreds.host,
    user: rdsCreds.username,
    password: rdsCreds.password,
    port: rdsCreds.port,
    ssl: {
      rejectUnauthorized: false,
    },
  };
} else {
  throw new Error('No database credentials found.');
}

// Encryption Config
const encryptCreds = appEnv.getServiceCreds(`pages-${APP_ENV}-encryption`);

if (encryptCreds) {
  module.exports.encryption = {
    key: encryptCreds.key,
    algorithm: encryptCreds.algorithm,
  };
} else {
  throw new Error('No encryption key found');
}

// S3 Configs for Build Logs
const s3BuildLogsCreds = appEnv.getServiceCreds(`${servicePrefix}-s3-build-logs`);
if (s3BuildLogsCreds) {
  module.exports.s3BuildLogs = {
    accessKeyId: s3BuildLogsCreds.access_key_id,
    secretAccessKey: s3BuildLogsCreds.secret_access_key,
    region: s3BuildLogsCreds.region,
    bucket: s3BuildLogsCreds.bucket,
  };
} else {
  throw new Error('No S3 Build Logs credentials found');
}

// Redis Configs
const redisCreds = appEnv.getServiceCreds(`pages-${APP_ENV}-redis`);
if (redisCreds) {
  module.exports.redis = {
    url: redisCreds.uri,
    tls: {},
  };
} else {
  throw new Error('No Redis credentials found');
}

// Environment Variables
const cfDomain = appEnv.getServiceCreds(`${productPrefix}-domain`);
const cfProxy = appEnv.getServiceCreds(`${productPrefix}-proxy`);
const cfCdnSpaceName = process.env.CF_CDN_SPACE_NAME;
const cfDomainWithCdnPlanGuid = process.env.CF_DOMAIN_WITH_CDN_PLAN_GUID;
// optional environment variables
const newRelicAppName = process.env.NEW_RELIC_APP_NAME;
const newRelicLicenseKey = process.env.NEW_RELIC_LICENSE_KEY;

if (cfDomain && cfProxy) {
  module.exports.env = {
    cfDomainGuid: cfDomain.guid,
    cfProxyGuid: cfProxy.guid,
    cfSpaceGuid,
    cfCdnSpaceName,
    cfDomainWithCdnPlanGuid,
    newRelicAppName,
    newRelicLicenseKey,
  };
} else {
  throw new Error('Missing environment variables for build space.');
}

// See https://github.com/nfriedly/express-rate-limit/blob/master/README.md#configuration
// for all express-rate-limit options available
module.exports.rateLimiting = {
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 50, // limit each IP to 50 requests per window
};

// See https://github.com/nfriedly/express-slow-down/blob/master/README.md
// for all express-slow-down options available
module.exports.rateSlowing = {
  windowMs: 1 * 60 * 1000, // 1 minute window
  delayAfter: 25, // delay requests by delayMs after 25 are made in a window
  delayMs: 500, // delay requests by 500 ms
};

const cfUserEnvVar = appEnv.getServiceCreds(`${servicePrefix}-uev-key`);
module.exports.userEnvVar = {
  key: cfUserEnvVar.key,
};

const uaaCredentials = appEnv.getServiceCreds(`app-${APP_ENV}-uaa-client`);

module.exports.passport = {
  uaa: {
    options: uaaCredentials,
  },
};

const mailerCredentials = appEnv.getServiceCreds('mailer');

module.exports.mailer = {
  host: mailerCredentials.host,
  password: mailerCredentials.password,
  username: mailerCredentials.username,
};

const slackCredentials = appEnv.getServiceCreds('slack');

module.exports.slack = {
  url: slackCredentials.url,
};

module.exports.helmet = {
  contentSecurityPolicy: {
    directives: {
      'upgrade-insecure-requests': [],
    },
  },
};
