const {
  Organization, Site, User, Event,
} = require('../../models');
const { paginate, toInt, wrapHandlers } = require('../../utils');
const { fetchModelById } = require('../../utils/queryDatabase');
const userSerializer = require('../../serializers/user');
const Mailer = require('../../services/mailer');
const EventCreator = require('../../services/EventCreator');
const OrganizationService = require('../../services/organization');

module.exports = wrapHandlers({
  async me(req, res) {
    res.json({
      ...userSerializer.toJSON(req.user),
      csrfToken: req.csrfToken(),
    });
  },

  async list(req, res) {
    const {
      limit, page, organization, search, site,
    } = req.query;

    const serialize = users => userSerializer.serializeMany(users, true);

    const scopes = ['withUAAIdentity'];

    if (search) {
      scopes.push(User.searchScope(search));
    }

    if (site) {
      scopes.push(User.siteScope(site));
    }

    if (organization) {
      scopes.push(User.orgScope(organization));
    }

    const [pagination, orgs, sites] = await Promise.all([
      paginate(User.scope(scopes), serialize, { limit, page }),
      Organization.findAll({ attributes: ['id', 'name'], raw: true }),
      Site.findAll({ attributes: ['id', 'owner', 'repository'], raw: true }),
    ]);

    const json = {
      meta: { orgs, sites },
      ...pagination,
    };

    return res.json(json);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const user = await fetchModelById(id, User.scope(['withUAAIdentity', 'withOrganizationRoles']));
    if (!user) {
      return res.notFound();
    }

    const userJSON = userSerializer.toJSON(user, true);

    return res.json(userJSON);
  },

  async invite(req, res) {
    const {
      body: {
        uaaEmail,
        githubUsername,
        organizationId,
        roleId,
      },
      user,
    } = req;

    const { email, inviteLink: link } = await OrganizationService.inviteUserToOrganization(
      user, toInt(organizationId), toInt(roleId), uaaEmail, githubUsername
    );
    EventCreator.audit(req.user, Event.labels.ADMIN_ACTION, 'User Invited', {
      organizationId, roleId, email, link, githubUsername,
    });
    if (link) {
      await Mailer.sendUAAInvite(email, link);
      EventCreator.audit(req.user, Event.labels.ADMIN_ACTION, 'User Invite Sent', { user: { email }, link });
    }

    const json = {
      invite: { email, link },
    };

    return res.json(json);
  },

  async resendInvite(req, res) {
    const {
      body: { uaaEmail },
      user,
    } = req;

    const { email, inviteLink: link } = await OrganizationService.resendInvite(user, uaaEmail);
    EventCreator.audit(req.user, Event.labels.ADMIN_ACTION, 'User Invite Resent', { user: { email }, link });
    if (link) {
      await Mailer.sendUAAInvite(email, link);
    }

    const json = {
      invite: { email, link },
    };

    return res.json(json);
  },
});
