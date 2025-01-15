const { expect } = require('chai');
const app = require('../../../app');
const request = require('supertest');
const { authenticatedSession } = require('../support/session');
const validateAgainstJSONSchema = require('../support/validateAgainstJSONSchema');
const factory = require('../support/factory');
const userActionFactory = require('../support/factory/user-action');
const { createSiteUserOrg } = require('../support/site-user');

const version = '/v0';
const resource = 'site';
const route = 'user-action';

const notAuthenticatedError =
  'You are not permitted to perform this action. Are you sure you are logged in?';
const notFound = 'Not found';

const path = (id) => `${version}/${resource}/${id}/${route}`;

const makeGetRequest = (expectedCode, { id, cookie = null }) => {
  const baseRequest = request(app).get(path(id));

  if (cookie) {
    baseRequest.set('Cookie', cookie);
  }

  return baseRequest.expect(expectedCode);
};

const buildAuthenticatedSession = (user) => {
  if (user) {
    return authenticatedSession(user);
  }

  return factory.user().then(authenticatedSession);
};

describe('UserAction API', () => {
  describe('GET v0/site/:site_id/user-action', () => {
    it('requires authentication', (done) => {
      factory
        .site()
        .then((site) => makeGetRequest(403, { id: site.id }))
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/user-action',
            403,
            response.body,
          );
          expect(response.body.message).to.equal(notAuthenticatedError);
          done();
        })
        .catch(done);
    });

    it('returns a 404 i if the site is not associated with the user', (done) => {
      buildAuthenticatedSession()
        .then((cookie) => makeGetRequest(404, { id: 0, cookie }))
        .then((response) => {
          validateAgainstJSONSchema(
            'GET',
            '/site/{site_id}/user-action',
            404,
            response.body,
          );
          expect(response.body.message).to.equal(notFound);
          done();
        })
        .catch(done);
    });

    it('returns a list of user actions associated with a site', async () => {
      const userActionCount = 3;

      const { site, user } = await createSiteUserOrg();

      await userActionFactory.buildMany(userActionCount, { user, site });
      const cookie = await buildAuthenticatedSession(user);

      const { body } = await makeGetRequest(200, {
        id: site.id,
        cookie,
      });
      expect(body.length).to.equal(userActionCount);

      body.reduce((lastCreatedAt, action) => {
        expect(action.actionTarget).to.have.all.keys(
          'id',
          'username',
          'email',
          'createdAt',
        );
        expect(action.actionType).to.have.all.keys('action');
        // make sure they are in descending order by createdAt
        expect(new Date(action.createdAt)).to.be.lte(new Date(lastCreatedAt));
        return new Date(action.createdAt);
      }, new Date().toISOString());
    });
  });
});
