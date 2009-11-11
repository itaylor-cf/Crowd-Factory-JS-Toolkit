//= require <CF.url.js>
/**
* @class
* A class used in included iframes to allow for communication of upload related events.
* 
* @param targetElem {Element} The form element that will be used as the upload form
* 
*/
CF.iframe.IframeUploadComm = function (targetElem)
{
	var that = {};
	var urlParams = CF.url.params();
	var eventPub;
	if (window.parent && window.parent.CF && window.parent.CF.iframe)
	{
		eventPub = window.parent.CF.iframe.events;
	}
	if (!eventPub)
	{
		CF.error("This iframe requires that it is loaded within a page on the same host, and that iframe communication can be established.");		
	}
	var iframeId = urlParams.iframeId; 
	if(!iframeId)
	{
		CF.error("No iframeId parameter was passed to the iframe_target.html page");
		return;
	};
	
	that.run = function(params, uploadElem, uploadUrl)
	{
		targetElem.empty();
		that.setRequestParams(targetElem,params);
		that.setUploadUrl(uploadUrl);
		//that.addStyles(styles);
		//IE doesn't want to append these dom elements that are passed from another window
		//Using html seems to work though
		targetElem.append(uploadElem.html());
		//targetElem.html(targetElem.html() +  uploadElem.html());
	};
	/**
	 * Updates the hidden inputs with new values.
	 */
	that.updateParams = function (params)
	{
		jQuery.each(CF.keys(params), function (i, k)
			{
				targetElem.find("input[name="+k+"]").val(params[k]);				
			});
	};
	that.setRequestParams = function (targetElem, params)
	{
		if (!params.redirect)
			params.redirect = that.getRedirLoc();
		var arr = [];
		jQuery.each(CF.keys(params), function (i, k){
			arr.push(CF.build("input", {type:"hidden", name:k, value:params[k]}));
		});
		
		targetElem.append(CF.build(".hiddenParams", arr));						
	};
//	that.addStyles = function (styles)
//	{
//		if (styles && styles.length > 0)
//		{
//			styles.each(function (i, s){
//				jQuery("head").append(jQuery(s).clone());
//			});
//		}
//	};
	that.getRedirLoc = function ()
	{
		var loc = location.href;
		loc = loc.split("?")[0];
		return CF.url.addParam("iframeId", iframeId, loc);			
	};
	that.setUploadUrl = function (url)
	{
		targetElem.attr("action", url);
	};		
	that.uploadSuccess = function ()
	{
		eventPub.fire(iframeId + "_success", that, urlParams.uid, urlParams.url);
	};
	that.uploadFail = function ()
	{
		eventPub.fire(iframeId + "_fail", that, urlParams.error_str, urlParams.error_code);
	};
	that.onSubmit = function (evt)
	{
		var results = eventPub.fire(iframeId + "_uploadStart", that);
		var ok= true;
		jQuery.each(results, function (i, r)
		{
			if (r === false)
				ok = false;
		});
		return ok;
	};
	that.iframeReady = function()
	{
		eventPub.fire(iframeId + "_ready", that);
	};	
	if (urlParams.error_code && urlParams.error_code != "0")
	{
		that.uploadFail();
	}
	else if (urlParams.uid && urlParams.url)
	{
		that.uploadSuccess();
	}
	else	
	{
		that.iframeReady();
	}
	targetElem.submit(that.onSubmit);
};