'use strict';

const User = require.main.require('./src/user');
const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');
const nconf = require.main.require('nconf');
const passport = require.main.require('passport');
const GithubStrategy = require('passport-github2').Strategy;

const constants = Object.freeze({
	name: 'GitHub',
	admin: {
		icon: 'fa-github',
		route: '/plugins/sso-github',
	},
});

const GitHub = module.exports;

GitHub.init = async function (data) {
	const hostHelpers = require.main.require('./src/routes/helpers');

	hostHelpers.setupAdminPageRoute(data.router, '/admin/plugins/sso-github', function (req, res) {
		res.render('admin/plugins/sso-github', {
			title: constants.name,
			callbackURL: nconf.get('url') + '/auth/github/callback',
		});
	});

	hostHelpers.setupPageRoute(data.router, '/deauth/github', [data.middleware.requireUser], function (req, res) {
		res.render('plugins/sso-github/deauth', {
			service: constants.name,
		});
	});
	data.router.post('/deauth/github', [data.middleware.requireUser, data.middleware.applyCSRF], hostHelpers.tryRoute(async function (req, res) {
		await GitHub.deleteUserData({
			uid: req.user.uid,
		});
		res.redirect(nconf.get('relative_path') + '/me/edit');
	}));
};

GitHub.getStrategy = async function (strategies) {
	const settings = await meta.settings.get('sso-github');
	GitHub.settings = settings;

	if (settings.id && settings.secret) {
		passport.use(new GithubStrategy({
			clientID: settings.id,
			clientSecret: settings.secret,
			callbackURL: nconf.get('url') + '/auth/github/callback',
			passReqToCallback: true,
			scope: ['user:email'], // fetches non-public emails as well
		}, async function (req, token, tokenSecret, profile, done) {
			try {
				if (req.hasOwnProperty('user') && req.user.hasOwnProperty('uid') && req.user.uid > 0) {
					// Save GitHub -specific information to the user
					await User.setUserField(req.user.uid, 'githubid', profile.id);
					await db.setObjectField('githubid:uid', profile.id, req.user.uid);
					return done(null, req.user);
				}

				const email = Array.isArray(profile.emails) && profile.emails.length ? profile.emails[0].value : '';
				const pictureUrl = Array.isArray(profile.photos) && profile.photos.length ? profile.photos[0].value : '';
				const { queued, uid, message } = await GitHub.login(
					req, profile.id, profile.displayName, profile.username, email, pictureUrl
				);
				if (queued) {
					return done(null, false, { message });
				}

				done(null, { uid });
			} catch (err) {
				done(err);
			}
		}));

		strategies.push({
			name: 'github',
			url: '/auth/github',
			callbackURL: '/auth/github/callback',
			icon: constants.admin.icon,
			icons: {
				normal: 'fa-brands fa-github',
				square: 'fa-brands fa-github-square',
			},
			labels: {
				login: '[[social:sign-in-with-github]]',
				register: '[[social:sign-up-with-github]]',
			},
			color: '#25292f',
			scope: 'user:email',
		});
	}

	return strategies;
};

GitHub.appendUserHashWhitelist = function (data) {
	data.whitelist.push('githubid');
	return data;
};

GitHub.getAssociation = async function (data) {
	const githubid = await User.getUserField(data.uid, 'githubid');
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
			icon: constants.admin.icon,
		});
	}
	return data;
};

GitHub.login = async function (req, githubID, displayName, username, email, pictureUrl) {
	if (!email) {
		email = username + '@users.noreply.github.com';
	}

	let uid = await GitHub.getUidByGitHubID(githubID);
	if (uid) {
		return { uid };
	}

	uid = await User.getUidByEmail(email);
	if (uid) { // Link github account to existing user with same email
		await Promise.all([
			User.setUserField(uid, 'githubid', githubID),
			db.setObjectField('githubid:uid', githubID, uid),
		]);
		return { uid };
	}

	// Abort user creation if registration via SSO is restricted
	if (GitHub.settings.disableRegistration === 'on') {
		throw new Error('[[error:sso-registration-disabled, GitHub]]');
	}

	return await User.createOrQueue(req, {
		githubid: githubID,
		username: username,
		email: email,
		fullname: displayName,
		picture: pictureUrl,
	}, {
		emailVerification: GitHub.settings.needToVerifyEmail === 'on' ? 'send' : 'verify',
	});
};

GitHub.addToApprovalQueue = async (hookData) => {
	await saveGitHubSpecificData(hookData.data, hookData.userData);
	return hookData;
};

GitHub.filterUserCreate = async (hookData) => {
	await saveGitHubSpecificData(hookData.user, hookData.data);
	return hookData;
};

async function saveGitHubSpecificData(targetObj, sourceObj) {
	const { githubid, picture } = sourceObj;
	if (githubid) {
		const uid = await GitHub.getUidByGitHubID(githubid);
		if (uid) {
			throw new Error('[[error:sso-account-exists, GitHub]]');
		}
		targetObj.githubid = githubid;
		if (picture) {
			targetObj.picture = picture;
			targetObj.uploadedpicture = picture;
		}
	}
}

GitHub.actionUserCreate = async (hookData) => {
	const { uid } = hookData.user;
	const githubid = await User.getUserField(uid, 'githubid');
	if (githubid) {
		await db.setObjectField('githubid:uid', githubid, uid);
	}
};

GitHub.filterUserGetRegistrationQueue = async (hookData) => {
	const { users } = hookData;
	users.forEach((user) => {
		if (user?.githubid) {
			user.sso = {
				icon: 'fa-brands fa-github',
				name: constants.name,
			};
		}
	});
	return hookData;
};

GitHub.getUidByGitHubID = async function (githubID) {
	const uid = await db.getObjectField('githubid:uid', githubID);
	return uid;
};

GitHub.addMenuItem = function (custom_header) {
	custom_header.authentication.push({
		route: constants.admin.route,
		icon: constants.admin.icon,
		name: constants.name,
	});
	return custom_header;
};

GitHub.deleteUserData = async function (data) {
	const { uid } = data;
	const githubid = await User.getUserField(uid, 'githubid');
	if (githubid) {
		await db.deleteObjectField('githubid:uid', githubid);
		await db.deleteObjectField('user:' + uid, 'githubid');
	}
};


