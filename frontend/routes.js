import React from 'react';
import { Redirect } from 'react-router-dom';

import App from './components/app';
import * as Organization from './components/organization';
import UserSettings from './components/user/Settings';
import SiteList from './components/siteList/siteList';
import SiteContainer from './components/siteContainer';
import SiteBuilds from './components/site/siteBuilds';
import SiteBuildLogs from './components/site/siteBuildLogs';
import SiteUsers from './components/site/SiteUsers';
import SitePublishedBranchesTable from './components/site/sitePublishedBranchesTable';
import SitePublishedFilesTable from './components/site/SitePublishedFilesTable';
import SiteSettings from './components/site/SiteSettings';
import AddSite from './components/AddSite';
import NotFound from './components/NotFound';

import siteActions from './actions/siteActions';
import userActions from './actions/userActions';
import organizationActions from './actions/organizationActions';

import globals from './globals';

const isPages = globals.PRODUCT === 'pages';

const fetchInitialData = () => {
  userActions.fetchUser();
  siteActions.fetchSites();
  organizationActions.fetchOrganizations();
};

export default (
  <App path="/" onEnter={fetchInitialData}>
    {isPages && <Organization.List path="organizations" />}
    {isPages && <Organization.Edit path="organizations/:id" />}
    <SiteList path="sites" />
    {isPages && <AddSite path="sites/new" /> }
    <SiteContainer path="sites/:id">
      <Redirect noThrow from="/" to="builds" />
      <SiteSettings path="settings" />
      <SitePublishedBranchesTable path="published" />
      <SitePublishedFilesTable path="published/:name" />
      <SiteBuilds path="builds" />
      <SiteBuildLogs path="builds/:buildId/logs" />
      <SiteUsers path="users" />
    </SiteContainer>
    <UserSettings path="settings" />
    <Redirect noThrow from="*" to="/not-found" />
    <NotFound path="/not-found" default />
    <Redirect noThrow from="*" to="/sites" />
  </App>
);
