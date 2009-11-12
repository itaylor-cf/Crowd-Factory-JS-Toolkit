//= require <CF.session.js>

/**
 * @class
 * @static
 * CF.context holds on to the current user context and the current API instance.  It stores the current user
 * on the client side whenever possible to avoid multiple trips to fetch the current user.
 * 
 * For it to complete its startup, you need to pass it a RestV1 object configured appropriately for your endpoint.
 * @see CF.RestV1 
 * 
 * @Usage 
 * var myRest =  CF.RestV1("http://www.mydomain.com", "rest", {product:myproduct, subscriber:mysubscriber, topcommunity:mytopcommunity, pretty:1}); 
 * CF.context.setApi(myRest);
 * CF.context.whenLoaded(function ()
 * 	{
 * 		//At this point, the 
 * 	    //CF.context.auth_user will be set to the current logged in user or null if there was no logged in user
 *  });
 * CF.context.api_v1.entity_get(myCompleteFx, "myEntityId");
 * 
 */
CF.context = function ()
{
	var that = {};
	var sess = CF.session.instance;
	/**
	 * @type CF.EventPublisher
	 */
	that.events = CF.EventPublisher();	
	/**
	 * @type CF.RestV1
	 */
	that.api_v1;
		
	that.whenLoaded = function (fx, once)
	{
		if (that.isLoaded)
		{
			fx(that);
			if (!once)
				that.events.listen("context_loaded", fx, once);
		}
		else
			that.events.listen("context_loaded", fx, once);
	};
	that.userFetched = function (user, error)
	{
		if(error)
			that._clearUser();
		else
			that._storeUser(user);
		that.loadComplete();
	};
	that._storeUser = function (user)
	{
		that.auth_user = user;
		sess.put("auth_user", user);
		sess.persist();
	};
	that._clearUser = function ()
	{
		that.auth_user = null;
		sess.remove("auth_user");
		sess.persist();
	};
	that.loadComplete = function ()
	{
		that.isLoaded = true;
		that.events.fire("context_loaded", that);
	};
	that.load = function ()
	{
		if (!that.api_v1)
		{
			that.waitingForApi = true;
			return;
		}
		var usr = sess.get("auth_user");
		that.auth_user = usr;
		if (!usr)
			that.reload();
		else
			that.loadComplete();
	};
	/**
	 * Reloads the current user, but does not fire any events related to the context
	 * being re-evaluated, unless the user state switches from logged-in to logged out
	 * or vice-versa.  Use this when you've performed an action that may have
	 * changed a small amount of the user's profile, but don't want all the widgets
	 * to reload.
	 * This will call to fx with the final result, and CF.context.auth_user will be set.
	 */
	that.silentUpdateUser = function (fx)
	{
		var oldUser = CF.context.auth_user;
		var update = function(user, error){
			if ((error && !oldUser && !user) || (!error && user && oldUser))
			{
			   that._storeUser(user);

			}
			else //if the user status changed, we must process a whole user status reload.
			{
				that.userFetched(user, error);
			}
			if(fx)
				fx(user, error);	
		};
		that.api_v1.user_get(update);
		
	};
	that.invalidate = function ()
	{
		that._clearUser();
		that.events.fire("context_loaded");
	};
	that.reload = function (fx)
	{
		that.isLoaded = false;
		if (fx && jQuery.isFunction(fx))
			that.whenLoaded(fx, true);
		that.api_v1.user_get(that.userFetched);
	};
	
	that.setApi = function (api_v1)
	{
		that.api_v1 = api_v1;
		if (that.waitingForApi)
		{
			that.waitingForApi=false;
			that.load();
		}
	};
	/**
	 * This calls to the REST API periodically to keep the session fresh.
	 * we ping 5 minutes before the cf_token_timeout refresh, at a min of 5 minutes.
	 * This means by default we ping every 25 mins.
	 */
	that.startPinger = function ()
	{
		var freq = CF.config.cf_token_timeout;
		freq = Math.max((freq || 30), 10) - 5; setTimeout(
				function() {
					that.silentUpdateUser(that.startPinger);
				},
				freq*60*1000
		);
	};
	CF.config.events.listen("config_beforeComplete", function (evt, cfg)
		{
			var tok = CF.cookie.readCookie("cf_token");
			if (tok)
			{
				if (!cfg.extraRestParams)
					cf.extraRestParams = {};
				cfg.extraRestParams.cf_token = tok;
			};
			that.setApi(CF.RestV1());
			sess.whenLoaded(that.load);
			that.startPinger();
		}
	);
	return that;
}();
