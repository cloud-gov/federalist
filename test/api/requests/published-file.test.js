const nock = require('nock');
const request = require('supertest');
const { expect } = require('chai');

const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { mockClient } = require('aws-sdk-client-mock');
const mockTokenRequest = require('../support/cfAuthNock');
const apiNocks = require('../support/cfAPINocks');
const app = require('../../../app');
const factory = require('../support/factory');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const { createSiteUserOrg } = require('../support/site-user');

const s3Mock = mockClient(S3Client);

describe('Published Files API', () => {
  after(() => s3Mock.restore());
  afterEach(() => nock.cleanAll());

  describe('GET /v0/site/:site_id/published-branch/:branch/file', () => {
    beforeEach(() => s3Mock.reset());

    it('should require authentication', (done) => {
      factory
        .site()
        .then((site) =>
          request(app)
            .get(`/v0/site/${site.id}/published-branch/${site.defaultBranch}`)
            .expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/published-branch/{branch}/published-file',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });

    it('should list the files published to the branch for the site', async () => {
      const { site, user } = await createSiteUserOrg();
      const prefix = `site/${site.owner}/${site.repository}/`;
      const cookie = await authenticatedSession(user);

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      s3Mock
        .on(ListObjectsV2Command)
        .resolvesOnce({
          IsTruncated: true,
          Contents: [
            {
              Key: `${prefix}abc`,
              Size: 123,
            },
            {
              Key: `${prefix}abc/def`,
              Size: 456,
            },
          ],
          ContinuationToken: 'A',
          NextContinuationToken: 'B',
        })
        .resolvesOnce({
          IsTruncated: false,
          Contents: [
            {
              Key: `${prefix}ghi`,
              Size: 789,
            },
          ],
          ContinuationToken: 'B',
          NextContinuationToken: null,
        });

      const response = await request(app)
        .get(`/v0/site/${site.id}/published-branch/main/published-file`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}/published-file',
        200,
        response.body,
      );

      const { files } = response.body;
      files.forEach((file) => {
        delete file.publishedBranch;
      });
      expect(files).to.deep.equal([
        {
          name: 'abc',
          size: 123,
          key: `${prefix}abc`,
        },
        {
          name: 'abc/def',
          size: 456,
          key: `${prefix}abc/def`,
        },
        {
          name: 'ghi',
          size: 789,
          key: `${prefix}ghi`,
        },
      ]);
    });

    it('should 404 is site owner is NaN', async () => {
      const site = await factory.site({
        defaultBranch: 'main',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/NaN/published-branch/main/published-file')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}/published-file',
        404,
        response.body,
      );
    });

    it('should 404 is site owner is not found', async () => {
      const site = await factory.site({
        defaultBranch: 'main',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/-1/published-branch/main/published-file')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}/published-file',
        404,
        response.body,
      );
    });

    it('should 404 if the user is not associated with the site', (done) => {
      const user = factory.user();
      const site = factory.site({
        defaultBranch: 'main',
      });
      const cookie = authenticatedSession(user);

      Promise.props({
        user,
        site,
        cookie,
      })
        .then((promisedValues) =>
          request(app)
            .get(
              `/v0/site/${promisedValues.site.id}/published-branch/main/published-file`,
            )
            .set('Cookie', promisedValues.cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/published-branch/{branch}/published-file',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });
  });
});
