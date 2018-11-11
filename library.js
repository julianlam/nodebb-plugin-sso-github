(function(module) {
	"use strict";

	var User = require.main.require('./src/user');
	var db = require.main.require('./src/database');
	var meta = require.main.require('./src/meta');
	var nconf = require.main.require('nconf');
	var async = require.main.require('async');
	var passport = require.main.require('passport');
	var GithubStrategy = require('passport-github2').Strategy;

	var winston = module.parent.require('winston');

	var authenticationController = require.main.require('./src/controllers/authentication');

	var constants = Object.freeze({
		'name': "GitHub",
		'admin': {
			'icon': 'fa-github',
			'route': '/plugins/sso-github'
		}
	});

	var GitHub = {};

	GitHub.getStrategy = function(strategies, callback) {
		meta.settings.get('sso-github', function(err, settings) {
			GitHub.settings = settings;

			if (!err && settings.id && settings.secret) {
				passport.use(new GithubStrategy({
					clientID: settings.id,
					clientSecret: settings.secret,
					callbackURL: nconf.get('url') + '/auth/github/callback',
					passReqToCallback: true,
					scope: [ 'user:email' ] // fetches non-public emails as well
				}, function(req, token, tokenSecret, profile, done) {
					if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
						// Save GitHub -specific information to the user
						User.setUserField(req.user.uid, 'githubid', profile.id);
						db.setObjectField('githubid:uid', profile.id, req.user.uid);
						return done(null, req.user);
					}

					var email = Array.isArray(profile.emails) && profile.emails.length ? profile.emails[0].value : '';
					GitHub.login(profile.id, profile.username, email, profile._json.avatar_url, function(err, user) {
						if (err) {
							return done(err);
						}

						authenticationController.onSuccessfulLogin(req, user.uid);
						done(null, user);
					});
				}));

				strategies.push({
					name: 'github',
					url: '/auth/github',
					callbackURL: '/auth/github/callback',
					icon: constants.admin.icon,
					scope: 'user:email'
				});
			}

			callback(null, strategies);
		});
	};

	GitHub.appendUserHashWhitelist = function (data, callback) {
		data.whitelist.push('githubid');
		return setImmediate(callback, null, data);
	};

	GitHub.getAssociation = function(data, callback) {
		User.getUserField(data.uid, 'githubid', function(err, githubid) {
			if (err) {
				return callback(err, data);
			}

			if (githubid) {
				data.associations.push({
					associated: true,
					name: constants.name,
					icon: constants.admin.icon,
					deauthUrl: nconf.get('url') + '/deauth/github',
				});
			} else {
				data.associations.push({
					associated: false,
					url: nconf.get('url') + '/auth/github',
					name: constants.name,
					icon: constants.admin.icon
				});
			}

			callback(null, data);
		})
	};

	GitHub.login = function(githubID, username, email, avatar_url, callback) {
		if (!email) {
			email = username + '@users.noreply.github.com';
		}

		GitHub.getUidByGitHubID(githubID, function(err, uid) {
			if (err) {
				return callback(err);
			}

			if (uid) {
				// Existing User
				callback(null, {
					uid: uid
				});
			} else {
				// New User
				var success = function(uid) {
					// trust github's email
					User.setUserField(uid, 'email:confirmed', 1);
					db.sortedSetRemove('users:notvalidated', uid);

					User.setUserField(uid, 'githubid', githubID);

					// set profile picture
					User.setUserField(uid, 'uploadedpicture', avatar_url);
					User.setUserField(uid, 'picture', avatar_url);

					db.setObjectField('githubid:uid', githubID, uid);
					callback(null, {
						uid: uid
					});
				};

				User.getUidByEmail(email, function(err, uid) {
					if (!uid) {
						// Abort user creation if registration via SSO is restricted
						if (GitHub.settings.disableRegistration === 'on') {
							return callback(new Error('[[error:sso-registration-disabled, GitHub]]'));
						}

						User.create({username: username, email: email}, function(err, uid) {
							if (err !== null) {
								callback(err);
							} else {
								success(uid);
							}
						});
					} else {
						success(uid); // Existing account -- merge
					}
				});
			}
		});
	};

	GitHub.getUidByGitHubID = function(githubID, callback) {
		db.getObjectField('githubid:uid', githubID, function(err, uid) {
			if (err) {
				callback(err);
			} else {
				callback(null, uid);
			}
		});
	};

	GitHub.addMenuItem = function(custom_header, callback) {
		custom_header.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		callback(null, custom_header);
	};

	GitHub.init = function(data, callback) {
		var hostHelpers = require.main.require('./src/routes/helpers');

		function renderAdmin(req, res) {
			res.render('admin/plugins/sso-github', {
				callbackURL: nconf.get('url') + '/auth/github/callback'
			});
		}

		data.router.get('/admin/plugins/sso-github', data.middleware.admin.buildHeader, renderAdmin);
		data.router.get('/api/admin/plugins/sso-github', renderAdmin);

		hostHelpers.setupPageRoute(data.router, '/deauth/github', data.middleware, [data.middleware.requireUser], function (req, res) {
			res.render('plugins/sso-github/deauth', {
				service: "GitHub",
			});
		});
		data.router.post('/deauth/github', [data.middleware.requireUser, data.middleware.applyCSRF], function (req, res, next) {
			GitHub.deleteUserData({
				uid: req.user.uid,
			}, function (err) {
				if (err) {
					return next(err);
				}

				res.redirect(nconf.get('relative_path') + '/me/edit');
			});
		});

		callback();
	};

	GitHub.deleteUserData = function(data, callback) {
		var uid = data.uid;

		async.waterfall([
			async.apply(User.getUserField, uid, 'githubid'),
			function(oAuthIdToDelete, next) {
				db.deleteObjectField('githubid:uid', oAuthIdToDelete, next);
			},
			async.apply(db.deleteObjectField, 'user:' + uid, 'githubid'),
		], function(err) {
			if (err) {
				winston.error('[sso-github] Could not remove OAuthId data for uid ' + uid + '. Error: ' + err);
				return callback(err);
			}
			callback(null, uid);
		});
	};

	module.exports = GitHub;
}(module));
