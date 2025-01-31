## 0.15.2 (2025-01-31)

### Fixed

- don't fetch site user model, allow admin rebuild

## 0.15.1 (2025-01-27)

### Fixed

- add url to site build task response
- send back additional site info on creation, avoid initial error (#4704)
- restore admin webhook functionality (#4702)

## 0.15.0 (2025-01-15)

### Added

- Add db migrations for file storage service #2077

### Fixed

- Promote Pages better in GitHub Status Checks

### Maintenance

- close outstanding dependeabot vulnerabilities
- test @shared/ButtonLink.jsx #4672
-  test @shared/UsaIcon.jsx #4668
- Test frontend/pages/sites/SiteListItem.jsx and refactor/remove frontend/pages/sites/PublishedState.jsx
- Reenable sonarjs linting rules #4652
- Test shared/GithubBuildBranchLink #4670
- Test shared/GithubBuildShaLink #4669
- remove SiteUser and associated concepts (#4339)
- Test shared/GithubAuthButton #4671
- Test shared user org select #4667
- restore webpack bundle analyzer on dev (#4675)
- remove jobs.js (#4677)
- reconcile dependencies
- upgrade to express 5 (#4611)
- update docker uaa port to avoid zscaler conflict

### Documentation

- document testing strategies

## 0.14.0 (2024-11-20)

### Added

- allow rules to be suppressed from reports

### Fixed

- Site build polling and latest build branch
- use single build url upon creation (#4323)

### Maintenance

- don't fail the scheduled worker with missing sites
- Enable eslint-plugin-import for frontend and tests
- add pr code coverage to ci (#4643)
- Decouple local app frontend build #4649
- start rtl transition (#4635)
- Run prettier formatting on codebase
- Update linting and formatting

## 0.13.2 (2024-10-28)

### Maintenance

- remove extra quotes from cron definition
- use consistent memory across envs
- implement nested folder route mapping
- improve component separation of concerns, hooks, purity

## 0.13.1 (2024-10-17)

### Maintenance

- separate nightly tasks
- organize react components to better match architecture guide

## 0.13.0 (2024-10-02)

### Added

- Upgrade admin and app to USWDS V3

## 0.12.0 (2024-09-25)

### Added

- add success criteria to a11y findings

### Fixed

- wrong instance count on zap alert titles
- separate anchors between suppressed and unsuppressed
- usability improvements to the report result content display
- make urls wrap in report headers
- URLs should wrap on the report index page
- show report types even when filtered

### Maintenance

- regenerate lockfile, remove some overrides
- don't audit devDependencies
- add more references to a11y scan findings using ACT ids
- add act id mapping
- UX improvements for findings with multiple match criteria
- update rule suppression related to search.gov and dap
- usability improvements to reports
- improve display of pages-suppressed rules in report config settings

## 0.11.1 (2024-09-09)

### Fixed

- Site builds polling to use doc visibilityState #4591
- use serialized site reponse to fix build preview link
- restore the ability to rebuild failed latest branches

## 0.11.0 (2024-09-04)

### Added

- Auto refresh site builds statuses
- **admin**: Add edit functionality to site build task run day
- **admin**: Add runDay input to manage build tasks
- Add in app report rendering
- add build scans page (#4539)
- style  build scan config (#4261)

### Fixed

- API should only update a site build tasks metadata rules
- API build tasks report logging
- rule match should be an array

### Maintenance

- add dap rule suppressions
- update suppression language to allow for more forms of suppressed rules
- Improve build task dev experience
- swap experiment icon for report icon in report button
- Upgrade dependency axios to v1.7.5
- fix missing data from zap findings
- add test for previous bug
- unvendor the node modules

## 0.10.0 (2024-07-03)

### Added

- add build scan config (#4261)

### Maintenance

- **ci**: fix production release step
- **ci**: ci update, use pipeline-tasks, boot, multi-env

## 0.9.3 (2024-06-18)

### Fixed

- Only encrypt site build param values based on defined keys
- reorder session auth logic, handle redirect to prevent unhandled 500 errors
- **admin**: Show UAAIdentity ID in Admin User page (#4501)
- send 401 response for bad auth callback (#4512)

### Maintenance

- remove metrics, update yarn.lock
- **deps**: bump the npm_and_yarn group across 2 directories with 2 updates
- **ci**: Add necessary pipeline OCI image resources to staging and prod
- yarn.lock regeneration
- wait for db port on ci tests
- Add build metrics query examples (#4500)
- harden docker in docker use
- Encrypt build task CF task param values #4509

## 0.9.2 (2024-05-21)

### Maintenance

- update release script
- Update metrics app dependencies (#4419)
- Increase prod queue concurrencies to max 10
- Remove decommissioned site build queue related to pages-builder
- Encrypt site build params #4464
- use hardened postgres

## 0.9.1 (2024-05-14)

### Maintenance

- update the memory and disk settings for large containers

## 0.9.0 (2024-05-13)

### Added

- build metrics API (#4328)

### Fixed

- use nested merge for build metrics
- Send sandbox reminders to UAA email address (#4425)

### Maintenance

- release build scans in production
- container hardening
- **docs**: Add documentation for working with and creating queues
- Refactor build task queue job processor
- Refactor site build queue and worker

## 0.8.2 (2024-04-24)

### Maintenance

- add build task cancelled state

## 0.8.1 (2024-04-19)

### Maintenance

- for build task targets, use domain for production branch urls

## 0.8.0 (2024-04-17)

### Added

- Revamp build scan display per #4446
- Add concurrency and polling to build task queue worker
- add build scan priority (#4476)

### Maintenance

- **admin**: add extra information for testing scans

## 0.7.1 (2024-04-11)

### Fixed

- import Event model for logout error logging
- prevent restarting build tasks, use enum, add test

### Documentation

- Add frontend conventions to DEVELOPMENT.md

## 0.7.0 (2024-04-02)

### Added

- Show last signin instead of last update in organization users list
- Allow organization managers to resend invitations (#4371)
- add accessibility scan (#4410)
- update email layouts with new template (#4373)
- add uswds identifier (#4413)
- **admin**: add limited ability to register build tasks to a site
- Update email invites based on user UAA origin #4370

### Fixed

- Fetch error for old build logs based on build details
- resolve two async/await errors
- Fix skipped heading levels in user settings page (#4396)
- Fix skipped heading levels in sites list (#4396)
- Add row header to published files table (#4397)
- update reauthenication logic
- update build task status logic (#4404)
- Add message explaining that build logs are deleted after 180 days. (#4379)
- Make invitation URL copyable (#4108)

### Maintenance

- vendor node dependencies
- **ci**: use hardened node image, update playwright docs
- try separate table dropping for user report test
- update webpack and associated dependencies
- Update passport deps and remove deprecated GH auth
- update axios, remove unnecessary tests
- **ci**: add hardened playwright, registry-image, general-task

## 0.6.1 (2024-02-22)

### Documentation

- update developer documentation about commit patterns

## 0.6.0 (2024-02-16)

### Added

- Simplify add org member form
- Remove Github username from invite #4369
- **ops**: Add invite flowchart to docs

### Fixed

- **ci**: Remove erroneous container params in stage/prod
- **ci**: Run db migrations in CI task container with SSL #4354

### Maintenance

- Update resource types to use hardened images
- Run build log archive job in dev and staging as well #4367
- Add Dev and Staging section to OPERATIONS.md, starting with manual migrations #4366
- Make Build a paranoid model (enable soft deletion) #4366
- Remove isActive from User #4338

## 0.5.2 (2023-12-21)

### Maintenance

- Fix build task feature flag

## 0.5.1 (2023-12-20)

### Maintenance

- reimplement build task feature flag handling

## 0.5.0 (2023-12-20)

### Added

- add build task ui (#4171)
- **admin**: Add active users report #4313

### Fixed

- don't throw if user isn't present on build
- catch the InvalidRange v3 error, don't fail the last build log fetch
- Check buildShaLink args if null on site build logs page
- add e2e tests in staging, build env vars to build step
- Await createUAAIdentity in admin user API tests
- Explicitly truncate UAAIdentity after admin user API tests
- Add global Sequelize hook to make count behavior consistent with find.

### Maintenance

- Update CommitSummary commponent data fetch to useState
- correct staging e2e pipeline
- Upgrade local and CI to Postgres v15
- update depedencies
- Fix syntax error and remove outdated setup step from developer documentation

## 0.4.1 (2023-11-30)

### Fixed

- transform AWS SDK Readable to string
- Add queue name for site build and build task  queues

### Maintenance

- Remove bull to complete bullmq transition
- upgrade major deps from audit
- update dependencies, minor patch bumps for pages core and admin client

## 0.4.0 (2023-11-16)

### Added

- Auto rotate site bucket keys #153
- add owasp zap scan task type migration (#4260)

### Fixed

- call correct fetchUser function on github auth (#4301)
- **ci**: Update ci staging audit src
- Make site uploaded files page work properly for sites without previews

### Maintenance

- Add length limit validation before branch name regex
- correct audit in staging, prod ci
- add yarn audit to ci (#4250)
- security/dependency updates
- add initial playwright implementation (#4102)
- add small adjustment to dev env setting
- Upgrade to AWS SDK V3 (#3989)
- update slack release notes format and bump pattern matcher

## 0.3.2 (2023-10-19)

### Fixed

- Fixes domain checkProvisionStatus with new CF api response

## 0.3.1 (2023-10-17)

### Maintenance

- Refine site repo migration docs

## 0.3.0 (2023-10-10)

### Added

- implement build task runners, call CF API directly (#4259)
- add build task queue and example worker (#4248)
- add build task router and controller (#4169)
- add DB models to support build task feature (#4184)
- Allow users to create custom domains to prepare launch

### Fixed

- Admin UI for updated site branch configs and domains

### Maintenance

- Improve name and path and update published sites report
- Update deps using json5 #4249
- Update CF API to V3 #4112
- update uaa war release download location
- use correct path for release notes

## 0.2.1 (2023-08-22)

### Performance

- Update pages production app to 4 instance with 512mb

## 0.2.0 (2023-08-16)

### Added

- Added site custom domains page | Updated domain model and admin | #4199

### Fixed

- Site serializer domain and branch config pick
- Fixed branchViewLink to use branch config and domain model #4032
- restore viewbox to svg icons for proper rendering

### Maintenance

- extend dependabot config to admin and metrics (#4217)
- add slack notification to release (#4216)
- update dependencies
- run dev tests in parallel with build, update dependabot (#4196)
- Build test webpack assets in non-version-controlled directory (#4191)
- add github release to production deploy (#4216)
- update deployment documentation
- correct release PR behavior (#4162)

## 0.1.0 (2023-08-02)

### Added

- Restructure site model with site branch config relation
- Add report of published sites per org and Reports admin menu item.
- Enable omission of search form in PaginatedQueryPage.

### Fixed

- Pages logo replaces Federalist logo in Pages Admin header (#4186)
- Remove dependencies on json-to-csv and abandoned json2csv version
- Move globals from frontend source files into ESLint config.
- Remove js-file-download dependency.

### Maintenance

- fix minor issues in release pipeline, gh status checks (#4162)
- create new production deployment on tag
- add automated release PRs
- Add nightly builds queue to bull board #4198
- Update nightly builds queue query #4198
- document use of conventional commits

## 0.0.0 (2023-07-19)

Work done prior to the release schedule
