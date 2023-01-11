<div class="row">
	<div class="col-sm-2 col-12 settings-header">GitHub SSO</div>
	<div class="col-sm-10 col-12">
		<div class="alert alert-info">
			Register a new <strong>GitHub Application</strong> via
			<a href="https://github.com/settings/developers">Developer Applications</a> and then paste your application details here.
		</div>
		<form class="sso-github-settings">
			<div class="mb-3">
				<label for="id">Client ID</label>
				<input type="text" name="id" title="Client ID" class="form-control" placeholder="Client ID">
			</div>
			<div class="mb-3">
				<label for="secret">Client Secret</label>
				<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret" />
			</div>
			<div class="mb-3 alert alert-warning">
				<label for="callback">Your NodeBB&apos;s "Authorization callback URL"</label>
				<input type="text" id="callback" title="Authorization callback URL" class="form-control" value="{callbackURL}" readonly />
				<p class="form-text">
					Ensure that this value is set in your GitHub application&apos;s settings
				</p>
			</div>
			<div class="form-check">
				<input type="checkbox" class="form-check-input" id="disableRegistration" name="disableRegistration" />
				<label for="disableRegistration" class="form-check-label">
					Disable user registration via SSO
				</label>
			</div>
			<div class="form-check">
				<input type="checkbox" class="form-check-input" id="needToVerifyEmail" name="needToVerifyEmail" />
				<label for="needToVerifyEmail" class="form-check-label">
					Need user to verify email
				</label>
			</div>
			<p class="form-text">
				Restricting registration means that only registered users can associate their account with this SSO strategy.
				This restriction is useful if you have uesrs bypassing registration controls by using social media accounts, or
				if you wish to use the NodeBB registration queue.
			</p>
		</form>
	</div>
</div>

<!-- IMPORT admin/partials/save_button.tpl -->