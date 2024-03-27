const crypto = require('crypto');
const router = require('express').Router();

const { createCFAPIResource, createCFAPIResourceList } = require('../../test/api/support/factory/cf-api-response');
const { Site } = require('../../api/models');

// TODO: move this, don't use a global
// on init, make a service credential binding for each site
const serviceCredentialBindings = [];
async function initServiceCredentialBindings() {
  const sites = await Site.findAll();
  sites.forEach((site) => {
    const serviceCredentialBinding = {
      name: site.s3ServiceName,
      guid: crypto.randomUUID(),
      siteInfo: site,
    };
    serviceCredentialBindings.push(serviceCredentialBinding);
  });
}
initServiceCredentialBindings();

router.get('/service_credential_bindings', (req, res) => {
  const name = req.query.service_instance_names;
  const serviceCredentialBinding = serviceCredentialBindings.find(scb => scb.name === name);
  if (!serviceCredentialBinding) {
    return res.notFound();
  }

  const { guid } = serviceCredentialBinding;
  const credentialsServiceInstance = createCFAPIResource({ name, guid });
  const listCredentialServices = createCFAPIResourceList({
    resources: [credentialsServiceInstance],
  });
  return res.send(listCredentialServices);
});

router.get('/service_credential_bindings/:guid/details', (req, res) => {
  const serviceCredentialBinding = serviceCredentialBindings
    .find(scb => scb.guid === req.params.guid);

  if (!serviceCredentialBinding) {
    return res.notFound();
  }
  const credentials = {
    access_key_id: 'test',
    secret_access_key: 'test',
    region: serviceCredentialBinding.siteInfo.awsBucketRegion,
    bucket: serviceCredentialBinding.siteInfo.awsBucketName,
  };
  return res.send({ credentials });
});

module.exports = router;
