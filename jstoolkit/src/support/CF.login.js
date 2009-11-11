//= require <CF.context.js>
//= require <CF.url.js>
//= require <CF.loginMixin.js>
/**
 * @static
 * @class
 * A helper object for managing login/logout and the resulting state and events that occur along the way
 * */
CF.login = function ()
{
	
	/**
	 * @name CF.login#login_success
	 * @event
	 * @description
	 * Fired when a user has been logged into the CrowdFactory platform.
	 * @param auth_user the newly authorized user who was logged in.
	 * @param cf_token the new user's cf_token value. Will be null if !useCfToken
	 * @param jsessionid The jsessionid of the newly logged-in request.  Will be null if useCfToken
	 */
	
	/**
	 * @name CF.login#logout_success
	 * @event
	 * @description
	 * Fired when a user has been logged out of the CrowdFactory platform but before
	 * the CF.context has been invalidated.
	 */
	
	var that = {};
	that.events = CF.EventPublisher();
		
	/**
	 * Takes a regForm that will be used when the registration flow is activated.
	 * @param {Object} form
	 */
	that.setRegForm = function (form)
	{
		that.regForm = form;
	};

	 /**
	  * Reloads the context and hides the modal on completion.  Call this after a login / registration is 
	  * complete.  
	  */
	that.hideModalOnSuccess = function(sessionToken)
	{
		//Disarm the logout on modal hide event.
		if(that.modalHiddenEvt)
		{
			CF.modal.events.unlisten(that.modalHiddenEvt);
		}
		that.tokenLogin(sessionToken);
		CF.modal.hide();
	};
	
	/**
	 * Strips out any of the token passing parameters
	 * returns true if the params were altered.  False otherwise.
	 */
	that.cleanParams = function ()
	{
		var old = location.href;
		var c = CF.config.current;
		var n = CF.url.removeParam([c.loginProviderParam, c.loginTokenNameParam, CF.url.params(c.loginTokenNameParam)]);
		if (n != old)
		{
			location.href = n;
			return true;
		}
		return false;
	};
	
	
	/**
	 * Shows a registration form in a modal.   Will show the form set with 
	 * CF.login.setRegForm or if unset, will construct a new CF.widget.RegForm instance.
	 * @param {Object} data The data to pass to the form widget
	 */
	that.showRegForm = function(data, sessionToken){
		if (data.user)
		{
			that.tokenLogin(sessionToken, true);
			CF.context.auth_user = data.user;
		}
		CF.modal.show(that.regForm || "<div class='cf_widgetLoader' widgettype='CF.widget.RegForm' options='{syndicate:true}'></div>", data);
		//If the user closes the modal, they should be logged out immediately.  We will have to disable this event when they 
		//complete the form successfully.
		that.modalHiddenEvt = CF.modal.events.listen("modal_hidden", that.logout, true);
		CF.widget.registry.listenType("CF.widget.RegForm", "regform_complete", function (){
			that.hideModalOnSuccess(sessionToken);
		});
	};
	
	//Once the configuration is determined, we add in the appropriate methods to this static class.
	CF.config.events.listen("config_beforeComplete", function (){
		if (CF.config.current.use_cf_token)
			CF.loginMixin.AuthTokenCreateMixin(that);
		else
			CF.loginMixin.AuthLoginMixin(that);
	});
	
	//Auto logout users if a request goes through as an AuthError 106
	CF.config.events.listen("config_complete", function (){
		CF.context.api_v1.events.listen("request_completed", function (evt, url, data){
			if (data.error_code === 106 )
				that.logout();
		});		
	});
	
	return that;
}();