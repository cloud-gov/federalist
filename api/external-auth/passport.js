const GitHubStrategy = require('passport-github').Strategy;
const Passport = require('passport');
const config = require('../../config');
const { User } = require('../models');

const passport = new Passport.Passport();

const options = config.passport.github.externalOptions;

const onSuccess = (accessToken, _refreshToken, _profile, callback) => {
  const username = _profile.username.toLowerCase();
  User.findOne({
    attributes: ['signedInAt'],
    where: {
      username,
    },
  })
    .then((user) => {
      if (!user) {
        throw new Error([
          'Unauthorized:',
          'You must be a cloud.gov Pages user with your GitHub account',
          'added to your cloud.gov Pages profile.',
        ].join(' '));
      }

      if ((new Date() - user.signedInAt) > config.session.cookie.maxAge) {
        throw new Error([
          'Session Expired:',
          'It has been more than 24 hours since you have logged-in to cloud.gov Pages.',
          'Please log in to cloud.gov Pages and try again.',
        ].join(' '));
      }

      callback(null, { accessToken });
    })
    .catch((err) => {
      const { message } = err;
      callback(null, { message });
    });
};

passport.use(new GitHubStrategy(options, onSuccess));

module.exports = passport;
