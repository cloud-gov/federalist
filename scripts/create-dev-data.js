/* eslint-disable no-console */
const { addDays, addMinutes } = require('date-fns');
Promise.props = require('promise-props');
const crypto = require('crypto');
const BuildLogs = require('../api/services/build-logs');
const { encrypt } = require('../api/services/Encryptor');
const EventCreator = require('../api/services/EventCreator');
const cleanDatabase = require('../api/utils/cleanDatabase');
const {
  ActionType,
  Build,
  BuildTaskType,
  BuildTask,
  BuildLog,
  Domain,
  Event,
  Organization,
  Role,
  SiteBuildTask,
  User,
  UserAction,
} = require('../api/models');
const { site: siteFactory } = require('../test/api/support/factory');

const loremIpsum = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  Nullam fringilla, arcu ut ultricies auctor, elit quam
  consequat neque, eu blandit metus lorem non turpis.
  Ut luctus nec turpis pellentesque dignissim. Vivamus
  porttitor tellus turpis, a tempor velit tincidunt at.
  Aenean laoreet nulla ut porta semper.
`.replace(/\s\s+/g, ' ');

const log = msg => `${new Date().toUTCString()} INFO [main] - ${msg}`;

function memberAddedPayload() {
  return {
    action: 'member_added',
    sender: {
      id: 693815,
      url: 'https://api.github.com/users/apburnes',
      type: 'User',
      login: 'apburnes',
      node_id: 'MDQ6VXNlcjY5MzgxNQ==',
      html_url: 'https://github.com/apburnes',
      gists_url: 'https://api.github.com/users/apburnes/gists{/gist_id}',
      repos_url: 'https://api.github.com/users/apburnes/repos',
      avatar_url: 'https://avatars.githubusercontent.com/u/693815?v=4',
      events_url: 'https://api.github.com/users/apburnes/events{/privacy}',
      site_admin: false,
      gravatar_id: '',
      starred_url:
        'https://api.github.com/users/apburnes/starred{/owner}{/repo}',
      followers_url: 'https://api.github.com/users/apburnes/followers',
      following_url:
        'https://api.github.com/users/apburnes/following{/other_user}',
      organizations_url: 'https://api.github.com/users/apburnes/orgs',
      subscriptions_url: 'https://api.github.com/users/apburnes/subscriptions',
      received_events_url:
        'https://api.github.com/users/apburnes/received_events',
    },
    membership: {
      url: 'https://api.github.com/orgs/federalist-users/memberships/maryclair',
      role: 'member',
      user: {
        id: 32960241,
        url: 'https://api.github.com/users/maryclair',
        type: 'User',
        login: 'maryclair',
        node_id: 'MDQ6VXNlcjMyOTYwMjQx',
        html_url: 'https://github.com/maryclair',
        gists_url: 'https://api.github.com/users/maryclair/gists{/gist_id}',
        repos_url: 'https://api.github.com/users/maryclair/repos',
        avatar_url: 'https://avatars.githubusercontent.com/u/32960241?v=4',
        events_url: 'https://api.github.com/users/maryclair/events{/privacy}',
        site_admin: false,
        gravatar_id: '',
        starred_url:
          'https://api.github.com/users/maryclair/starred{/owner}{/repo}',
        followers_url: 'https://api.github.com/users/maryclair/followers',
        following_url:
          'https://api.github.com/users/maryclair/following{/other_user}',
        organizations_url: 'https://api.github.com/users/maryclair/orgs',
        subscriptions_url:
          'https://api.github.com/users/maryclair/subscriptions',
        received_events_url:
          'https://api.github.com/users/maryclair/received_events',
      },
      state: 'pending',
      organization_url: 'https://api.github.com/orgs/federalist-users',
    },
    organization: {
      id: 14109682,
      url: 'https://api.github.com/orgs/federalist-users',
      login: 'federalist-users',
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjE0MTA5Njgy',
      hooks_url: 'https://api.github.com/orgs/federalist-users/hooks',
      repos_url: 'https://api.github.com/orgs/federalist-users/repos',
      avatar_url: 'https://avatars.githubusercontent.com/u/14109682?v=4',
      events_url: 'https://api.github.com/orgs/federalist-users/events',
      issues_url: 'https://api.github.com/orgs/federalist-users/issues',
      description: 'federalist.18f.gov Users',
      members_url:
        'https://api.github.com/orgs/federalist-users/members{/member}',
      public_members_url:
        'https://api.github.com/orgs/federalist-users/public_members{/member}',
    },
  };
}

function socketIOError() {
  return {
    error:
      "AbortError: PUBLISH can't be processed. The connection is already closed.\n at handle_offline_command (/home/vcap/app/node_modules/redis/index.js:779:15)\n at RedisClient.internal_send_command (/home/vcap/app/node_modules/redis/index.js:813:9)\n at RedisClient.publish (/home/vcap/app/node_modules/redis/lib/commands.js:46:25)\n at RedisAdapter.broadcast (/home/vcap/app/node_modules/socket.io-redis/dist/index.js:265:28)\n at Namespace.emit (/home/vcap/app/node_modules/socket.io/dist/namespace.js:175:22)\n at Server.<computed> [as emit] (/home/vcap/app/node_modules/socket.io/dist/index.js:445:33)\n at emitBuildStatus (/home/vcap/app/api/controllers/build.js:32:30)\n at runMicrotasks (<anonymous>)\n at processTicksAndRejections (internal/process/task_queues.js:93:5)",
    message: 'redisAdapter pubClient error',
  };
}

function randomGitSha() {
  return crypto.createHash('sha1').update(crypto.randomBytes(30)).digest('hex');
}

// Chainable helpers
async function createUAAIdentity(user) {
  await user.createUAAIdentity({
    uaaId: `${user.username}-placeholder-id`,
    email: `${user.username}@example.com`,
    userName: `${user.username}@example.com`,
    origin: 'example.com',
  });
  return user;
}

async function addUserToOrg(user, org, role) {
  await org.addUser(user, { through: { roleId: role.id } });
  return user;
}

async function addSiteToOrg(site, org) {
  await org.addSite(site);
  return site;
}

/** *****************************************
 *        Where the magic happens!!
 */
async function createData() {
  console.log('Cleaning database...');
  await cleanDatabase();

  /** *****************************************
   *              Action Types
   */
  console.log('Creating default action types...');
  await ActionType.createDefaultActionTypes();

  /** *****************************************
   *                  Roles
   */
  console.log('Creating Roles');
  const [userRole, managerRole] = await Promise.all([
    Role.create({ name: 'user' }),
    Role.create({ name: 'manager' }),
  ]);

  /** *****************************************
   *              Organizations
   */
  console.log('Creating Organizations');
  const [agency1, agency2, agency3, agency4, sandbox] = await Promise.all([
    Organization.create({ name: 'agency1', agency: 'GSA' }),
    Organization.create({ name: 'agency2', agency: 'GSA' }),
    Organization.create({
      name: 'agency3',
      agency: 'Bureau of Testing',
      isSelfAuthorized: true,
    }),
    Organization.create({
      name: 'agency4',
      agency: 'Demonstration Department',
    }),
    Organization.create({ name: 'user1@example.com', isSandbox: true }),
  ]);

  /** *****************************************
   *                 Users
   */
  console.log('Creating users...');
  const [
    user1,
    user2,
    user3,
    user4,
    userOrgless,
    managerNoGithub,
    managerWithGithub,
  ] = await Promise.all([
    /**
     * Fake users
     */

    // Users with Github credentials
    User.create({
      username: 'user1',
      email: 'user1@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    }).then(async (user) => {
      await Promise.all([
        createUAAIdentity(user),
        addUserToOrg(user, agency1, userRole),
        addUserToOrg(user, agency2, userRole),
        addUserToOrg(user, sandbox, managerRole),
      ]);
      return user;
    }),

    User.create({
      username: 'user2',
      email: 'user2@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    })
      .then(createUAAIdentity)
      .then(user => addUserToOrg(user, agency1, userRole)),

    User.create({
      username: 'user3',
      email: 'user3@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    })
      .then(createUAAIdentity)
      .then(user => addUserToOrg(user, agency3, userRole)),

    User.create({
      username: 'user4',
      email: 'user4@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    })
      .then(createUAAIdentity)
      .then(user => addUserToOrg(user, agency4, userRole)),

    User.create({
      username: 'userorgless',
      email: 'userorgless@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    }).then(createUAAIdentity),

    // Manager without Github credentials
    User.create({ username: 'manager_no_github' })
      .then(createUAAIdentity)
      .then(user => addUserToOrg(user, agency1, managerRole)),

    // Manager with Github credentials
    User.create({
      username: 'manager_with_github',
      email: 'manager_with_github@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    })
      .then(createUAAIdentity)
      .then(user => addUserToOrg(user, agency1, userRole))
      .then(user => addUserToOrg(user, agency2, managerRole)),

    User.create({
      username: 'support_role',
      email: 'support_role@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    }).then(createUAAIdentity),

    /**
     * Actual Github users
     *
     * Initialized without Github credentials so we can test the process
     */
    User.create({
      username: 'hursey013',
      adminEmail: 'brian.hurst@gsa.gov',
    }).then(createUAAIdentity),

    User.create({ username: 'svenaas', adminEmail: 'sven.aas@gsa.gov' }).then(
      createUAAIdentity
    ),

    User.create({
      username: 'apburnes',
      adminEmail: 'andrew.burnes@gsa.gov',
    }).then(createUAAIdentity),

    User.create({
      username: 'davemcorwin',
      adminEmail: 'david.corwin@gsa.gov',
    }).then(createUAAIdentity),

    // User without UAA
    User.create({
      username: 'user_no_uaa',
      email: 'user_no_uaa@example.com',
      githubAccessToken: 'access-token',
      githubUserId: 123456,
    }),

    // Auditor
    User.create({
      username: process.env.USER_AUDITOR,
      email: 'auditor@example.com',
    }),
  ]);

  /** *****************************************
   *                 Sites
   */
  console.log('Creating sites...');
  const [site1, nodeSite, goSite, goSite2, nodeSite2, orglessSite] = await Promise.all([
    siteFactory({
      demoBranch: 'demo-branch',
      demoDomain: 'https://demo.example.gov',
      domain: 'https://example.gov',
      owner: user1.username,
      repository: 'example-site',
      users: [user1, userOrgless],
      defaultConfig: { hello: 'world' },
    }),

    siteFactory({
      engine: 'node.js',
      owner: user1.username,
      repository: 'example-node-site',
      users: [user1, managerWithGithub],
      demoBranch: 'demo1',
      previewConfig: { hello: 'preview' },
    }).then(site => addSiteToOrg(site, agency1)),

    siteFactory({
      engine: 'hugo',
      owner: user1.username,
      repository: 'example-go-site',
      users: [user1, user2, managerNoGithub],
    }).then(site => addSiteToOrg(site, agency2)),

    siteFactory({
      engine: 'hugo',
      owner: user3.username,
      repository: 'another-example-hugo-site',
      users: [user3, managerWithGithub],
      demoBranch: 'demo3',
    }).then(site => addSiteToOrg(site, agency3)),

    siteFactory({
      engine: 'node.js',
      owner: user4.username,
      repository: 'another-example-node-site',
      users: [user4, managerWithGithub],
      demoBranch: 'demo4',
    }).then(site => addSiteToOrg(site, agency4)),

    siteFactory({
      engine: 'node.js',
      owner: userOrgless.username,
      repository: 'an-orgless-node-site',
      users: [userOrgless, managerWithGithub],
      demoBranch: 'demo5',
    }),
  ]);

  await site1.createUserEnvironmentVariable({
    name: 'MY_ENV_VAR',
    ...encrypt('supersecretstuff', 'ABC123ABC123ABC123ABC123ABC123'),
  });

  /** *****************************************
   *                 Builds
   */
  console.log('Creating builds...');
  const site1Builds = await Promise.all([
    Build.create({
      branch: site1.defaultBranch,
      completedAt: new Date(),
      source: 'fake-build',
      state: 'success',
      site: site1.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
      requestedCommitSha: randomGitSha(),
    }),
    Build.create({
      branch: site1.defaultBranch,
      source: 'fake-build',
      site: site1.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
      requestedCommitSha: randomGitSha(),
    }),
    Build.create({
      branch: site1.demoBranch,
      source: 'fake-build',
      site: site1.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
      state: 'error',
      error: 'Something bad happened here',
      completedAt: addDays(new Date(), -6),
    }).then(build => build.update({
      requestedCommitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe2',
      clonedCommitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe2',
    })),
  ]);

  const nodeSiteBuilds = await Promise.all([
    // default
    Build.create({
      branch: nodeSite.defaultBranch,
      source: 'fake-build',
      createdAt: new Date(),
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: 'be146bd919dcc2cb8675ccbc2d023f40f82a2dea',
      requestedCommitSha: 'be146bd919dcc2cb8675ccbc2d023f40f82a2dea',
    })),
    // skipped, looks like created
    Build.create({
      branch: nodeSite.defaultBranch,
      createdAt: addMinutes(new Date(), -2),
      source: 'fake-build',
      state: 'skipped',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: '46bd919dcc2cb8675ccbc2d023f40f82a2deabe1',
      requestedCommitSha: '46bd919dcc2cb8675ccbc2d023f40f82a2deabe1',
    })),
    // queued, looks like created
    Build.create({
      branch: 'longer-branch-names-might-be-truncated',
      createdAt: new Date(),
      source: 'fake-build',
      state: 'queued',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: '2d023f40f82a2deabe157ce109dcc2cb8675ccbc',
      requestedCommitSha: '2d023f40f82a2deabe157ce109dcc2cb8675ccbc',
    })),
    // in progress
    Build.create({
      branch: nodeSite.defaultBranch,
      startedAt: addMinutes(new Date(), -1),
      createdAt: addMinutes(new Date(), -1),
      source: 'fake-build',
      state: 'processing',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: '3f40f82a2deabe157ce109dcc2cb8675ccbc2d02',
      requestedCommitSha: '3f40f82a2deabe157ce109dcc2cb8675ccbc2d02',
    })),
    // error/timed out
    Build.create({
      branch: nodeSite.defaultBranch,
      completedAt: addMinutes(new Date(), -1200),
      startedAt: addMinutes(new Date(), -1200),
      createdAt: addMinutes(new Date(), -1200),
      source: 'fake-build',
      state: 'error',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
      error: 'The build timed out',
    }).then(build => build.update({
      clonedCommitSha: '2a2deabe157ce109dcc2cb8675ccbc2d023f40f8',
      requestedCommitSha: '2a2deabe157ce109dcc2cb8675ccbc2d023f40f8',
    })),
    // completed on default branch
    Build.create({
      branch: nodeSite.defaultBranch,
      completedAt: addMinutes(new Date(), -12),
      startedAt: addMinutes(new Date(), -9),
      createdAt: addMinutes(new Date(), -9),
      source: 'fake-build',
      state: 'success',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: '40f82a2deabe157ce109dcc2cb8675ccbc2d023f',
      requestedCommitSha: '40f82a2deabe157ce109dcc2cb8675ccbc2d023f',
    })),
    // completed on another branch
    Build.create({
      branch: 'longer-branch-names-might-be-truncated',
      completedAt: addMinutes(new Date(), -56),
      startedAt: addMinutes(new Date(), -54),
      createdAt: addMinutes(new Date(), -54),
      source: 'fake-build',
      state: 'success',
      site: nodeSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }).then(build => build.update({
      clonedCommitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1',
      requestedCommitSha: '57ce109dcc2cb8675ccbc2d023f40f82a2deabe1',
    })),
  ]);

  const taskType1 = await BuildTaskType.create({
    name: 'OWASP ZAP Vulnerability Scan',
    description: 'This scan identifies potential website security issues like unintended exposure of sensitive data, SQL injection opportunities, cross-site scripting (XSS) flaws, and the use of components with known vulnerabilities.',
    metadata: {
      foo: 'bar', // no metadata is real/used yet
    },
    runner: 'cf_task',
    startsWhen: 'build',
    url: 'https://cloud.gov/pages/documentation/build-scans/',
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[0].id,
    buildTaskTypeId: taskType1.id,
    name: 'type',
    artifact: null,
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[2].id,
    buildTaskTypeId: taskType1.id,
    name: 'type',
    status: 'created', // initial value, 'processing' or 'queued' haven't been made yet
    artifact: null,
    message: 'Scan in progress',
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[4].id,
    buildTaskTypeId: taskType1.id,
    name: 'type',
    status: 'error',
    artifact: null,
    message: 'Scan could not be completed',
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[5].id,
    buildTaskTypeId: taskType1.id,
    name: 'type',
    status: 'success',
    artifact: 'filename-1234.html',
    message: 'Scan successfully completed. See artifact for details.',
    count: 0,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[6].id,
    buildTaskTypeId: taskType1.id,
    name: 'type',
    status: 'success',
    artifact: 'filename-1234.html',
    message: 'Scan successfully completed. See artifact for details.',
    count: 42,
  });

  const taskType2 = await BuildTaskType.create({
    name: 'WCAG 2.2 AA Accessibility Scan',
    description: 'This scan detects accessibility issues and provides suggestions for remediation by inspecting focusable elements, HTML tags and attributes, images, data tables, color contrast, document structure, link and button usability, and visually hidden content against the WC3’s WCAG 2.2 Level A and AA requirements.',
    metadata: {
      foo: 'bar', // no metadata is real/used yet
    },
    runner: 'cf_task',
    startsWhen: 'build',
    url: 'https://cloud.gov/pages/documentation/build-scans/',
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[0].id,
    buildTaskTypeId: taskType2.id,
    name: 'type',
    artifact: null,
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[2].id,
    buildTaskTypeId: taskType2.id,
    name: 'type',
    status: 'created', // initial value, 'processing' or 'queued' haven't been made yet
    artifact: null,
    message: 'Scan in progress',
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[4].id,
    buildTaskTypeId: taskType2.id,
    name: 'type',
    status: 'error',
    artifact: null,
    message: 'Scan could not be completed',
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[5].id,
    buildTaskTypeId: taskType2.id,
    name: 'type',
    status: 'error',
    artifact: null,
    message: 'Scan could not be completed',
    count: null,
  });
  await BuildTask.create({
    buildId: nodeSiteBuilds[6].id,
    buildTaskTypeId: taskType2.id,
    name: 'type',
    status: 'success',
    artifact: 'WCAG-scan.txt',
    message: 'Scan successfully completed. See artifact for details.',
    count: 3,
  });

  // task "hook" for each site
  await SiteBuildTask.create({
    siteId: nodeSite.id,
    buildTaskTypeId: taskType1.id,
    branch: 'test',
    metadata: {
      nightly: true, // no metadata is real/used yet
    },
  });
  // task "hook" for each site
  await SiteBuildTask.create({
    siteId: nodeSite.id,
    buildTaskTypeId: taskType2.id,
    branch: 'test',
    metadata: {
      nightly: true, // no metadata is real/used yet
    },
  });

  const goSiteBuilds = await Promise.all([
    Build.create({
      branch: goSite.defaultBranch,
      completedAt: addDays(new Date(), -14),
      source: 'fake-build',
      state: 'success',
      site: goSite.id,
      user: user1.id,
      username: user1.username,
      token: 'fake-token',
    }),
  ]);

  /** *****************************************
   *               Build Logs
   */
  console.log('Creating build logs...');
  await BuildLog.bulkCreate([
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[0].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step2',
      build: site1Builds[0].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[1].id,
    },
    {
      output: loremIpsum,
      source: 'fake-build-step1',
      build: site1Builds[2].id,
    },
    {
      output: log('This log should not be visible'),
      source: 'fake-build-step1',
      build: nodeSiteBuilds[0].id,
    },
  ]);

  await BuildLog.bulkCreate(
    Array(20)
      .fill(0)
      .map(() => ({
        output: log('This log has a source of ALL'),
        source: 'ALL',
        build: nodeSiteBuilds[0].id,
      }))
  );

  await BuildLog.bulkCreate(
    Array(5000)
      .fill(0)
      .map((_v, idx) => ({
        output: log(
          `Message ${idx} - A much longer log message to test that the horizontal scrolling is working the way we want.`
        ),
        source: 'ALL',
        build: goSiteBuilds[0].id,
      }))
  );

  console.log('Uploading logs to S3');
  try {
    await BuildLogs.archiveBuildLogs(nodeSite, nodeSiteBuilds[0]);
  } catch (error) {
    console.error(
      'Failed to upload logs to S3, probably because the credentials are not configured locally. This can be ignored.'
    );
  }

  /** *****************************************
   *              User Actions
   */
  console.log('Creating user actions...');
  const removeAction = await ActionType.findOne({
    where: { action: 'remove' },
  });
  await UserAction.create({
    userId: user1.id,
    targetId: user2.id,
    targetType: 'user',
    actionId: removeAction.id,
    siteId: site1.id,
  });

  /** *****************************************
   *                Events
   */
  console.log('Creating Events');
  await Promise.all([
    EventCreator.audit(Event.labels.AUTHENTICATION, user1, 'UAA login'),
    EventCreator.audit(Event.labels.AUTHENTICATION, user2, 'UAA login'),
    EventCreator.audit(
      Event.labels.AUTHENTICATION,
      user1,
      'member_added',
      memberAddedPayload()
    ),
  ]);

  console.log('Creating Error Events');
  await Promise.all([
    EventCreator.error(
      Event.labels.REQUEST_HANDLER,
      new Error('A sample error'),
      { some: 'info' }
    ),
    EventCreator.error(Event.labels.REQUEST_HANDLER, socketIOError, {
      some: 'info',
    }),
  ]);

  /** *****************************************
   *                Domains
   */
  console.log('Creating Domains');
  await Promise.all([
    Domain.create({
      siteBranchConfigId: site1.SiteBranchConfigs[0].id,
      names: 'www.agency.gov',
      siteId: site1.id,
    }),
    Domain.create({
      siteBranchConfigId: nodeSite.SiteBranchConfigs[0].id,
      names: 'www.example.gov',
      siteId: nodeSite.id,
    }),
    Domain.create({
      siteBranchConfigId: nodeSite.SiteBranchConfigs[1].id,
      names: 'demo.example.gov',
      siteId: nodeSite.id,
    }),
    Domain.create({
      siteBranchConfigId: nodeSite.SiteBranchConfigs[1].id,
      names: 'foo.example.gov,www.example.gov',
      siteId: nodeSite.id,
      origin: 'foo-bar-baz.app.cloud.gov',
      path: `/site/${nodeSite.owner}/${nodeSite.repository}`,
      serviceName: 'foo.example.gov-ext',
      state: 'provisioned',
    }),
    Domain.create({
      siteBranchConfigId: goSite2.SiteBranchConfigs[0].id,
      names: 'bar.example.gov',
      siteId: goSite2.id,
      origin: 'bar-foo-baz.app.cloud.gov',
      path: `/site/${nodeSite.owner}/${nodeSite.repository}`,
      serviceName: 'bar.example.gov-ext',
      state: 'provisioned',
    }),
    Domain.create({
      siteBranchConfigId: nodeSite2.SiteBranchConfigs[0].id,
      names: 'qux.example.gov',
      siteId: nodeSite2.id,
      origin: 'quz-baz-bar.app.cloud.gov',
      path: `/site/${nodeSite2.owner}/${nodeSite2.repository}`,
      serviceName: 'qux.example.gov-ext',
      state: 'provisioned',
    }),
    Domain.create({
      siteBranchConfigId: nodeSite2.SiteBranchConfigs[1].id,
      names: 'vanity.qux.example.gov',
      siteId: nodeSite2.id,
      origin: 'quz-baz-bar.app.cloud.gov',
      path: `/site/${nodeSite2.owner}/${nodeSite2.repository}`,
      serviceName: 'vanity.qux.example.gov-ext',
      state: 'provisioned',
    }),
    Domain.create({
      siteBranchConfigId: orglessSite.SiteBranchConfigs[0].id,
      names: 'orgless.example.gov',
      siteId: orglessSite.id,
      origin: 'orgless.app.cloud.gov',
      path: `/site/${orglessSite.owner}/${orglessSite.repository}`,
      serviceName: 'orgless.example.gov-ext',
      state: 'provisioned',
    }),
  ]);
}

console.log('This will DELETE all data in your development database.');
createData()
  .then(() => {
    console.log('Done!');
    console.log(
      'You may have to log out and then back in to your local development instance of Federalist.'
    );
    process.exit();
  })
  .catch((error) => {
    console.error('Uh oh, we have a problem!');
    console.error(error);
    process.exit(1);
  });
