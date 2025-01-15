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

describe('Published Branches API', () => {
  after(() => s3Mock.restore());
  afterEach(() => nock.cleanAll());
  beforeEach(() => s3Mock.reset());

  describe('GET /v0/site/:site_id/published-branch', () => {
    it('should require authentication', (done) => {
      factory
        .site()
        .then((site) =>
          request(app).get(`/v0/site/${site.id}/published-branch`).expect(403),
        )
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/published-branch',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });

    it('should throw 404 when site_id is NaN', async () => {
      const site = await factory.site({
        demoBranch: 'demo',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/NaN/published-branch')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch',
        404,
        response.body,
      );
    });

    it('should throw 404 when site_id does not exist', async () => {
      const site = await factory.site({
        demoBranch: 'demo',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/-1/published-branch')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch',
        404,
        response.body,
      );
    });

    it("should list the previews available on S3 for a user's site", async () => {
      const { site, user } = await createSiteUserOrg();

      s3Mock
        .on(ListObjectsV2Command)
        .resolvesOnce({
          IsTruncated: true,
          KeyCount: 2,
          CommonPrefixes: [{ Prefix: 'abc' }, { Prefix: 'def' }],
          ContinuationToken: 'A',
          NextContinuationToken: 'B',
        })
        .resolvesOnce({
          IsTruncated: false,
          KeyCount: 1,
          CommonPrefixes: [{ Prefix: 'ghi' }],
          ContinuationToken: 'B',
          NextContinuationToken: null,
        });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/published-branch`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch',
        200,
        response.body,
      );
      const branchNames = response.body.map((branch) => branch.name);
      expect(branchNames).to.have.length(4);
      expect(branchNames).to.include(site.defaultBranch);
      expect(branchNames).to.include('abc');
      expect(branchNames).to.include('def');
      expect(branchNames).to.include('ghi');
    });

    it('should list the demo branch if one is set on the site', async () => {
      const site = await factory.site({
        demoBranch: 'demo',
      });
      const { user } = await createSiteUserOrg({ site });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      s3Mock.on(ListObjectsV2Command).resolves({
        IsTruncated: false,
        KeyCount: 1,
        CommonPrefixes: [{ Prefix: 'abc' }],
        ContinuationToken: 'A',
      });

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/published-branch`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch',
        200,
        response.body,
      );
      const branchNames = response.body.map((branch) => branch.name);
      expect(branchNames).to.deep.equal([site.defaultBranch, site.demoBranch, 'abc']);
    });

    it('should 404 if the user is not associated with the site', (done) => {
      const user = factory.user();
      const site = factory.site();
      const cookie = authenticatedSession(user);

      Promise.props({
        user,
        site,
        cookie,
      })
        .then((promisedValues) =>
          request(app)
            .get(`/v0/site/${promisedValues.site.id}/published-branch`)
            .set('Cookie', promisedValues.cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/published-branch',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });

    it('returns a 400 if the access keys are invalid', async () => {
      const expected =
        'S3 keys out of date. Update them with `npm run update-local-config`';
      const site = await factory.site({
        demoBranch: 'demo',
      });
      const { user } = await createSiteUserOrg({ site });

      mockTokenRequest();
      apiNocks.mockDefaultCredentials();

      s3Mock.on(ListObjectsV2Command).rejects({
        code: 'InvalidAccessKeyId',
      });

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/published-branch`)
        .set('Cookie', cookie)
        .expect(400);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch',
        400,
        response.body,
      );

      expect(response.body.message).to.equal(expected);
    });
  });

  describe('GET /v0/site/:site_id/published-branch/:branch', () => {
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
            '/site/{site_id}/published-branch/{branch}',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });

    it('should render a JSON response for a pubslished branch', async () => {
      const site = await factory.site({
        defaultBranch: 'main',
      });
      const { user } = await createSiteUserOrg({ site });

      const cookie = await authenticatedSession(user);
      const response = await request(app)
        .get(`/v0/site/${site.id}/published-branch/main`)
        .set('Cookie', cookie)
        .expect(200);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}',
        200,
        response.body,
      );
      expect(response.body.site.id).to.equal(site.id);
      expect(response.body.name).to.equal('main');
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
            .get(`/v0/site/${promisedValues.site.id}/published-branch/main`)
            .set('Cookie', promisedValues.cookie)
            .expect(404),
        )
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/published-branch/{branch}',
            403,
            response.body,
          );
          done();
        })
        .catch(done);
    });

    it('should require site id is a Number', async () => {
      const site = await factory.site({
        defaultBranch: 'main',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/NaN/published-branch/main')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}',
        404,
        response.body,
      );
    });

    it('should require site id is in the sites table', async () => {
      const site = await factory.site({
        defaultBranch: 'main',
      });

      const { user } = await createSiteUserOrg({ site });
      const cookie = await authenticatedSession(user);

      const response = await request(app)
        .get('/v0/site/-1/published-branch/main')
        .set('Cookie', cookie)
        .expect(404);

      validateAgainstJSONSchema(
        'GET',
        '/site/{site_id}/published-branch/{branch}',
        404,
        response.body,
      );
    });
  });
});
