//= require <CF.cookie.js>
/**
 * Global config location for all login, context, session
 */

CF.config = function (){

    var that = {};
    that.events = CF.EventPublisher();

	that.defaults = {
		b2cHost : location.protocol + "//" + location.host,
		b2cPath : "/rest/",
		rpxUrl:"https://cf-poc.rpxnow.com",
		cfKeys : {
			subscriber:"default", 
			product : "default-product",
			topcommunity : 1
		},
		use_cf_token : true,
		cf_token_timeout: null,//number of minutes 1 to 1440 
		loginReload : true,
		logoutReload : true,
		sessionCookieName:"CF_JSESSIONID",
		loginProviderParam : "cf_provider",
		loginTokenNameParam : "cf_token_name",
		xd_path : "/xd/"+CF.version+"/xd_host.html",
		xdr_loc : location.protocol + "//" + location.host + "/xd/"+CF.version+"/xd_host.html",
		use_xdr : false,
		extraRestParams : {}
		};

    that.set = function (conf)
	{
		that.current = CF.extend(that.defaults, conf || {});
		return that;
	};
	that.complete = function ()
	{
		that.events.fire("config_beforeComplete", that.current);
		that.events.fire("config_complete", that.current);
		that.events.fire("config_afterComplete", that.current);
		return that;
	};
    return that;
}();