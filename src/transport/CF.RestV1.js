//= require <CF.ajax.js>

/**
 * 
 * @class
 * <p>
* The CF rest API class, Create an instance of this class to call the Crowd Factory JSON rest API.
* Into the opts parameter, place any information that you want to be passed as a parameter on every request.
* Good candidates are the subscriber, product, and topcommunity parameters that are required by most requests, and pretty which returns nicely
* Formatted json (good for debugging).
*</p>
* <p>
* The class exposes one low level api for making REST calls, the .restCall method, along with helper methods for many of the API functions.
* </p>
* 
* <p>
* The helper functions all require a completeFx parameter, which is a function to call when the result is returned.  
* All of the helper methods call wrapHandleErrors, to
* wrap your completeFx function in a closure that cleans up some of the REST error handling.  These wrapped functions will call
* your completeFx and pass it two parameters, the desired data and the error code.  The error code will test to false if the call 
* was a success.  See the usage example below to see how to handle errors.
* Each helper method presents its minimally required fields as arguments, and allows the addition of non-required parameters with the last argument,
* params.  Params are passed as a javascript object, they are never required and 
* can safely be omitted if additional parameters are not needed.
* </p>
* 
* <p>
* <em>Note</em>: to date, there are not helper methods for many of the Crowd Factory API calls.  More helper methods will be added over time.
* </p>
* 
* @example
Usage:
var myRest = CF.RestV1("http://www.mydomain.com", "rest", {product:myproduct, subscriber:mysubscriber, topcommunity:mytopcommunity, pretty:1});

var myUserGetCompleteFx = function (user, error)
{
	if(!error)
	{
		//your logic here
		alert(user.display_name);
	}
	else
	{
		//your error handling here.
		alert("Error code: "+ error.error_code);
	}
}

myRest.user_get(myUserGetCompleteFx, "someusername");


* 
*
*/

