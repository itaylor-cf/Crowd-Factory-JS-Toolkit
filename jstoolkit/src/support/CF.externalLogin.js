//= require <CF.context.js>
//= require <CF.login.js>

CF.externalLogin = function ()
{
	var that = {};
	
	that.showRegFormOrAddAltId = function (token, provider)
	{
		if (!CF.context.auth_user)
		{
			jQuery(function (){
				CF.modal.show(loginInProg, null, {width:500});
				CF.context.api_v1.loginreg_auth(that.tokenValidated, token, provider);
			});	
		}
		else
		{
			//User was already logged in... they aren't perfoming a registration, they are adding a syndication
			//provider.  Grab their profile and add it as an alt_id.
			var altIdAddFx = function (profile, error){
				if(!error)
					CF.context.api_v1.alt_id_user_add(that.altIdAddComplete, CF.context.auth_user.external_id, profile.provider_name, profile.alt_id);
				else
					that.altIdAddError();
			};
			CF.context.api_v1.external_profile_get(altIdAddFx, provider, {token:token});
		}
	};

	that.altIdAddError = function ()
	{
		CF.modal.show(CF.build(".cf_login_in_progress", [CF.build("h2", "Error linking account"), CF.build("p", "We were unable to link your account.  Please try again."), CF.build('a', "Close").click(function (){window.close();})]));
	};

	
	/**
	 * Handles the loginreg/auth result, showing the reg form if necessary. 
	 * @param {Object} result
	 * @param {Object} error
	 */	
	that.tokenValidated = function (result, error)
	{
		var c = CF.config.current;
		if (error) {
			CF.modal.show(CF.build(".cf_login_in_progress", [CF.build("h2", "We were unable to log you in"), CF.build("p", "Please try again"), CF.build('a', "Close").click(CF.modal.hide)]));
		}
		else if (result.loginSuccess) {
			CF.login.hideModalOnSuccess(result.jsessionid || result.cf_token);
		}
		else if (result.user) {
			var params = CF.url.params();
			var provider = params[c.loginProviderParam];
			if (provider) {
				CF.login.showRegForm({
					user: result.user,
					requirePass: false,
					provider:provider
				}, result.jsessionid || result.cf_token);
			}
		}
	};
	
	that.processParameters = function ()
	{
		var params = CF.url.params();
		var c = CF.config.current;
		var provider = params[c.loginProviderParam];
		if(provider)
		{
			var token = params[params[c.loginTokenNameParam]];
			loginInProg = CF.build(".cf_login_in_progress", [CF.build("h2", "We are processing your login request"), 
				                                                 CF.build("p", "Please wait...")
				                                                 ]);
			CF.context.whenLoaded(function (){that.showRegFormOrAddAltId(token, provider);}, true);
		}
	};
	
	that.altIdAddComplete = function (result, error)
	{
		CF.log("added alt_id");
		if (error)
			that.altIdAddError();
		else{
			var close = CF.url.params("cf_window_close");
			if(close)
			{
				if(window.parent && window.opener.CF && window.opener.CF[close]);
				{
					if (CF.isIE())
					{
						//IE (8) has a bug with window.postMessage that makes it impossible to call to window.opener directly.
						//This workaround allows the other window to  
						window.opener.CF._evtQueue.push(close);
						window.open('','_self','');
					}
					else
						window.opener.CF[close].call(window.opener);
					
				    window.close();					
				}				
			}
		}
	};
	
	CF.config.events.listen("config_complete", that.processParameters);
	return that;
}();