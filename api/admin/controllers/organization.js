const { serialize, serializeMany } = require('../../serializers/organization');
const { paginate, wrapHandlers } = require('../../utils');
const { Organization, Event } = require('../../models');
const Mailer = require('../../services/mailer');
const OrganizationService = require('../../services/organization');
const EventCreator = require('../../services/EventCreator');
const { fetchModelById } = require('../../utils/queryDatabase');

// An experimental, more generic hook
function organizationAuditHook(instance, { user, event }) {
  const changes = instance.changed();
  if (changes.length > 0) {
    const changesObj = changes.reduce(
      (agg, key) => ({ ...agg, [key]: instance.get(key) }),
      { id: instance.id }
    );

    const tableName = instance.constructor.getTableName();
    const message = `${event} ${tableName}`;
    EventCreator.audit(Event.labels.ADMIN_ACTION, user, message, changesObj);
  }
}

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
        managerGithubUsername, managerUAAEmail, agency, name, isSandbox, isSelfAuthorized,
      },
      user,
    } = req;

    const organizationParams = {
      agency,
      name,
      isSandbox,
      isSelfAuthorized,
    };

    const [org, { email, inviteLink: link }] = await OrganizationService.createOrganization(
      organizationParams, user, managerUAAEmail, managerGithubUsername
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
      body: {
        agency, name, isSandbox, isSelfAuthorized, isActive,
      },
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    const orgParams = {
      agency,
      isSandbox,
      name,
      isActive,
      isSelfAuthorized,
    };

    // An experimental hook for more generic auditing
    // Adding and removing here so it doesn't affect anything else
    const hookEvent = 'afterUpdate';
    const hookKey = 'afterUpdateHook';
    Organization.addHook(hookEvent, hookKey, organizationAuditHook);
    await org.update(orgParams, { user: req.user, event: 'Update' });
    Organization.removeHook(hookEvent, hookKey);

    return res.json(serialize(org));
  },

  async deactivate(req, res) {
    const {
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    const deactivatedOrg = await OrganizationService.deactivateOrganization(org);
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'Organization Deactivated', { organization: deactivatedOrg });
    return res.json(serialize(deactivatedOrg));
  },

  async activate(req, res) {
    const {
      params: { id },
    } = req;

    const org = await fetchModelById(id, Organization);
    if (!org) return res.notFound();

    const activatedOrg = await OrganizationService.activateOrganization(org);
    EventCreator.audit(Event.labels.ADMIN_ACTION, req.user, 'Organization Activated', { organization: activatedOrg });
    return res.json(serialize(activatedOrg));
  },
});