CF.RestV1 =  function ()
{
	var that = {};
	if (!CF.config.current)
		CF.error("CF.config.set must be called before creating a CF.RestV1 instance");

	that.events = CF.EventPublisher();
	var cfg = CF.config.current;
	CF.ajax.xd_setup(cfg.b2cHost, cfg.b2cPath, cfg.xd_path, cfg.use_xdr, cfg.xdr_loc);

	/**
	 * @cf_nonAutoDoc
	 */
	that.restCall = function (url, completeFx, params)
	{
		/**
		 * @cf_nonAutoDoc
		 */
		var doneFx = function (data)
		{
			completeFx(data);
			that.events.fire("request_completed", url, data);
		};
		params = that.safeParams(params);
		var c = CF.config.current;
		CF.extend(params, c.cfKeys); //copy in configured keys
		CF.extend(params, c.extraRestParams); //copy in extra parameters
		CF.clean(params, [undefined, null]); //Kill null/undefined parameters
		that.events.fire("request_started", url, params);
		CF.ajax.request(c.b2cHost + c.b2cPath + url, params, doneFx);		
	};
	/**
	 * @cf_nonAutoDoc
	 */
	that.wrapHandleErrors = function (completeFx, target)
	{
		/**
		 * @cf_nonAutoDoc
		 */
		var fx=  function (data)
		{
			if (data.error_code != 0)
			{
				completeFx(null, data);
			}
			else
			{
				if (target)
				{
					data = data[target];
				}
				completeFx(data, false);
			}
		};
		return fx;
	};
	
	/**
	 * @cf_nonAutoDoc
	 */
	that.safeParams = function (params)
	{
		return (params || {});
	};
	/**
	 * @cf_nonAutoDoc
	 * @see <a href='http://docs.crowdfactory.com/version/5/current/rest/v1_auth_login.html'>auth/login API Documentation</a>"
	 */
	that.login = function (completeFx, username, password, params)
	{
		params = that.safeParams(params);
		params.j_username = username;
		params.j_password = password;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("auth/login", completeFx, params);
	};
	/**
	 * @cf_nonAutoDoc
	 * @see <a href='http://docs.crowdfactory.com/version/5/current/rest/v1_auth_logout.html'>auth/logout API Documentation</a>
	 */
	that.logout = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("auth/logout", completeFx, params);
	};
	that.user_get = function (completeFx, user, params)
	{
		params = that.safeParams(params);
		if(user)
		{
			params.user = user;
		}
		completeFx = that.wrapHandleErrors(completeFx, "user");
		that.restCall("v1/user/get", completeFx, params);
	};
	that.entity_get = function (completeFx, entity, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		completeFx = that.wrapHandleErrors(completeFx, "ExternalEntity");
		that.restCall("v1/entity/get", completeFx, params);
	};
	that.entity_create = function (completeFx, params)
	{
		params= that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "ExternalEntity");
		that.restCall("v1/entity/create", completeFx, params);
	};
	that.entity_browse = function (completeFx, params)
	{
		params= that.safeParams(params);
		completeFx= that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/entity/browse", completeFx, params);
	};
	that.rating_entity_create = function (completeFx, entity, rating, value, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		params.rating = rating;
		params.value = value;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/rating/entity/create", completeFx, params);
	};
	that.comment_entity_create = function (completeFx, entity, body, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		params.body = body;
		if(!params.subject)
		{
			params.subject = "";
		}
		completeFx = that.wrapHandleErrors(completeFx, "comment");
		that.restCall("v1/comment/entity/create", completeFx, params);
	};
	
	that.comment_entity_get = function (completeFx, entity, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		completeFx = that.wrapHandleErrors(completeFx, "comments");
		that.restCall("v1/comment/entity/get", completeFx, params);
	};
	that.comment_user_create = function (completeFx, user, body, params)
	{
		params = that.safeParams(params);
		params.user = user;
		params.body = body;
		if(!params.subject)
		{
			params.subject = "";
		}
		completeFx = that.wrapHandleErrors(completeFx, "comment");
		that.restCall("v1/comment/user/create", completeFx, params);
	};
	that.rating_user_create = function (completeFx, user, rating, value, params)
	{
		params = that.safeParams(params);
		params.user = user;
		params.rating = rating;
		params.value = value;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/rating/user/create", completeFx, params);
	};	
	that.comment_user_get = function (completeFx, user, params)
	{
		params = that.safeParams(params);
		params.user = user;
		completeFx = that.wrapHandleErrors(completeFx, "comments");
		that.restCall("v1/comment/user/get", completeFx, params);
	};
	that.comment_board_create = function (completeFx, board, body, params)
	{
		params = that.safeParams(params);
		params.board = board;
		params.body = body;
		if(!params.subject)
		{
			params.subject = "";
		}
		completeFx = that.wrapHandleErrors(completeFx, "comment");
		that.restCall("v1/comment/board/create", completeFx, params);
	};
	that.comment_board_get = function (completeFx, board, params)
	{
		params = that.safeParams(params);
		params.board = board;
		completeFx = that.wrapHandleErrors(completeFx, "comments");
		that.restCall("v1/comment/board/get", completeFx, params);
	};
	that.query_entity_most_rated = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/most_rated", completeFx, params);
	};
	that.query_entity_top_rated = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/top_rated", completeFx, params);
	};
	that.query_entity_most_commented = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/most_commented", completeFx, params);
	};
	that.query_entity_recently_commented = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/recently_commented", completeFx, params);
	};
	that.query_entity_highest_rated = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/highest_rated", completeFx, params);
	};
	that.query_entity_number_lists = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "entities");
		that.restCall("v1/query/entity/number_lists", completeFx, params);
	};
	that.query_user_most_active = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "users");
		that.restCall("v1/query/user/most_active", completeFx, params);
	};
	that.list_get = function (completeFx, category, name, params)
	{
		params = that.safeParams(params);
		params.category = category;
		params.name = name;
		completeFx = that.wrapHandleErrors(completeFx, "userlist");
		that.restCall("v1/list/get", completeFx, params);
	};	
	that.list_entity_add = function (completeFx, entity, category, name, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		params.category = category;
		params.name = name;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/list/entity/add", completeFx, params);
	};
	that.list_entity_remove = function (completeFx, entity, category, name, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		params.category = category;
		params.name = name;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/list/entity/remove", completeFx, params);
	};
	that.list_entity_exists = function (completeFx, entity, category, name, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		params.category = category;
		params.name = name;
		completeFx = that.wrapHandleErrors(completeFx, "exists");
		that.restCall("v1/list/entity/exists", completeFx, params);
	};
	that.list_create = function (completeFx, category, name, params)
	{
		params = that.safeParams(params);
		params.category = category;
		params.name = name;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/list/create", completeFx, params);
	};
	that.activityevent_create = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "ActivityEvent");
		that.restCall("v1/activityevent/create", completeFx, params);
	};
	that.activityevent_get = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "activityevents");
		that.restCall("v1/activityevent/get", completeFx, params);
	};
	that.attribute_user_get = function (completeFx, user, params)
	{
		params = that.safeParams(params);
		params.user = user;
		completeFx = that.wrapHandleErrors(completeFx, "attributes");
		that.restCall("v1/attribute/user/get", completeFx, params);
	};
	that.connection_exists = function (completeFx, to_user, category, params )
	{
		params = that.safeParams(params);
		params.to_user = to_user;
		params.category = category;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/connection/exists", completeFx, params);
	};
	that.connection_create = function (completeFx, to_user, category, params)
	{
		params = that.safeParams(params);
		params.to_user = to_user;
		params.category = category;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/connection/create", completeFx, params);
	};
	that.flag_activityevent = function (completeFx, activityevent, params)
	{
		params = that.safeParams(params);
		params.activityevent = activityevent;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/flag/activityevent", completeFx, params);
	};
	that.flag_board = function (completeFx, board, params)
	{
		params = that.safeParams(params);
		params.board = board;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/flag/board", completeFx, params);
	};
	that.flag_comment = function (completeFx, comment, params)
	{
		params = that.safeParams(params);
		params.comment = comment;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/flag/comment", completeFx, params);
	};
	that.flag_entity = function (completeFx, entity, params)
	{
		params = that.safeParams(params);
		params.entity = entity;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/flag/entity", completeFx, params);
	};
	that.flag_user = function (completeFx, user, params)
	{
		params = that.safeParams(params);
		params.user = user;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/flag/user", completeFx, params);
	};
	that.loginreg_auth = function (completeFx, token, provider, params)
	{
		params = that.safeParams(params);
		params.token = token;
		params.provider = provider;
		params.use_cf_token = CF.config.current.use_cf_token;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/loginreg/auth", completeFx, params);
	};
	that.loginreg_register = function (completeFx,params)
	{
		params = that.safeParams(params);
		params.use_cf_token = CF.config.current.use_cf_token;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/loginreg/register", completeFx, params);
	};
	/**
	 * @cf_nonAutoDoc
	 * Returns the url to use for the RPX forward instance.  This is passed to RPX as
	 * token_url
	 */
	that.loginreg_rpxforward_url = function(redirect)
	{
		var c = CF.config.current;
		var params = CF.extend({redirect:redirect}, c.cfKeys);		
		return CF.url.build([c.b2cHost, c.b2cPath, "v1/loginreg/rpxforward"], params);
	};
	that.entity_comment_count = function (completeFx, params)
	{
		params = that.safeParams(params);
		completeFx = that.wrapHandleErrors(completeFx, "comment_count");
		that.restCall("v1/entity/comment/count", completeFx, params);	
	};
	that.syndication_create = function (completeFx, provider, category, target, url, params)
	{
		params = that.safeParams(params);
		params.provider = provider;
		params.category = category;
		params.target = target;
		var c = CF.config.current;
		var stripParams = [c.loginTokenNameParam, c.loginProviderParam, "cf_synd_id"];
		var tokenName = CF.url.params(c.loginTokenNameParam, url);
		if(tokenName)
			stripParams.push(tokenName);
		params.url = CF.url.removeParam(stripParams, url);
		completeFx = that.wrapHandleErrors(completeFx, "syndication");
		that.restCall("v1/syndication/create", completeFx, params);
	};
	that.alt_id_user_add = function (completeFx, user, provider, id, params)
	{
		params = that.safeParams(params);
		params.user = user;
		params.provider = provider;
		params.id = id;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/alt_id/user/add", completeFx, params);
	};
	that.alt_id_user_remove = function (completeFx, user, provider, id, params)
	{
		params = that.safeParams(params);
		params.user = user;
		params.provider = provider;
		params.id = id;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/alt_id/user/remove", completeFx, params);
	};
	that.external_profile_get = function (completeFx, provider, params)
	{
		params = that.safeParams(params);
		params.provider = provider;
		completeFx = that.wrapHandleErrors(completeFx, "external_profile");
		that.restCall("v1/external_profile/get", completeFx, params);
	};
	that.auth_token_create = function (completeFx, user, password, params)
	{
		params = that.safeParams(params);
		params.user = user;
		params.password = password;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/auth_token/create", completeFx, params);		
	};
	that.auth_token_delete = function (completeFx, cf_token, params)
	{
		params = that.safeParams(params);
		params.cf_token = cf_token;
		completeFx = that.wrapHandleErrors(completeFx);
		that.restCall("v1/auth_token/delete", completeFx, params);
	};
	return that;
};

