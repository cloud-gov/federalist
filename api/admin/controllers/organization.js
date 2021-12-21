const { serialize, serializeMany } = require('../../serializers/organization');
const { paginate, wrapHandlers } = require('../../utils');
const { Organization, Event } = require('../../models');
const Mailer = require('../../services/mailer');
const OrganizationService = require('../../services/organization');
const EventCreator = require('../../services/EventCreator');
const { fetchModelById } = require('../../utils/queryDatabase');

module.exports = wrapHandlers({
  async list(req, res) {
    const { limit, page, search } = req.query;

    const scopes = [];

    if (search) {
      scopes.push(Organization.searchScope(search));
    }

    const pagination = await paginate(Organization.scope(scopes), serializeMany, { limit, page });

    const json = {
      meta: {},
      ...pagination,
    };

    return res.json(json);
  },

  async findById(req, res) {
    const {
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    return res.json(serialize(org));
  },

  async create(req, res) {
    const {
      body: {
        managerGithubUsername, managerUAAEmail, name, sandbox,
      },
      user,
    } = req;

    const [org, { email, inviteLink: link }] = await OrganizationService.createOrganization(
      user, name, sandbox, managerUAAEmail, managerGithubUsername
    );

    if (link) {
      await Mailer.sendUAAInvite(email, link);
    }

    const json = {
      invite: { email, link },
      org: serialize(org),
    };

    return res.json(json);
  },

  async update(req, res) {
    const {
      body: { name, sandbox, active },
      params: { id },
    } = req;

    const auditUpdate = (organization) => {
      const eventAtts = {};
      if (organization.isSandbox !== sandbox) {
        eventAtts.sandbox = sandbox;
      }
      if (organization.isActive !== active) {
        eventAtts.active = active;
      }
      if (organization.name !== name) {
        eventAtts.name = name;
      }
      if (Object.keys(eventAtts).length > 0) {
        EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'Organization Updated', {
          organization: { ...eventAtts, id: organization.id },
        });
      }
    };

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    await org.update({ isSandbox: sandbox, name, isActive: active });
    auditUpdate(org);
    return res.json(serialize(org));
  },
});
