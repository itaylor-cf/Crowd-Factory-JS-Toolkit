CF.loginMixin = {};

/**
*  The mixin that is used in the CF.login static class when using the old auth/login API.
*/

CF.loginMixin.AuthLoginMixin = function (that){

	that.login = function (userName, password)
	{
		CF.context.api_v1.login(that.handleLogin, userName, password);
	};
	/**
	 * Manually sets the current session cookie
	 * It will only work if the rest endpoint you are requesting is the same domain as
	 * current location.href 
	 */
	that.tokenLogin = function (jsessionId, noReload)
	{
		CF.cookie.createCookie(CF.config.current.sessionCookieName, jsessionId);
		if (!noReload)
		{
			if (CF.config.current.loginReload){
				if (!that.cleanParams())
					location.reload();
			}else{
				CF.context.reload();				
			}
		}
		
	};
	that.logout = function ()
	{
		CF.context.api_v1.logout(that.handleLogout);
	};
	that.handleLogout = function (result)
	{
		var c = CF.config.current;
		that.events.fire("logout_success");
		CF.cookie.eraseCookie(c.sessionCookieName);
		CF.context.invalidate();
		if (c.logoutReload)
			if (!that.cleanParams())
				location.reload();
	};
	that.handleLogin = function (result,error)
	{
		var c = CF.config.current;
		if (!error)
		{
			CF.context.reload(function () {
					that.events.fire("login_success", CF.context.auth_user);
					CF.cookie.createCookie(c.sessionCookieName);
					if (c.logoutReload)
						if (!that.cleanParams())
							location.reload();
				});
		}
		else
		{
			that.events.fire("login_fail", error);
		}
	};
		
};

/**
 * The mixin that is used when using the newer auth_token/create API for authentication.
 */
CF.loginMixin.AuthTokenCreateMixin = function (that)
{
	that.login = function (userName, password)
	{
		CF.context.api_v1.auth_token_create(that.handleLogin, userName, password);
	};
	/**
	 * Manually sets the current cf_token
	 */
	that.tokenLogin = function (cf_token, noReload)
	{
		CF.cookie.createCookie("cf_token", cf_token);
		CF.config.current.extraRestParams["cf_token"] = cf_token;
		that.cf_token = cf_token;
		if (!noReload)
		{
			if (CF.config.current.loginReload){
				if (!that.cleanParams())
					location.reload();
			}else{
				CF.context.reload();				
			}
		}
	};
	that.logout = function ()
	{
		CF.context.api_v1.auth_token_delete(that.handleLogout, that.cf_token);
	};
	that.handleLogout = function (result)
	{
		var c = CF.config.current;
		that.events.fire("logout_success");
		CF.cookie.eraseCookie("cf_token");
		delete CF.config.current.extraRestParams["cf_token"];
		that.cf_token = null;
		CF.context.invalidate();
		if (c.logoutReload)
			if (!that.cleanParams())
				location.reload();
	};
	
	that.handleLogin = function (result,error)
	{
		var c = CF.config.current;
		if (!error)
		{
			that.cf_token = cf_token;
			CF.cookie.createCookie("cf_token", that.cf_token);
			CF.config.current.extraRestParams["cf_token"] = that.cf_token;
			CF.context.userFetched(result.user);
			that.events.fire("login_success", result.user, that.cf_token, null);
			if (c.loginReload)
				if(!that.cleanParams())
					location.reload();			
		}
		else
		{
			/**
			 * @name CF.login#login_fail
			 * @event
			 * @description
			 * Fired when a user has failed to login successfully
			 * @param error The error object containing the failure reason.
			 */
			that.events.fire("login_fail", error);
		}
	};
	
	return that;
};