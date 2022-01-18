import React from 'react';
import PropTypes from 'prop-types';
import BasicAuthSettingsForm from './BasicAuthSettingsForm';
import AlertBanner from '../../alertBanner';
import globals from '../../../globals';
import siteActions from '../../../actions/siteActions';
import { BASIC_AUTH } from '../../../propTypes';

const infoContent = (
  <>
    If you would like to add basic authentication to your site previews, please provide a
    username and password for which you will be prompted to enter when previewing your site.
    For more information see
    {' '}
    <a
      href="https://federalist.18f.gov/documentation/basic-auth"
      rel="noopener noreferrer"
      target="_blank"
    >
      Basic Authentication on
      {globals.APP_NAME}
      Preview Builds
    </a>
    {' '}
    for an up-to-date list.
  </>
);

const warningContent = (
  <>
    {globals.APP_NAME}
    is a
    <b> FISMA Low </b>
    system, do NOT reuse credentials from other secure systems. See
    {' '}
    <a
      href="https://csrc.nist.gov/Projects/Risk-Management/Risk-Management-Framework-(RMF)-Overview/Security-Categorization"
      rel="noopener noreferrer"
      target="_blank"
    >
      FISMA Security Categorization
    </a>
    {' '}
    for more information on FISMA information categorization.
  </>
);

const BasicAuthSettings = ({ siteId, basicAuth: { username, password } }) => {
  const saveBasicAuth = params => siteActions.saveBasicAuthToSite(siteId, params);
  const deleteBasicAuth = () => siteActions.removeBasicAuthFromSite(siteId);
  return (
    <div className="well">
      <AlertBanner
        status="info"
        message={infoContent}
        alertRole={false}
      />
      <AlertBanner
        status="warning"
        message={warningContent}
        alertRole={false}
      />
      <br />
      {
        username
          ? (
            <p className="well-text">
              <b>Username:</b>
              {username}
              <br />
              <b>Password:</b>
              {password}
              <br />
              <br />
              <button type="button" className="margin-0" id="delete-basic-auth-btn" onClick={() => deleteBasicAuth()}>
                Delete
              </button>
            </p>
          )
          : (<BasicAuthSettingsForm onSubmit={saveBasicAuth} />)
      }
    </div>
  );
};

BasicAuthSettings.propTypes = {
  siteId: PropTypes.number.isRequired,
  basicAuth: BASIC_AUTH.isRequired,
};

export default BasicAuthSettings;
