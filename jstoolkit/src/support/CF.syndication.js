CF.syndication = function ()
{
	var that = {};
	/**
	 * Sets up the syndication user action tracking.
	 * We read in the syndication id that comes in on a shortened url, set it as a cookie, and then force it to 
	 * be passed on each rest request for the rest of the session.
	 */
	that.setupSyndId = function ()
	{
		var a = "cf_synd_id";
		var params = CF.url.params();
		var syndId = params[a]; 
		if(syndId)
			//Create session cookie
			CF.cookie.createCookie(a, syndId);
		else
			syndId = CF.cookie.readCookie(a);
		
		if(syndId)
			//Add the syndication id as a parameter on all further API requests.
			CF.config.current.extraRestParams[a] = syndId;  
	};
	
	CF.config.events.listen("config_complete", that.setupSyndId);
}();