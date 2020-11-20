<div class="row">
	<div class="col-sm-2 col-xs-12 settings-header">GitHub SSO</div>
	<div class="col-sm-10 col-xs-12">
		<div class="alert alert-info">
			<p>
				Register a new <strong>GitHub Application</strong> via 
				<a href="https://github.com/settings/developers">Developer Applications</a> and then paste
				your application details here.
			</p>
		</div>
		<form class="sso-github-settings">
			<div class="form-group">
				<label for="id">Client ID</label>
				<input type="text" name="id" title="Client ID" class="form-control" placeholder="Client ID">
			</div>
			<div class="form-group">
				<label for="secret">Client Secret</label>
				<input type="text" name="secret" title="Client Secret" class="form-control" placeholder="Client Secret" />
			</div>
			<div class="form-group alert alert-warning">
				<label for="callback">Your NodeBB&apos;s "Authorization callback URL"</label>
				<input type="text" id="callback" title="Authorization callback URL" class="form-control" value="{callbackURL}" readonly />
				<p class="help-block">
					Ensure that this value is set in your GitHub application&apos;s settings
				</p>
			</div>
			<div class="checkbox">
				<label for="disableRegistration" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" id="disableRegistration" name="disableRegistration" />
					<span class="mdl-switch__label">Disable user registration via SSO</span>
				</label>
			</div>
			<div class="checkbox">
				<label for="needToVerifyEmail" class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input type="checkbox" class="mdl-switch__input" id="needToVerifyEmail" name="needToVerifyEmail" />
					<span class="mdl-switch__label">Need user to verify email</span>
				</label>
			</div>
			<p class="help-block">
				Restricting registration means that only registered users can associate their account with this SSO strategy.
				This restriction is useful if you have uesrs bypassing registration controls by using social media accounts, or
				if you wish to use the NodeBB registration queue.
			</p>
		</form>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>