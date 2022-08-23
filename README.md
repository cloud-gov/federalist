# Pages Core
***Pages is updated regularly. [Join our public chat room](https://chat.18f.gov/) to talk to us and stay informed. You can also check out our [documentation](https://cloud.gov/pages) to learn more.***

## About Cloud.gov Pages

[Cloud.gov Pages](https://cloud.gov/pages) helps federal government entities publish compliant static websites quickly and seamlessly. Pages integrates with GitHub and is built on top of [cloud.gov](https://cloud.gov), which uses Amazon Web Services.

This repository is home to "pages-core" - a Node.js app that allows government users to create and configure Pages sites.

## Examples

Partner agencies across the federal government use Pages to host websites. A few examples include:

- [College Scorecard](https://collegescorecard.ed.gov/)
- [Natural Resources Revenue Data](https://revenuedata.doi.gov/)
- [NSF Small Business Innovation Research program](https://seedfund.nsf.gov)

More examples can be found at [https://cloud.gov/pages/success-stories/](https://cloud.gov/pages/success-stories/).

## Setting up a local pages-core development environment

### First install these dependencies

Before you start, ensure you have the following installed:

- [Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) (choose **cf CLI v7**)
- [Docker Compose](https://docs.docker.com/compose/install/#install-compose)

### Then follow these steps to set up and run your server

In order to provide a simple development user experience, pages-core has some complexity on the backend. So as part of your local setup, you will need to emulate some of that complexity through the creation steps below. This shouldn't take longer than 15 minutes.

_Note: some terminal commands may take a while to process, without offering feedback to you. Your patience will be rewarded!_

1. Clone the `cloud-gov/pages-core` repository from Github and `cd` to that directory.

#### Editing the local configuration files

1. Make a copy of `config/local.sample.js` and name it `local.js` and place it in the `config` folder. You can do this by running `cp config/local{.sample,}.js`
This will be the file that holds your S3 and SQS configurations.

2. Assuming you have been added to the `FederalistLocal` Github organization, navigate to the [developer settings for the `FederalistLocal` OAuth application](https://github.com/organizations/FederalistLocal/settings/applications/968257) and create a new Client secret.

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
**For TTS developers:** This section is primarily for TTS developers working on the Pages project. Before you get started, make sure you have been fully on-boarded, including getting access to the Federalist cloud.gov `staging` space.

1. Paste `cf login --sso -a https://api.fr.cloud.gov -o gsa-18f-federalist -s staging` into your terminal window.
2. Visit https://login.fr.cloud.gov/passcode to get a Temporary Authentication Code.
3. Paste this code into the terminal, and hit the return key. (For security purposes, the code won't be rendered in the terminal.)
4. Type `npm run update-local-config` to read necessary service keys from the staging environment and load them into a local file called `config/local-from-staging.js`.

Note that `npm run update-local-config` will need to be re-run with some frequency, as service keys are changed every time Federalist's staging instance is deployed.

#### Setting up Docker

If local UAA authentication is not needed, Docker can be set up and started with these commands:

1. Run `docker-compose build`.
1. Run `docker-compose run --rm app yarn` to install dependencies.
1. Run `docker-compose run --rm admin-client yarn` to install dependencies.
1. Run `docker-compose run --rm app yarn migrate:up` to initialize the local database.
1. Run `docker-compose run --rm app yarn create-dev-data` to create some fake development data for your local database.
1. Run `docker-compose up` to start the development environment.

Any time the node dependencies are changed (like from a recently completed new feature), `docker-compose run --rm app yarn` will need to be re-run to install updated dependencies after pulling the new code from GitHub.

In order to make it possible to log in with local UAA authentication in a development environment it is necessary to also build and start the UAA container, which requires specifying a second docker-compose configuration file when executing the docker-compose commands which build containers or start the development environment, e.g.:

1. `docker-compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml build`
1. `docker-compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml up`

#### Check to see if everything is working correctly

1. If you've successfully completed all of the steps the pages-core app is now ready to run locally! :tada:
1. You should now be able to see pages-core running at [http://localhost:1337](http://localhost:1337). Local file changes will cause the server to restart and/or the front end bundles to be rebuilt.

**Pro tips:**

In our Docker Compose environment, `app` is the name of the container where the pages-core web application runs. You can run any command in the context of the web application by running `docker-compose run --rm app <THE COMMAND>`.

For example:

- Use `docker-compose run --rm app yarn test` to run local testing on the app.
- Use `docker-compose run --rm app yarn lint` to check that your local changes meet our linting standards.

Similarly you can run any command in the context of the database container `db` by running `docker-compose run --rm db <THE COMMAND>`.

Note that when using `docker-compose run`, the docker network will not be exposed to your local machine. If you do need the network available, run `docker-compose run --rm --service-ports app <THE COMMAND>`.

The `db` container is exposed on port `5433` of your host computer to make it easier to run commands on. For instance, you can open a `psql` session to it by running `psql -h localhost -p 5433 -d pages -U postgres`.

The admin client is running on port `3000` of hour host computer.

Some aspects of the system aren't expected to be fully functional in a development environment. For example: the "View site" and "Uploaded files" links associated with sites in the seed data do not reach working URLs.

#### Front end application

If you are working on the front end of the application, the things you need to know are:

1. It is a React and Redux application
1. It is built with `webpack`
1. It lives in `/frontend`

To analyze the contents of the front end JavaScript bundle, use `docker-compose run --rm --service-ports app yarn analyze-webpack` after a build. Then visit http://127.0.0.1:8888 to see a visualization of the the bundle contents.

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
- `federalist-<environment>-sqs-creds`: A user-provided service that provides the application with SQS credentials that cannot be added to `manifest.yml` b/c that file is under version control; this service provides the following:
  - `access_key`: The AWS access key for SQS queue
  - `secret_key`: The AWS secret key for SQS queue
  - `region`: The AWS region
  - `sqs_url`: The AWS SQS queue URL
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

#### Deploy in CloudFoundry
To deploy to CloudFoundry submit the following:
`cf push federalistapp --strategy rolling --vars-file "./.cloudgov/vars/${CF_SPACE}.yml" -f ./cloudgov/manifest.yml`

### Continuous Integration
We are in the process of migrating from CircleCI to an internal instance of Concourse CI, starting with our staging environment. To use Concourse, one must have appropriate permissions in UAA as administered by the cloud.gov operators. Access to Concourse also requires using the GSA VPN.

1. To get started install and authenticate with the `fly` CLI:
- `brew install --cask fly`
- `fly -t <Concourse Target Name> login -n pages -c <concourse url>`

2. Update local credential files (see ci/vars/example.yml)

#### CI deployments
This repository contains two distinct deployment pipelines in concourse:
- [__Core__](./ci/pipeline.yml)
- [__Metrics__](./apps/metrics/ci/pipeline.yml)

__Core__ deploys the Pages app/api, the admin app, and the queues app. __Metrics__ deploys concourse tasks to check our app/infrastructure health.

#### Core deployment
##### Pipeline instance variables
Three instances of the pipeline are set for the `pages staging`, `pages production`, and `federalist production` environments. Instance variables are used to fill in Concourse pipeline parameter variables bearing the same name as the instance variable. See more on [Concourse vars](https://concourse-ci.org/vars.html). Each instance of the pipeline has three instance variables associated to it: `deploy-env`, `git-branch`. `product`

|Instance Variable |Pages Staging| Pages Production| Federalist Production|
--- | --- | ---| ---|
|**`deploy-env`**|`staging`|`production`|`production`|
|**`git-branch`**|`staging`|`main`|`main`|
|**`product`**|`pages`|`pages`|`federalist`|

##### Pipeline credentials
Concourse CI integrates directly with [Credhub](https://docs.cloudfoundry.org/credhub/) to provide access to credentials/secrets at job runtime. When a job is started, Concourse will resolve the parameters within the pipeline with the latest credentials using the double parentheses notation (ie. `((<credential-name>))`). See more about the [credentials lookup rules](https://concourse-ci.org/credhub-credential-manager.html#credential-lookup-rules).

Some credentials in this pipeline are "compound" credentials that use the pipeline's instance variable in conjuction with its parameterized variables to pull the correct Credhub credentials based on the pipeline instance. The following parameters are used in the proxy pipeline:

|Parameter|Description|Is Compound|
--- | --- | --- |
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer username based on the instanced pipeline|:white_check_mark:|
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer password based on the instanced pipeline|:white_check_mark:|
|**`((deploy-env))-((product))-domain`**|The deployment envinronment and product(Pages|Federalist) specific domain for the app|:white_check_mark:|
|**`((slack-channel))`**| Slack channel | :x:|
|**`((slack-username))`**| Slack username | :x:|
|**`((slack-icon-url))`**| Slack icon url | :x:|
|**`((slack-webhook-url))`**| Slack webhook url | :x:|
|**`((support-email))`**| Our support email address | :x:|
|**`((git-base-url))`**|The base url to the git server's HTTP endpoint|:x:|
|**`((pages-repository-path))`**|The url path to the repository|:x:|
|**`((gh-access-token))`**| The Github access token|:x:|

##### Setting up the pipeline
The pipeline and each of it's instances will only needed to be set once per instance to create the initial pipeline. After the pipelines are set, updates to the respective `git-branch` source will automatically set the pipeline with any updates. See the [`set_pipeline` step](https://concourse-ci.org/set-pipeline-step.html) for more information. Run the following command with the fly CLI to set a pipeline instance:

```bash
$ fly -t <Concourse CI Target Name> set-pipeline -p core \
  -c ci/pipeline.yml \
  -i git-branch=main \
  -i deploy-env=production
  -i product=pages
```

##### Getting or deleting a pipeline instance from the CLI
To get a pipeline instance's config or destroy a pipeline instance, Run the following command with the fly CLI to set a pipeline:

```bash
## Get a pipeline instance config
$ fly -t <Concourse CI Target Name> get-pipeline \
  -p core/deploy-env:production,git-branch:main,product:pages

## Destroy a pipeline
$ fly -t <Concourse CI Target Name> destroy-pipeline \
  -p core/deploy-env:production,git-branch:main,product:pages
```

#### Metrics deployment
##### Pipeline instance variables
Each instance of the pipeline has the following instance variables associated to it:

|Instance Variable |Pages Staging| Pages Production| Federalist Production|
--- | --- | ---| ---|
|**`deploy-env`**|`staging`|`production`|`production`|
|**`git-branch`**|`staging`|`main`|`main`|

##### Pipeline credentials
The following parameters are used in the proxy pipeline:

|Parameter|Description|Is Compound|
--- | --- | --- |
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer username based on the instanced pipeline|:white_check_mark:|
|**`((deploy-env))-cf-username`**|The deployment environments CloudFoundry deployer password based on the instanced pipeline|:white_check_mark:|
|**`((cf-org-auditor-username))`**| CF Org auditor username to check memory and other infrastructure across the org and spaces| :x:|
|**`((cf-org-auditor-password))`**| CF Org auditor password to check memory and other infrastructure across the org and spaces| :x:|
|**`((new-relic-metrics-license-key))`**| New Relic license key for posting custom metrics| :x:|
|**`((slack-channel))`**| Slack channel | :x:|
|**`((slack-username))`**| Slack username | :x:|
|**`((slack-icon-url))`**| Slack icon url | :x:|
|**`((slack-webhook-url))`**| Slack webhook url | :x:|
|**`((git-base-url))`**|The base url to the git server's HTTP endpoint|:x:|
|**`((pages-repository-path))`**|The url path to the repository|:x:|
|**`((gh-access-token))`**| The Github access token|:x:|

##### Setting up the pipeline
Run the following command with the fly CLI to set a pipeline instance:

```bash
$ fly -t <Concourse CI Target Name> set-pipeline -p metrics \
  -c ci/pipeline.yml \
  -i git-branch=main \
  -i deploy-env=production
  -i product=pages
```

##### Getting or deleting a pipeline instance from the CLI
To get a pipeline instance's config or destroy a pipeline instance, Run the following command with the fly CLI to set a pipeline:

```bash
## Get a pipeline instance config
$ fly -t <Concourse CI Target Name> get-pipeline \
  -p metrics/deploy-env:production,git-branch:main,product:pages

## Destroy a pipeline
$ fly -t <Concourse CI Target Name> destroy-pipeline \
  -p metrics/deploy-env:production,git-branch:main,product:pages
```

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
docker-compose run --rm app yarn test
```

You can also just run back or front end tests via:

```sh
docker-compose run --rm app yarn test:server  # for all back end tests
docker-compose run --rm app yarn test:server:file ./test/api/<path/to/test.js> # to run a single back end test file
docker-compose run --rm app yarn test:client  # for all front end tests
docker-compose run --rm app yarn test:client:watch  # to watch and re-run front end tests
docker-compose run --rm app yarn test:client:file ./test/frontend/<path/to/test.js> # to run a single front end test file
```

To view coverage reports as HTML after running the full test suite:

```sh
docker-compose run --rm --service-ports app yarn serve-coverage
```

and then visit http://localhost:8080.

For the full list of available commands that you can run with `yarn` or `npm`, see the `"scripts"` section of `package.json`.

### Linting

We use [`eslint`](https://eslint.org/) and adhere to [Airbnb's eslint config](https://www.npmjs.com/package/eslint-config-airbnb) (with some [minor exceptions](https://github.com/cloud-gov/pages-core/blob/staging/.eslintrc.js#L2)) as recommended by the [18F Front End Guild](https://frontend.18f.gov/javascript/style/).

Because this project was not initially written in a way that complies with our current linting standard, we are taking the strategy of bringing existing files into compliance as they are touched during normal feature development or bug fixing.

To lint the files in a branch, run:

```sh
docker-compose run --rm app yarn lint
```

`eslint` also has a helpful auto-fix command that can be run by:

```sh
docker-compose run --rm app node_modules/.bin/eslint --fix path/to/file.js
```

## Feature Flags
Environment-specific feature flags are supported for both the api and frontend. Flagged features are assumed to be "off" unless the flag exists (and the value is truthy), thus feature flag conditions should always check for the presence or truthiness of the flag, not for it's absence. Environment variables for feature flags *MUST* be prefixed by `FEATURE_`, ex. `FEATURE_BRING_THE_AWESOME` or `FEATURE_BRING_DA_RUCKUS`.

### Current available features

`FEATURE_AUTH_GITHUB`: Used in [`api/controllers/main.js`](./api/controllers/main.js) to enable authentication with Github oauth.
`FEATURE_AUTH_UAA`: Used in [`api/controllers/main.js`](./api/controllers/main.js) to enable authentication with the cloud.gov UAA.
`FEATURE_BULL_SITE_BUILD_QUEUE`: Used to enable to use of the redis backed bull queue.

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

## Initial proposal

Federalist is new open source publishing system based on proven open source components and techniques. Once the text has been written, images uploaded, and a page is published, the outward-facing site will act like a simple web site -- fast, reliable, and easily scalable. Administrative tools, which require authentication and additional interactive components, can be responsive with far fewer users.

Regardless of the system generating the content, all websites benefit from the shared editor and static hosting, which alleviates the most expensive requirements of traditional CMS-based websites and enables shared hosting for modern web applications.

From a technical perspective, a modern web publishing platform should follow the “small pieces loosely joined” API-driven approach. Three distinct functions operate together under a unified user interface:

1. **Look & feel of the website**
Templates for common use-cases like a departmental website, a single page report site, API / developer documentation, project dashboard, and internal collaboration hub can be developed and shared as open source repositories on GitHub. Agencies wishing to use a template simply create a cloned copy of the template, add their own content, and modify it to suit their needs. Social, analytics, and accessibility components will all be baked in, so all templates are in compliance with the guidelines put forth by SocialGov and Section 508.

2. **Content editing**
Content editing should be a separate application rather than built into the web server. This allows the same editing interface to be used across projects. The editing interface only needs to scale to match the load from *editors*, not *visitors*.

3. **Publishing infrastructure**
Our solution is to provide scalable, fast, and affordable static hosting for all websites. Using a website generator like Jekyll allows for these sites to be built dynamically and served statically.

## Related reading

- [18F Blog Post on Federalist's platform launch](https://18f.gsa.gov/2015/09/15/federalist-platform-launch/)
- [Building CMS-Free Websites](https://developmentseed.org/blog/2012-07-27-how-we-build-cms-free-websites)
- [Background on relaunch of Healthcare.gov’s front-end](http://www.theatlantic.com/technology/archive/2013/06/healthcaregov-code-developed-by-the-people-and-for-the-people-released-back-to-the-people/277295/)
- [HealthCare.gov uses lightweight open source tools](https://www.digitalgov.gov/2013/05/07/the-new-healthcare-gov-uses-a-lightweight-open-source-tool/)
- [A Few Notes on NotAlone.gov](https://18f.gsa.gov/2014/05/09/a-few-notes-on-notalone-gov/)


## License


### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.


### Exceptions

`public/images/illo-pushing-stone.png` and
`public/images/illo-pushing-stone@2x.png` concepts from ["Man Push The Stone" by
Berkah Icon, from the Noun
Project](https://thenounproject.com/berkahicon/collection/startup/?i=1441102)
made available under [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/us/legalcode).
