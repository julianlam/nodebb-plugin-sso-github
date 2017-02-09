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
            <label for="callback">Your NodeBB&apos;s "Authorization callback URL"</label>
            <input type="text" name="callback" title="Authorization callback URL" class="form-control" id="callback" defaultCallback="{defaultCallbackURL}" />
            <p class="help-block">
                Ensure that this value is set in your GitHub application&apos;s settings.
            </p>
		</form>
        <button class="btn btn-lg btn-primary" id="restoreDefaultCallback">Restore default callback</button>
	</div>
</div>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>