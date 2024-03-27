const S3Helper = require('./S3Helper');
const CloudFoundryAPIClient = require('../utils/cfApiClient');

const apiClient = new CloudFoundryAPIClient();

function listTopLevelFolders(s3Client, path) {
  // Lists all top-level "folders" in the S3 bucket that start with
  // the given prefix path.

  // Pass the Delimiter option so that results are grouped
  // according to their "folder" paths
  return s3Client.listCommonPrefixes(path)
    .then(commonPrefixes => commonPrefixes.map(
      prefix => prefix.Prefix.split('/').slice(-2)[0]
    ));
}

function listFilesPaged(s3Client, path, startAtKey = null) {
  // Lists all the files in the S3 bucket that start
  // with the given prefix path.

  let prefixPath = path;
  // add a trailing slash to the prefix if not there already
  // to prevent getting files published at a repo whose name
  // is a superset of the given path name (ex: `mysite-2` and `mysite`).
  if (prefixPath[prefixPath.length - 1] !== '/') {
    prefixPath = `${prefixPath}/`;
  }

  return s3Client.listObjectsPaged(prefixPath, startAtKey)
    .then((pagedResults) => {
      const prefixComponents = path.split('/').length;
      const files = pagedResults.objects.map((file) => {
        // convenient name for display
        const name = file.Key.split('/').slice(prefixComponents).join('/');
        const size = Number(file.Size);
        return {
          name,
          size,
          key: file.Key,
        };
      });
      return {
        isTruncated: pagedResults.isTruncated,
        files,
      };
    })
}

function listPublishedPreviews(site) {
  const previewPath = `preview/${site.owner}/${site.repository}/`;
  return apiClient.fetchServiceInstanceCredentials(site.s3ServiceName)
    .then((credentials) => {
      const s3Client = new S3Helper.S3Client({
        accessKeyId: credentials.access_key_id,
        secretAccessKey: credentials.secret_access_key,
        region: credentials.region,
        bucket: credentials.bucket,
      });

      return listTopLevelFolders(s3Client, previewPath);
    });
}

function listPagedPublishedFilesForBranch(site, branch, startAtKey) {
  let filepath;
  if (site.defaultBranch === branch) {
    filepath = `site/${site.owner}/${site.repository}`;
  } else if (site.demoBranch === branch) {
    filepath = `demo/${site.owner}/${site.repository}`;
  } else {
    filepath = `preview/${site.owner}/${site.repository}/${branch}`;
  }

  return apiClient.fetchServiceInstanceCredentials(site.s3ServiceName)
    .then((credentials) => {
      const s3Client = new S3Helper.S3Client({
        accessKeyId: credentials.access_key_id,
        secretAccessKey: credentials.secret_access_key,
        region: credentials.region,
        bucket: credentials.bucket,
      });

      return listFilesPaged(s3Client, filepath, startAtKey);
    });
}

module.exports = { listPublishedPreviews, listPagedPublishedFilesForBranch };
