define('admin/plugins/sso-github', ['settings'], function(Settings) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('sso-github', $('.sso-github-settings'));

		$('#save').on('click', function() {
			Settings.save('sso-github', $('.sso-github-settings'), function() {
				app.alert({
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

		$("#restoreDefaultCallback").on("click", function ( )
		{
			$("#callback").val( $("#callback").attr( "defaultCallback" ) );
		} );
	};

	return ACP;
});