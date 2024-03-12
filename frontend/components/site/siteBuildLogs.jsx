/* eslint-disable react/forbid-prop-types */

import React from 'react';
import { Link, useParams } from 'react-router-dom';

import { useBuildLogs, useBuildDetails } from '../../hooks';
import LoadingIndicator from '../LoadingIndicator';
import SiteBuildLogTable from './siteBuildLogTable';
import DownloadBuildLogsButton from './downloadBuildLogsButton';
import CommitSummary from './CommitSummary';

export const REFRESH_INTERVAL = 15 * 1000;
const BUILD_LOG_RETENTION_LIMIT = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

function buildTooOld(build) {
  return (new Date() - new Date(build.completedAt)) > BUILD_LOG_RETENTION_LIMIT;
}

function getSiteBuildLogTable(buildDetails, logs, state) {
  if (logs && logs?.length > 0) {
    return <SiteBuildLogTable buildLogs={logs} buildState={state} />;
  }
  if (buildTooOld(buildDetails)) {
    return <SiteBuildLogTable buildLogs={['Builds more than 180 days old are deleted according to platform policy.']} />;
  }
  return <SiteBuildLogTable buildLogs={['This build does not have any build logs.']} />;
}

const SiteBuildLogs = () => {
  const { buildId: buildIdStr } = useParams();
  const buildId = parseInt(buildIdStr, 10);
  const { logs, state } = useBuildLogs(buildId);
  const { buildDetails, isLoading } = useBuildDetails(buildId);

  if (isLoading || !logs) {
    return <LoadingIndicator size="mini" text="Getting build log details..." />;
  }

  return (
    <div>
      <CommitSummary buildDetails={buildDetails} />
      <div className="log-tools">
        <ul className="usa-unstyled-list">
          {(process.env.FEATURE_BUILD_TASKS === 'active') && (
          <li><Link className="usa-button usa-button-secondary" to="./../scans">View scan results</Link></li>
          )}
          <li><DownloadBuildLogsButton buildId={buildId} buildLogsData={logs} /></li>
        </ul>
      </div>
      { getSiteBuildLogTable(buildDetails, logs, state) }
    </div>
  );
};

export default React.memo(SiteBuildLogs);
