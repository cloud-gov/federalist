const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const factory = require('../support/factory');
const csrfToken = require('../support/csrfToken');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const app = require('../../../app');
const EventCreator = require('../../../api/services/EventCreator');
const { createSiteUserOrg } = require('../support/site-user');
const { stubSiteS3 } = require('../support/file-storage-service');

describe('Domain API', () => {
  beforeEach(async () => {
    sinon.stub(EventCreator, 'error').resolves();
    await factory.organization.truncate();
  });

  afterEach(async () => {
    sinon.restore();
    await factory.organization.truncate();
  });

  describe('POST /v0/site/:site_id/file-storage-service', () => {
    describe('when the user is not authenticated', () => {
      it('returns a 403', async () => {
        const siteId = 1;

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/file-storage-service`)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          403,
          body,
        );
      });
    });

    describe('when there is no csrf token', () => {
      it('returns a 403', async () => {
        const siteId = 1;
        const user = await factory.user();
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/file-storage-service`)
          .set('Cookie', cookie)
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          403,
          body,
        );
      });
    });

    describe('when the site does not exist', () => {
      it('returns a 404', async () => {
        const siteId = 1;
        const { user } = await createSiteUserOrg({ roleName: 'manager' });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${siteId}/file-storage-service`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(404);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          404,
          body,
        );

        expect(body.message).to.eq('Not found');
      });
    });

    describe('when an user with user org roll tries to create site storage', () => {
      it('returns a 403', async () => {
        const { user, site } = await createSiteUserOrg({ roleName: 'user' });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/file-storage-service`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          403,
          body,
        );

        expect(body.message).to.eq(
          'You do not have manager access to this organization.',
        );
      });
    });

    describe('when the site file storage service already exists', () => {
      it('returns a 403', async () => {
        const { site, user, org } = await createSiteUserOrg({ roleName: 'manager' });
        await factory.fileStorageService.create({
          siteId: site.id,
          organizationId: org.id,
        });

        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/file-storage-service`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .send({
            name: 'another-file-storage',
          })
          .expect(403);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          400,
          body,
        );
        expect(body.message).to.eq(
          'The site already has an existing file storage services available.',
        );
      });
    });

    describe('when a manager creates a valid site file storage', () => {
      it('returns a 200', async () => {
        const { site, user } = await stubSiteS3({ roleName: 'manager' });
        const cookie = await authenticatedSession(user);

        const { body } = await request(app)
          .post(`/v0/site/${site.id}/file-storage-service`)
          .set('Cookie', cookie)
          .set('x-csrf-token', csrfToken.getToken())
          .type('json')
          .expect(200);

        validateAgainstJSONSchema(
          'POST',
          '/site/{site_id}/file-storage-service',
          200,
          body,
        );
      });
    });
  });
});
