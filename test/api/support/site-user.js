const factory = require('./factory');
// previously we tracked whether users could access a site based on a simple relationship
// from Site to User. Now we use Organizations. This helper provides an easier way to
// setup the necessary structures to quickly test our access patterns.

// operators can provide existing user/org/site models as needed and the user will
// still be added to the org, and the site will have it's organization set to the
// organization
async function createSiteUserOrg({
  user = null,
  org = null,
  site = null,
  roleName = 'user',
} = {}) {
  if (!user) {
    // eslint-disable-next-line no-param-reassign
    user = await factory.user();
  }

  if (!org) {
    // eslint-disable-next-line no-param-reassign
    org = await factory.organization.create();
  }

  await org.addRoleUser(user, roleName);

  if (!site) {
    // eslint-disable-next-line no-param-reassign
    site = await factory.site({
      organizationId: org.id,
    });
  } else {
    site.update({
      organizationId: org.id,
    });
  }

  return { site, user, org };
}

module.exports = { createSiteUserOrg };
