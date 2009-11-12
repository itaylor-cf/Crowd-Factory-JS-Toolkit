//= require <CF.js>
/**
 * 
 * @static
 * @class
 * Helper functions that provide support for some basic URL operations.
 * 
 */
CF.url = function ()
{
	var that = {};
	/** Fetches parmeters off of an url
	 * @param paramName If null or undefined, all parameters will be returned as an object.  If specified as 
	 * a string, returns the value of that parameter.
	 * @param url If null or undefined, the current location.href is used.  If set, uses the specified url as
	 * the source of the parameters.
	 */
	that.params = function (paramName, url)
	{
		if (!url)
		{
			url = location.href;
		}
		var queryParams = url.split("?");
	    if (queryParams.length > 1)
		{
	    	var paramsObj = that.fromQueryString(queryParams[1]);
	    	if(paramsObj && paramName)
	    		return paramsObj[paramName];
	    	return paramsObj;
	    }
	    if (paramName)
	    	return null;
		return {};
	};

	/**
	 * Builds an url by passing an array of path parts and an object containing the
	 * queryString parts as key/value pairs.
	 */
	that.build =  function (pathArr, qsObj)
	{
		var ps = "";
		
		var pathAdd = function (i, p){
		  p = p.toString();
			ps += p;
			if (!p.lastIndexOf("/") == p.length -1 && i < pathArr.length -1)
			{
				ps +="/";
			}
		};
		if(pathArr)
		{
			jQuery.each(pathArr, pathAdd);
		}
		return that.addParams(qsObj || {}, ps);
	};
	
	/***
	 * Adds a single key value pair to a url making certain to use the correct query parameter separation and encoding.
	 */
	that.addParam = function (k, v, url)
	{
		var o = {};
		o[k]=v;
		return that.addParams(o, url);
	};
	
	that.addParams = function(params, url)
	{
		url = url || location.href;
		var h = that.getHash(url, true);
		var parts = url.split("#");
		url = parts[0];
		var qs = that.toQueryString(params);
		url = that._stripXtra(url);
		var i = url.indexOf("?");
		if(i == -1)
			url+= "?";			
		else
			qs = "&"+qs;
		return url + qs + h;
	};
	
	/**
	 * Gets the hash part of the url or empty string if none exists.
	 */
	that.getHash = function (url, inc)
	{
		url = url || location.href;
		var parts = url.split("#");
		if (parts.length > 1)
		{
			return inc ? "#" + parts[1] : parts[1];
		}
		return "";
	};

	that.removeHash = function (url)
	{	
		url = url || location.href;
		return url.split("#")[0];
	};
	
	/**
	 * Removes one or more parameters from an url and returns the url.
	 */
	that.removeParam = function (names, url)
	{
		url = url || location.href;
		var front= url.split("?")[0];
		var params = that.params(null, url);
		names = jQuery.isArray(names) ? names : [names];
		jQuery.each(names, function (i, name){
			delete params[name];			
		});
		var res = that.addParams(params, front + that.getHash(url, true));
		return that._stripXtra(res);
	};  

	that._stripXtra = function (url)
	{
		if(!url)
			return url;
		var lst = url.charAt(url.length -1);
		if ( lst == "?" || lst == "&")
			url = url.substr(0, url.length - 1);
		return url;
	};
	
	/**
	 * Turns a queryString into a object of key/value pairs.
	 * If a key is specified more than once, the resulting value will be an array
	 * containing all values for that key.
	 */
	that.fromQueryString = function (str)
	{
		var obj = {};
		jQuery.each(str.split("&"), function (i, pair){
			var parts = pair.split("=");
			var key = parts[0];
			if(parts.length == 2)
			{
				var val = that.decUri(parts[1]);
				var oldVal = obj[key]; 
				if(oldVal)
			    {
			    	if(!jQuery.isArray(oldVal))
			    	{		    		
			    		obj[key] = [oldVal];
			    	}
			    	obj[key].push(val);
			    }
			    else
			    {
			    	obj[key] = val;
			    }
			}
		});
		return obj;
	};
	/**
	 * A version of decodeURIComponent that decodes + as space (as per the RFC).
	 * 
	 */
	that.decUri = function (str)
	{
		return decodeURIComponent(str).replace(/\+/g, " ");
	};
	
	that.friendly = function (str)
	{
		return str.toLowerCase() // change everything to lowercase
				.replace(/[_|\s]+/g, "-") // change all spaces and underscores to a hyphen
				.replace(/[^a-z0-9-]+/g, "") // remove all non-alphanumeric characters except the hyphen
				.replace(/[-]+/g, "-"); // replace multiple instances of the hyphen with a single instance
	};
	
	/**
	 * Turns an object of key value pairs into a string.
	 * If a value is an array it will be turned into multiple
	 * of the same key with different values.
	 */
	that.toQueryString= function (obj)
	{
		var parts = [];
		var keys = CF.keys(obj);
		/**
		 * @ignore
		 */
		var addFx = function (key, val)
		{
			parts.push(key + "=" + encodeURIComponent(val));
		};
		
		jQuery.each(keys, function (i, key)
		{
			var val = obj[key];
		
			if (jQuery.isArray(val))
				jQuery.each(val, function (i, v){addFx(key, v);});
			else
				addFx(key, val);
		});
	    return parts.join("&");	
	};
	return that;
}();
