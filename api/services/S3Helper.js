const {
  S3,
  paginateListObjectsV2,
  PutObjectCommand,
  GetObjectCommand,
  waitUntilBucketExists,
  DeleteObjectsCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const S3_DEFAULT_MAX_KEYS = 1000;

class S3Client {
  constructor(credentials) {
    this.bucket = credentials.bucket;
    this.client = new S3({
      region: credentials.region,
      // https://docs.localstack.cloud/user-guide/integrations/sdks/javascript/
      // TODO: this might break dev; don't merge without fixing
      forcePathStyle: process.env.NODE_ENV === 'development',
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      },
    });
  }

  async waitForBucket() {
    const { bucket, client } = this;
    await waitUntilBucketExists({ client, maxWaitTime: 60 }, { Bucket: bucket });
  }

  async listHelper(prefix, property) {
    /*
     * Iterates over pages of S3 Objects starting with the given prefix
     * in the bucket defined in the application's config.s3 object,
     * and returns a collection accumulating the specified property
     * from the results (e.g. `CommonPrefixes` or `Contents`).
     */
    const paginationsConfig = { client: this.client };
    const listCommandInput = { Bucket: this.bucket, Prefix: prefix, Delimiter: '/' };
    const paginator = paginateListObjectsV2(paginationsConfig, listCommandInput);
    const results = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
      if (page.KeyCount > 0) {
        results.push(...page[property]);
      }
    }

    return results;
  }

  async listCommonPrefixes(prefix) {
    /*
     * Returns a promise that resolves to an array of
     * the "Common Prefixes" of the S3 Objects
     * starting with the given prefix in the bucket
     * defined in the application's config.s3 object.
     */
    return this.listHelper(prefix, 'CommonPrefixes');
  }

  async listObjects(prefix) {
    /*
     * Returns a promise that resolves to an array of
     * the S3 Objects starting with the given prefix in
     * the bucket defined in the application's config.s3 object.
     */
    return this.listHelper(prefix, 'Contents');
  }

  async listObjectsPaged(prefix, startAfterKey = null, totalMaxObjects = 200) {
    /*
     * Returns a promise that resolves to a potentially-truncated array of
     * the S3 Objects starting with the given prefix in
     * the bucket defined in the application's config.s3 object.
     * The object resolved by the promise will include an `isTruncated` flag
     * to indicate if the `files` array is truncated.
     */
    const maxKeys = Math.min(S3_DEFAULT_MAX_KEYS, totalMaxObjects);

    const paginationsConfig = {
      client: this.client,
      pageSize: maxKeys,
    };
    const listCommandInput = {
      Bucket: this.bucket,
      Prefix: prefix,
      Delimiter: '/',
      StartAfter: startAfterKey,
    };

    const paginator = paginateListObjectsV2(paginationsConfig, listCommandInput);
    const objects = [];

    let wereS3ResultsTruncated = false;
    // Concatenate S3 pages until there are enough for OUR page size
    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
      objects.push(...page.Contents);
      if (objects.length >= totalMaxObjects) {
        break;
      }
      wereS3ResultsTruncated = page.isTruncated;
    }

    // Truncate results before returning if there are more than our page size
    const truncatedObjects = objects.slice(0, totalMaxObjects);
    const isTruncated = (wereS3ResultsTruncated || truncatedObjects.length < objects.length);

    return {
      isTruncated,
      objects: truncatedObjects,
    };
  }

  async deleteAllBucketObjects() {
    const { bucket, client } = this;
    const paginationsConfig = { client };
    const listCommandInput = { Bucket: bucket };

    // Iterate by page over all of the objects in the bucket
    const paginator = paginateListObjectsV2(paginationsConfig, listCommandInput);

    // eslint-disable-next-line no-restricted-syntax
    for await (const page of paginator) {
      // Delete all of the objects in the current page
      const commandInput = {
        Bucket: this.bucket,
        Delete: {
          Objects: page.Contents.map(object => ({ Key: object.Key })),
        },
      };
      const command = new DeleteObjectsCommand(commandInput);

      await client.send(command);
    }
  }

  async putObject(body, key, extras = {}) {
    const { bucket, client } = this;
    const command = new PutObjectCommand({
      Body: body,
      Bucket: bucket,
      Key: key,
      ...extras,
    });
    return client.send(command);
  }

  async getObject(key, extras = {}) {
    const { bucket, client } = this;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...extras,
    });
    return client.send(command);
  }

  async headObject(key) {
    const { bucket, client } = this;
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return client.send(command);
  }

  async getSignedUrl(key) {
    const { bucket, client } = this;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    return getSignedUrl(client, command, { expiresIn: 300 });
  }
}

module.exports = { S3_DEFAULT_MAX_KEYS, S3Client };
