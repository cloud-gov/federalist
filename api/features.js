const getEnv = require('../config/features');

const Flags = {
  /*
    All feature flags must be explicitly added here so they can be exported
    and referred to as Flags.<FEATURE_NAME>
    Ex.
    FEATURE_AWESOME_FEATURE: 'FEATURE_AWESOME_FEATURE',
    */
  FEATURE_AUTH_GITHUB: 'FEATURE_AUTH_GITHUB',
  FEATURE_AUTH_UAA: 'FEATURE_AUTH_UAA',
  FEATURE_BUILD_TASKS: 'FEATURE_BUILD_TASKS',

};

const TRUTHY_VALUES = [true, 'True', 'true', 'TRUE'];

function readEnv(envVar) {
  return getEnv()[envVar];
}

class UnknownFeatureFlagError extends Error {
  constructor(flag, ...args) {
    const flagsStr = Object.keys(Flags).map(f => `\n- ${f}`).join('');
    const msg = `Requested feature status for unknown feature flag '${flag}'. Available flags are:${flagsStr}`;
    super(msg, ...args);
  }
}

function enabled(flag) {
  if (!Object.keys(Flags).includes(flag)) {
    throw new UnknownFeatureFlagError(flag);
  }

  return TRUTHY_VALUES.includes(readEnv(flag));
}

module.exports = {
  enabled, Flags, UnknownFeatureFlagError,
};
