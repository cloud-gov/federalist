const { ArchiveBuildLogsQueue, ArchiveBuildLogsQueueName } = require('./ArchiveBuildLogsQueue');
const { BuildTasksQueue, BuildTasksQueueName } = require('./BuildTasksQueue');
const { DomainQueue, DomainQueueName } = require('./DomainQueue');
const { FailStuckBuildsQueue, FailStuckBuildsQueueName } = require('./FailStuckBuildsQueue');
const { MailQueue, MailQueueName } = require('./MailQueue');
const { NightlyBuildsQueue, NightlyBuildsQueueName } = require('./NightlyBuildsQueue');
const { ScheduledQueue, ScheduledQueueName } = require('./ScheduledQueue');
const { SiteBuildQueue, SiteBuildQueueName } = require('./SiteBuildQueue');
const { SiteBuildsQueue, SiteBuildsQueueName } = require('./SiteBuildsQueue');
const { SiteDeletionQueue, SiteDeletionQueueName } = require('./SiteDeletionQueue');
const { SlackQueue, SlackQueueName } = require('./SlackQueue');
const { TimeoutBuildTasksQueue, TimeoutBuildTasksQueueName } = require('./TimeoutBuildTasksQueue');

module.exports = {
  ArchiveBuildLogsQueue,
  ArchiveBuildLogsQueueName,
  BuildTasksQueue,
  BuildTasksQueueName,
  DomainQueue,
  DomainQueueName,
  FailStuckBuildsQueue,
  FailStuckBuildsQueueName,
  MailQueue,
  MailQueueName,
  NightlyBuildsQueue,
  NightlyBuildsQueueName,
  ScheduledQueue,
  ScheduledQueueName,
  SiteBuildQueue,
  SiteBuildQueueName,
  SiteBuildsQueue,
  SiteBuildsQueueName,
  SiteDeletionQueue,
  SiteDeletionQueueName,
  SlackQueue,
  SlackQueueName,
  TimeoutBuildTasksQueue,
  TimeoutBuildTasksQueueName,
};
