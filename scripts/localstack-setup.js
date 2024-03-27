const { S3Client, CreateBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const moment = require('moment');
const { Op } = require('sequelize');

const {
  Build,
  BuildTask,
  Site,
} = require('../api/models');
const BuildLogs = require('../api/services/build-logs');

const config = require('../config');

const s3 = new S3Client({
  region: 'us-gov-west-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const fakeHtml = `<html>
<head>
<title>site</title>
</head>
<body>
Website
</body>
</html>
`;

async function initSitesAndBuckets() {
  // create Build Logs bucket
  const cmd = new CreateBucketCommand({ Bucket: config.s3BuildLogs.bucket });
  await s3.send(cmd);

  // create a bucket and some files for each Site
  await Site.findAll()
    .then(async (sites) => {
      await Promise.all(sites.map(async (site) => {
        const siteCmd = new CreateBucketCommand({ Bucket: site.awsBucketName });
        await s3.send(siteCmd);
        const folders = ['site', 'demo'];
        folders.forEach(async (folder) => {
          const folderCmd = new PutObjectCommand({
            Body: fakeHtml,
            Bucket: site.awsBucketName,
            Key: `${folder}/${site.owner}/${site.repository}/index.html`,
          });
          await s3.send(folderCmd);
        });
        const fakePreviews = ['branch1', 'branch2', 'branch3'];
        fakePreviews.forEach(async (branch) => {
          const previewCmd = new PutObjectCommand({
            Body: fakeHtml,
            Bucket: site.awsBucketName,
            Key: `preview/${site.owner}/${site.repository}/${branch}/index.html`,
          });
          await s3.send(previewCmd);
        });
      }));
    })
    .catch(err => console.error(err));
}

// archive older build logs
async function archiveLogs() {
  const date = moment().subtract(3, 'days').startOf('day');

  const builds = await Build.findAll({
    attributes: ['id'],
    where: {
      completedAt: {
        [Op.lt]: date.toDate(),
      },
    },
  });

  console.log(`Found ${builds.length} builds.`);

  builds.forEach(build => BuildLogs.archiveBuildLogsForBuildId(build.id));
}

// create artifacts for Build Tasks
async function createBuildTaskArtifacts() {
  const artifactedTasks = await BuildTask.findAll({
    where: {
      artifact: {
        [Op.not]: null,
      },
    },
    include: [{ model: Build, include: [Site] }],
  });
  artifactedTasks.forEach((task) => {
    console.log(task.Build.Site)
    const artifactCmd = new PutObjectCommand({
      Body: fakeHtml,
      Bucket: task.Build.Site.awsBucketName,
      Key: task.artifact,
    });
    s3.send(artifactCmd);
  });
}

initSitesAndBuckets()
  .then(archiveLogs)
  .then(createBuildTaskArtifacts);
