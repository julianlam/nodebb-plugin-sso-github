define('admin/plugins/sso-github', ['settings', 'alerts'], function(Settings, alerts) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-github', $('.sso-github-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-github', $('.sso-github-settings'), function() {
				alerts.alert({
					type: 'success',
					alert_id: 'sso-github-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});