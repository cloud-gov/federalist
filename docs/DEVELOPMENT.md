# Development

This is development documentation on pages-core standards and best practices when developing the application and support components.

## Setting up a local pages-core development environment

### First install these dependencies

Before you start, ensure you have the following installed:

- [Node](https://nodejs.org/en) and [Yarn](https://classic.yarnpkg.com/en/docs/install)
- [Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) (choose **cf CLI v7**)
- [Docker Compose](https://docs.docker.com/compose/install/#install-compose)

Run this command to add tools for local development
- `yarn install`

### Then follow these steps to set up and run your server

In order to provide a simple development user experience, cloud.gov Pages has some complexity on the backend. So as part of your local setup, you will need to emulate some of that complexity through the creation steps below. This shouldn't take longer than 15 minutes.

_Note: some terminal commands may take a while to process, without offering feedback to you. Your patience will be rewarded!_

1. Clone the `cloud-gov/pages-core` repository from Github and `cd` to that directory.

#### Editing the local configuration files

1. Make a copy of `config/local.sample.js` and name it `local.js` and place it in the `config` folder. You can do this by running `cp config/local{.sample,}.js`
This will be the file that holds your S3 and SQS configurations.

2. Navigate to the [developer settings for the `Pages-Local` OAuth application](https://github.com/organizations/cloud-gov/settings/applications/1994573) and create a new Client secret.

3. Once you have the new Client secret, you'll see a `Client ID` and `Client Secret`. Open the `config/local.js` file in your text or code editor and update it with the Client ID and Client secret from the `FederalistLocal` OAuth application:
    ```js
    const githubOptions = {
      clientID: 'VALUE FROM GITHUB',
      clientSecret: 'VALUE FROM GITHUB',
    };
    ```

4. Make a copy of `api/bull-board/.env.sample`, name it `.env`, and place it in `api/bull-board/`.

2. Assuming you have been added to the `FederalistLocal` Github organization, navigate to the [developer settings for the `FederalistLocal-Queues` OAuth application](https://github.com/organizations/FederalistLocal/settings/applications/1832231) and create a new Client secret.

3. Once you have the new Client secret, you'll see a `Client ID` and `Client Secret`. Open the `api/bull-board/.env` file in your text or code editor and update it with the Client ID and Client secret from the `FederalistLocal-Queues` OAuth application:
    ```
    GITHUB_CLIENT_ID=VALUE FROM GITHUB
    GITHUB_CLIENT_SECRET=VALUE FROM GITHUB
    ```
**For 18F/TTS developers:** This section is primarily for 18F/TTS developers working on the Federalist project. Before you get started, make sure you have been fully on-boarded, including getting access to the Federalist cloud.gov `staging` space.

1. Paste `cf login --sso -a https://api.fr.cloud.gov -o gsa-18f-federalist -s staging` into your terminal window.
2. Visit https://login.fr.cloud.gov/passcode to get a Temporary Authentication Code.
3. Paste this code into the terminal, and hit the return key. (For security purposes, the code won't be rendered in the terminal.)
4. Type `npm run update-local-config` to read necessary service keys from the staging environment and load them into a local file called `config/local-from-staging.js`.

Note that `npm run update-local-config` will need to be re-run with some frequency, as service keys are changed every time Federalist's staging instance is deployed.

#### Setting up Docker

If local UAA authentication is not needed, Docker can be set up and started with these commands:

1. Run `docker compose build`.
1. Run `docker compose run --rm app yarn` to install dependencies.
1. Run `docker compose run --rm admin-client yarn` to install dependencies.
1. Run `docker compose run --rm app yarn migrate:up` to initialize the local database.
1. Run `docker compose run --rm app yarn create-dev-data` to create some fake development data for your local database.
1. Run `docker compose up` to start the development environment.

Any time the node dependencies are changed (like from a recently completed new feature), `docker compose run --rm app yarn` will need to be re-run to install updated dependencies after pulling the new code from GitHub.

In order to make it possible to log in with local UAA authentication in a development environment it is necessary to also build and start the UAA container, which requires specifying a second docker compose configuration file when executing the docker compose commands which build containers or start the development environment, e.g.:

1. `docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml build`
1. `docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml up`

#### Check to see if everything is working correctly

1. If you've successfully completed all of the steps the Federalist app is now ready to run locally! :tada:
1. You should now be able to see Federalist running at [http://localhost:1337](http://localhost:1337). Local file changes will cause the server to restart and/or the front end bundles to be rebuilt.

**Pro tips:**

In our Docker Compose environment, `app` is the name of the container where the Federalist web application runs. You can run any command in the context of the web application by running `docker compose run --rm app <THE COMMAND>`.

For example:

- Use `docker compose run --rm app yarn test` to run local testing on the app.
- Use `docker compose run --rm app yarn lint` to check that your local changes meet our linting standards.
- Use `docker compose run --rm app yarn format` to format your local changes based on our standards.

Similarly you can run any command in the context of the database container `db` by running `docker compose run --rm db <THE COMMAND>`.

Note that when using `docker compose run`, the docker network will not be exposed to your local machine. If you do need the network available, run `docker compose run --rm --service-ports app <THE COMMAND>`.

The `db` container is exposed on port `5433` of your host computer to make it easier to run commands on. For instance, you can open a `psql` session to it by running `psql -h localhost -p 5433 -d federalist -U postgres`.

The admin client is running on port `3000` of hour host computer.

Some aspects of the system aren't expected to be fully functional in a development environment. For example: the "View site" and "Uploaded files" links associated with sites in the seed data do not reach working URLs.

#### Front end application

If you are working on the front end of the application, the things you need to know are:

1. It is a React and Redux application
1. It is built with `webpack`
1. It lives in `/frontend`

To analyze the contents of the front end JavaScript bundle, visit http://localhost:8888 while the application is running to see a visualization of the the bundle contents.

### Deployment

#### Environment Variables

Here `<environment>` refers the value set for the `APP_ENV` environment variable (ie: `production` or `staging`.

We have a few environment variables that the application uses.
In production, those variables are provided to the application either through the Cloud Foundry environment or through Cloud Foundry services.

To inspect the way the environment is provided to the application in production and staging, look at `./.cloudgov/manifest.yml`.
To see how the application receives those configurations, looks at `config/env/<environment>.js`.

The following environment variables are set on the Cloud Foundry environment in the application manifest:

- `NODE_ENV`: The node environment where the app should run. When running in Cloud Foundry this should always be set to production, even for the staging environment
- `APP_ENV`: The application environment in which the app should run. Valid values are `production` and `staging`.
- `LOG_LEVEL`: Sets the log level for the app.
- `NPM_CONFIG_PRODUCTION`: This should be set to true in Cloud Foundry to prevent Yarn/NPM from installing dev dependencies
- `NODE_MODULES_CACHE`: This should be set to true in Cloud Foundry to prevent caching node modules since those are vendored by Federalist
- `APP_NAME`: The name of the Cloud Foundry application
- `APP_DOMAIN`: The hostname where the application runs in Cloud Foundry
- `NEW_RELIC_APP_NAME`: The app name to report to New Relic
- `NEW_RELIC_LICENSE_KEY`: The license key to use with New Relic

Secrets cannot be kept in the application manifest so they are provided by Cloud Foundry services.
The app expects the following user provided services to be provided:

- `federalist-<environment>-rds`: A cloud.gov brokered service that allows the application to use RDS Postgres for its database
- `federalist-<environment>-uev`: A user-provided service that provides the application with the secret key to securely encrypt user environment variable; this service provides the following credential:
  - `key`: The encryption key to decrypt user environment variables
- `federalist-<environment>-env`: A user-provided service that provides the application with secrets that cannot be added to `manifest.yml` b/c that file is under version control; this service provides the following:
  - `FEDERALIST_SESSION_SECRET`: The session secret used to sign entries in Federalist's session store
  - `GITHUB_CLIENT_CALLBACK_URL`: The callback URL used for GitHub authentication
  - `GITHUB_CLIENT_EXTERNAL_CALLBACK_URL`: The callback URL used for external GitHub authentication
  - `GITHUB_CLIENT_ID`: The client ID used for GitHub authentication
  - `GITHUB_CLIENT_SECRET`: The client secret used for GitHub authentication
  - `GITHUB_WEBHOOK_SECRET`: The secret used to sign and verify webhook requests from GitHub
  - `GITHUB_WEBHOOK_URL`: The url where GitHub webhook requests should be sent
- `admin-<environment>-uaa-client`: Credentials for cloud.gov's UAA to support authentication for the admin app. This service provides the following:
  - `clientID`: The UAA client id for the environments admin app
  - `clientSecret`: The UAA client secret for the environments admin app
  - `authorizationURL`: The url to login and authorize a user
  - `tokenURL`: The UAA url to get a user's token
  - `userURL`: The UAA url to get a user's info
  - `logoutURL`: The UAA url to logout a user
- `app-<environment>-uaa-client`: Credentials for cloud.gov's UAA to support authentication for the app. This service provides the following:
  - `clientID`: The UAA client id for the environments app
  - `clientSecret`: The UAA client secret for the environments app
  - `authorizationURL`: The url to login and authorize a user
  - `tokenURL`: The UAA url to get a user's token
  - `userURL`: The UAA url to get a user's info
  - `logoutURL`: The UAA url to logout a user
- `pages-<environment>-encryption`: The credentials used to encrypt data sent to other platform components
  - `key`: The secret key to be shared across components
  - `algorithm`: The algorithm used to encrypt the data

#### Deploy in CloudFoundry
To deploy to CloudFoundry submit the following:
`cf push federalistapp --strategy rolling --vars-file "./.cloudgov/vars/${CF_SPACE}.yml" -f ./cloudgov/manifest.yml`

### Continuous Integration
Our continuous integration pipeline is run on Concourse CI. To use Concourse, one must have appropriate permissions in UAA as administered by the cloud.gov operators. Access to Concourse also requires using the GSA VPN.

1. To get started install and authenticate with the `fly` CLI:
- `brew install --cask fly`
- `fly -t <Concourse Target Name> login -n pages -c <concourse url>`

2. Update local credential files (see ci/vars/example.yml)

#### CI deployments
This repository contains one deployment pipeline file which is used to deploy the application across three separate environments. This is acheived using the `boot` task from [`pages-pipeline-task`](https://github.com/cloud-gov/pages-pipeline-tasks/?tab=readme-ov-file#boot).

Each pipeline deploys the Pages app/api, the admin app, and the queues app for a given environment. Notable differences between the per-environment pipelines:
- `dev`: This pipeline runs when a PR is created against the `main` branch. It will deploy the API without waiting for lint/tests to pass. It sends back information about various tasks as Github status checks. It runs integration testing post-deployment. It will skip PRs which only change `package.json` or `CHANGELOG.md`, effectively skipping the `release` PRs.
- `staging`: This pipeline runs when a new commit is added to the `main` branch. It updates a separate `release` branch which is used for automating releases and updating our changeleog. It runs integration testing post-deployment.
- `production`: This pipeline runs when a new tag is added to the `main` branch. It will create a new Github release matching the tag and post the changelog to Slack.

#### Core deployment
##### Pipeline instance variables
Three instances of the pipeline are set for the `pages dev`, `pages staging` and `pages production` environments. Instance variables are used to fill in Concourse pipeline parameter variables bearing the same name as the instance variable. See more on [Concourse vars](https://concourse-ci.org/vars.html). Each instance of the pipeline has one instance variable associated to it: `deploy-env`.

|Instance Variable|Pages Dev|Pages Staging|Pages Production|
--- | --- | ---| ---|
|**`deploy-env`**|`dev`|`staging`|`production`|

##### Pipeline credentials
Concourse CI integrates directly with [Credhub](https://docs.cloudfoundry.org/credhub/) to provide access to credentials/secrets at job runtime. When a job is started, Concourse will resolve the parameters within the pipeline with the latest credentials using the double parentheses notation (ie. `((<credential-name>))`). See more about the [credentials lookup rules](https://concourse-ci.org/credhub-credential-manager.html#credential-lookup-rules).

Some credentials in this pipeline are "compound" credentials that use the pipeline's instance variable in conjuction with its parameterized variables to pull the correct Credhub credentials based on the pipeline instance. The following parameters are used in the proxy pipeline:

|Parameter|Description|Is Compound|
--- | --- | --- |
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer username based on the instanced pipeline|:white_check_mark:|
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer password based on the instanced pipeline|:white_check_mark:|
|**`((deploy-env))-pages-domain`**|The deployment environment specific domain for the app|:white_check_mark:|
|**`((slack-channel))`**| Slack channel | :x:|
|**`((slack-username))`**| Slack username | :x:|
|**`((slack-icon-url))`**| Slack icon url | :x:|
|**`((slack-webhook-url))`**| Slack webhook url | :x:|
|**`((support-email))`**| Our support email address | :x:|
|**`((git-base-url))`**|The base url to the git server's HTTP endpoint|:x:|
|**`((pages-repository-path))`**|The url path to the repository|:x:|
|**`((gh-access-token))`**| The Github access token|:x:|

##### Setting up the pipeline for Core
The pipeline and each of it's instances will only needed to be set once per instance to create the initial pipeline. After the pipelines are set, updates to the default branch will automatically set the pipeline. See the [`set_pipeline` step](https://concourse-ci.org/set-pipeline-step.html) for more information. First, a compiled pipeline file needs to be created with [`ytt`](https://carvel.dev/ytt/):

```sh
$ ytt -f ci/pipeline.yml -f ../pages-pipeline-tasks/overlays -f ../pages-pipeline-tasks/common --data-value env=<env> > pipeline-<env>.yml
```
Then, the following command will use the fly CLI to set a pipeline instance:

```bash
$ fly -t <Concourse CI Target Name> set-pipeline -p core \
  -c pipeline-<env>.yml \
  -i deploy-env=<env>
```

##### Getting or deleting a pipeline instance from the CLI
To get a pipeline instance's config or destroy a pipeline instance, run the following command with the fly CLI to set a pipeline:

```bash
## Get a pipeline instance config
$ fly -t <Concourse CI Target Name> get-pipeline \
  -p core/deploy-env:production

## Destroy a pipeline
$ fly -t <Concourse CI Target Name> destroy-pipeline \
  -p core/deploy-env:production
```

#### Pinned Versions
Because our production deployments are triggered by git tags, they can be [pinned to specific version](https://concourse-ci.org/resource-versions.html#version-pinning) in the Concourse UI. The best practice is to navigate to the [`src-production-tagged` resource](https://ci.fr.cloud.gov/teams/pages/pipelines/core/resources/src-production-tagged?vars.deploy-env=%22production%22), pin the desired version, and restart any downstream Concourse jobs.

### Accessing Concourse Jumpbox

The Concourse jumpbox will allow users to interact with the CI environment and access/add/alter the credentials available to the CI pipelines via Credhub.  To access the jumpbox, you will need to be on the GSA VPN, have `fly` configured with the correct target, and have the latest version of [cg-scripts](https://github.com/cloud-gov/cg-scripts) locally accessible.

**Using the jumpbox**

1. **Connect to the VPN**

2. **Download or `git pull` the latest version of [cg-scripts](https://github.com/cloud-gov/cg-scripts) to a location on your local drive ie (`~/my-scripts/cg-scripts`)**

3. **Set your environment args to run the jumpbox script**
- `CG_SCRIPTS_DIR=~/my-scripts/cg-scripts`
- `CI_TARGET=<fly target (ie pages-staging)>`
- `CI_ENV=<concourse environment (ie staging)>`

4. **SSH into the jumpbox**
- `$ cd $CG_SCRIPTS_DIR; ./jumpbox $CI_TARGET $CI_ENV`

5. **Working with credentials once on the jumpbox**
- Finding a credential
  - `$ credhub find -n my-credential-name`
- Getting a credential
  - `$ credhub get -n /the-full-credhub-path/my-credential-name`
- Importing a credential with a `.yml`
  - `$ credhub import -f my-creds.yml`


### Testing

When making code changes, be sure to write new or modify existing tests to cover your changes.

The full test suite of both front and back end tests can be run via:

```sh
docker compose run --rm app yarn test
```

You can also just run back or front end tests via:

```sh
docker compose run --rm app yarn test:server  # for all back end tests
docker compose run --rm app yarn test:server:file ./test/api/<path/to/test.js> # to run a single back end test file
docker compose run --rm app yarn test:client  # for all front end tests
docker compose run --rm app yarn test:client:watch  # to watch and re-run front end tests
docker compose run --rm app yarn test:client:file ./test/frontend/<path/to/test.js> # to run a single front end test file
```

To view coverage reports as HTML:

```sh
docker compose run --rm app yarn test:cover
docker compose run --rm --service-ports app yarn serve-coverage
```

and then visit http://localhost:8080.

For the full list of available commands that you can run with `yarn` or `npm`, see the `"scripts"` section of `package.json`.

**End-to-end testing (experimental)**

We also have end-to-end (e2e) testing available via [playwright](https://playwright.dev/). Before your first run, make sure you have the necessary dependencies installed:

```sh
yarn playwright install-deps
yarn playwright install
```

To run, start the application with `docker compose up` and then run the following commands:

```sh
docker compose run --rm app node scripts/create-test-users.js
yarn test:e2e
docker compose run --rm app node scripts/remove-test-users.js
```

Note that the create/remove test user scripts only need to be run once per day to create a new valid test session. You can also run Playwright tests with the [VSCode Extension](https://playwright.dev/docs/getting-started-vscode)

### Linting

We use [`eslint`](https://eslint.org/).

Because this project was not initially written in a way that complies with our current linting standard, we are taking the strategy of bringing existing files into compliance as they are touched during normal feature development or bug fixing.

To lint the files in a branch, run:

```sh
docker compose run --rm app yarn lint
```

## Feature Flags
Environment-specific feature flags are supported for both the api and frontend. Flagged features are assumed to be "off" unless the flag exists (and the value is truthy), thus feature flag conditions should always check for the presence or truthiness of the flag, not for it's absence. Environment variables for feature flags *MUST* be prefixed by `FEATURE_`, ex. `FEATURE_BRING_THE_AWESOME` or `FEATURE_BRING_DA_RUCKUS`.

### Current available features

N/A

### Api feature flags
Api feature flags are evaluated at *runtime* and should be created explicitly in the code before the corresponding environment variable can be used. Example:

Given environment variable `FEATURE_AWESOME_SAUCE='true'`

1. Add the flag to the known flags:
```js
// api/features.js
const Flags = {
  //...
  FEATURE_AWESOME_SAUCE: 'FEATURE_AWESOME_SAUCE',
}
```
2. Check if the feature is enabled:
```js
// some code in a child folder of /api
const Features = require('../features');

if (Features.enabled(Features.Flags.FEATURE_AWESOME_SAUCE)) {
  doSomething();
}
```

### Frontend feature flags
Frontend feature flags are evaluated at *compile* time NOT at runtime, resulting in unused codepaths being exluded from the built code. Environment variables with the `FEATURE_` prefix are available globally within the codebase at compile time. This magic is performed by `webpack.DefinePlugin` and minification.


Example:

Given environment variable `FEATURE_AWESOME_SAUCE='true'`

```js
if (FEATURE_AWESOME_SAUCE === 'true') {
  doSomething();
}
```

results in

```js
doSomething();
```

.

## Build Logs

Build logs are streamed directly to the database in realtime so they are immediately viewable by customers in the UI. Every night, build logs for completed builds for the day are archived in an S3 bucket and deleted from the database. This prevents the database from growing unreasonably. The S3 bucket (with assistance from cloud.gov) is configured with a lifecycle policy that expires the logs after 180 days in accordance with [cloud.gov's policies on log retention](https://cloud.gov/docs/deployment/logs/#web-based-logs-with-historic-log-data).

Lifecycle policy:
```
{
  Bucket: <bucket>,
  LifecycleConfiguration: {
    Rules: [
      {
        Expiration: {
          Days: 180
        },
        ID: "Archive all objects 180 days after creation"
        Status: "Enabled",
      }
    ]
  }
}
```

## Commits, Releases, and Deployment

All commit messages on the default branch should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. In addition, an associated ticket number should be added where relevant. For relevant issues outside the repo, the full URL can be used, either in the commit description or the commit body. Examples:

```
feat: Add fail stuck builds queue and breakout timeout builds queue (#4138)
fix: Remove spurious menu button from paginated admin views. (#4152)
chore: Remove deprecated federalistUsersHelpers function (#4131)
```

```
docs: Close an issue from our product repo

Related issue: https://github.com/cloud-gov/product/issues/2486
```

This convention is enforced via [this ruleset](https://github.com/cloud-gov/pages-core/settings/rules/26912), which checks the commit message against a regex rule before it can be merged to the default branch.

The benefit of adhering to this convention is that we can more easily reason about our commit history and also generate nice changelogs via [Commitizen](https://commitizen-tools.github.io/commitizen/).

If you didn't follow this convention while making your commits locally or on a development branch, you'll still have an opportunity to edit the commit history to match the Convention Commits specification. While the code is on a non-default branch, you can perform an [interactive rebase](https://git-scm.com/docs/git-rebase) to rewrite the history.

Summary table of "types" (the first part of the commit message). More details at [cz.json](../cz.json):

| Type     | Description                                               | Version Bump | Changelog Section |
| -------- | --------------------------------------------------------- | ------------ | ----------------- |
| feat     | New, user-facing, features                                | minor        | Added             |
| fix      | Bugfixes                                                  | patch        | Fixed             |
| chore    | Technical debt, dependencies, general application updates | patch        | Maintenance       |
| docs     | Updates to documentation                                  | patch        | Documentation     |
| perf     | Performance improvements                                  | patch        | Performance       |
| refactor | Refactoring                                               | patch        | Maintenance       |
| revert   | Reverting previous commits                                | minor        | Reverted          |
| style    | Changes to CSS or site styling                            | patch        | Maintenance       |
| test     | Updates or additions of tests                             | patch        | Maintenance       |
| ci       | Commits to trigger CI actions but no version changes      | none         |                   |

Major version bumps are created when `BREAKING CHANGE` is in the commit body or the type is followed by `!` (e.g. `feat!: add a new major feature`). All types can be modified with an additional "scope" as shown in the conventional commit documentation (e.g. `fix(admin): remove broken link in admin panel`).

## Frontend conventions

The following conventions used to build and maintain the frontend UI.

*NOTE: At this time, the current state of the frontend structure and conventions only partially follow this documentation. This document is setting standards moving forward.

### Architecture

The frontend UI should be structured to improve consistency and developer experience by establishing and maintaining the following standards. The frontend consists of a single page application architecture using Nunjucks templates to rendered by the server and React to render pages in the browser.

### Transitional Design Notes
- Currently much of the application state is managed via a [Redux](https://redux.js.org/) store.
- We are intending to transition our router to [Tanstack Router](https://tanstack.com/router/latest) and use [Tanstack Query](https://tanstack.com/query/latest) to update how our data is fetched and stored in the application.
- This latter change will likely partially supplant the Redux store as more state is maintained as [cached API requests](https://tkdodo.eu/blog/react-query-as-a-state-manager)

#### Server rendered views (Nunjucks)
- Templates in the [`./views`](../views) directory.

#### Browser rendered pages (React)
- Page template components are in the [`./frontend/pages`](../frontend/pages) directory.
- Each page is named `index.jsx` and located in the file structure at a path matching the intended route. For example, to find the component which renders `pages.cloud.gov/sites/new`, look in `frontend/pages/sites/new`. Dynamic routes are matched using `$id`, e.g the component which renders `pages.cloud.gov/sites/2/build/3/logs` is in the folder `frontend/pages/sites/$siteId/builds/$buildId/logs`.
- This pattern is inteded to support a future move to file-based routing, potentially [Tanstack Router](https://tanstack.com/router/latest)
- Only page template components should be used to render the routes in the [`./frontend/routes.js`](../frontend/routes.js) file.

#### Components (React)

- Components can be found in two places:
  - Components which are used across pages are in the [`./frontend/shared`](../frontend/shared) directory.
  - Components which are specific to a page are co-located in the `./pages/**/<page>/` directory.
- Shared components are primarily used to display information or be a general action that can be reused throughout the UI. ie:
  - A title component that displays the provided string property.
  - A button component that will call a function on click.
- Page-specific components aren't shared throughout the UI but have similar functions as enumerated below.

- We've mostly abandoned the distinction between pure and dynamic components. In general, it's preferred for non-page template components to be pure (the render is fuly controlled via props) but some components will receive additional inputs via `useSelector` (reading from the global redux state), a localized `useState` hook, or a custom hook. For completeness, for pure components:
  - All of the component properties are passed directly to the component.
  - Property types should be booleans, numbers, strings, arrays, objects, or functions.
  - No HTTP requests should be called from within a pure component.
  - No state management actions should happen within a pure component unless it is specific to that component with no external side effects. ie:
    - A menu component with a button that opens an element to display a list of links. The state of the menu being open or closed can be encapsulated within that component and its state does not effect any other components and actions.
- And for dynamic components:
  - These are primarily used to encapsulate complex requests, actions, and state management within a specific UI component. ie.
    - A build logs component that polls the API to retrieve and append new logs.
  - The component properties passed to a dynamic component should only be used to define its initial state and/or HTTP requests.
  - React hooks should manage the state and custom hook's should be created to help manage the state within the dynamic component.

#### State management

- Global app state should use Redux and it should only be used for common data that would be used across all pages. ie:
  - A user state that has the current user's data which would be used on almost every page.
- Page state should use custom hooks built with React hooks and it should be specific to the page's use. ie:
  - A build history state that is only used on the site's builds page
- Dynamic component state should use custom hooks built with React hooks and be encapsulated within the component
- Pure component state should use React hooks, they should be very simple, and be encapsulated within the component
- Custom hooks using React hooks should be used in pages and dynamic components to define the specific data and actions related to their corresponding pages and dynamic components. Custom hooks should be defined in a file in the [`./frontend/hooks](../frontend/hooks/) directory. ie:
  - The `useBuildLogs` hook would define the state and effects associated with the build logs dynamic component.
  - The `useSiteBuilds` hook would define the state and effects for a site's build history


## Event Driven Queueing

### Queues

Queues are the different event streams that accept jobs, process them, and are kept in the [./api/queues](../api/queues) directory.

#### Concurrency

Bullmq allows us to define the number of concurrent jobs that can be in an `active` state. The `concurrency` property can be assigned when defining a new queue. This setting allows the queue to self manage the number of jobs being processed at one time and manage resource load that may be required to process a job. To enforce queue concurrency when using CF tasks or an external resource to run a process, the worker's job is left running to poll the CF task status so the job completes once the downstream resource/CF task completes. This is a limitation of bullmq's built-in queue concurrency.

When a queue is processing the maximum number of jobs, all new jobs will be placed into either a `waiting` or a `prioritized` state. All jobs in the `waiting` state will be ordered in a first in first out (FIFO) arrangement. If the `priority` property is included with the add job request, bullmq will order the `prioritized` jobs to be processed based on the number provided. The lower the number, the higher priority. Priority is used to distribute customer jobs equitably so a single customer cannot exhaust resources and disrupt other customer needs.

### Queue Jobs

Queue jobs are actions that add a job to a queue and are kept in the [./api/queue-jobs](../api/queue-jobs) directory. The `QueueJobs` class provides methods to add jobs to a variety of queues. These methods should normally take two arguments. The first argument should be the message/data the worker will recieve to process the job. The second argument should be the job priority number.

Site build jobs use the CF Task functionality to remotely execute the command on the independently deployed pages-build-container app. To successfully build a site, the site build job passes the build params when executing a new site build. The command and params are sent via the CF API using the [startSiteBuildTask](../api/utils/cfApiClient.js) method where the method also encrypts the params sent to the CF Tasks via the [Encryptor](../api/services/Encryptor.js). When the site build is executed on the pages-build-container app, it decrypts the site params and starts the build process. The pages-core and pages-build-container apps share the user-provided service `pages-<env>-encryption` to encrypt and decrypt the params with a shared key.

### Workers

Workers are the processors that handle a job in a queue and are kept in the [./api/workers](../api/workers) directory. Workers are the functions that process the job added to a queue. They run in a separate worker application deployed along side the app and can either process the job on the worker itself or launch a CF task in an external application and listen to the CF task status until the status completes.

## Architecture Notes

### Build Metrics API

Additional information about a build can be sent back from [`pages-build-container`](https://github.com/cloud-gov/pages-build-container/) to `/build/:id/metrics/:token`. The function in that repository, `post_metrics` will send an arbitrary JSON object of metrics. By convention, we structure it in the following way:

```js
{
   machine: {}, \\ information about to the container running the build
   engine: { node: {}, ruby: {}, hugo: {} }, \\ information about the language or build engine
   other: {} \\ other information from the build (e.g. file counts)
}
```

## Testing

### Front-end

Front-end tests are run via the [Jest](https://jestjs.io/) framework using [React Testing Library](https://testing-library.com/docs/react-testing-library/intro). Tests can be run using the following commands:

```sh
yarn test:rtl # runs all front-end tests
yarn test:rtl:file example.test.jsx # runs a single test
```

Best practices for writing tests:
- Tests should run against a single component, hook or utility file
- Imported files or other necessary functions should be mocked as necessary to isolate tests against one component or function.
  - In particular, tests should use `nock` to intercept and mock any HTTP requests associated with the function under test.
- Test files are colocated with their code to test (i.e. `example.test.jsx` should be next to `example.jsx` in the file structure).
- As much as possible, follow the [guiding principles](https://testing-library.com/docs/guiding-principles) of React Testing Library:
  - Write tests to simulate how a user would interact with the application.
  - Prefer click events to direct function calls
  - [Query for elements](https://testing-library.com/docs/queries/about/#priority) based on role, label, or text before falling back to `test ids` (and never classes or ids)
- Simulated data needed for tests ("fixtures") should be located outside the test file itself, except in the case of single values (e.g. fake `Build` model data should be in a separate file but having an inline variable like `const testText = 'sample-data'` is fine)
- User events should use `@testing-library/user-event` since it simulates user interactions by dispatching the events that would happen if the interaction took place in a browser. Using the built-in `fireEvent` provides a browser's low-level `dispatchEvent` API but it cannot properly simulate more complex interactions like typing into a text box.
