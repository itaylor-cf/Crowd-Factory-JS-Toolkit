//= require <CF.widget.SimpleWidget.js>

/**
 * @class
 * A widget for displaying the RPX login iframe and triggering the 
 * CF.login.remoteAuthVerify code flow.
 * 
 * @extends CF.widget.SimpleWidget
 */

CF.widget.RPXLogin = function (targetElem, template, templateEngine, data, opts)
{
	if (!CF.config.current.rpxUrl)
	{
		CF.error("You must have the rpxUrl configuration option set.");
		return;
	}
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.onReload = function ()
    {
    	that.draw();
	};
	that.onStart = function ()
	{
		that.draw();
	};
	that.getDefaultTemplateBody = function ()
	{
		return "<iframe	src='[% iframeUrl %]' scrolling='no' frameBorder='no' style='width: 400px; height: 240px;'></iframe>";
	};
	that.getData = function ()
	{
		var c = CF.config.current;
		var l = CF.login;
		var toAdd = {};
		toAdd[c.loginTokenNameParam] = "token";
		toAdd[c.loginProviderParam] = "rpx";
		
		var redirectUrl = location.href;
		//Current page url. Where we will eventually end up.  Strip off any tokens that were there 
		//and not cleaned up.
		redirectUrl = CF.url.removeParam([c.loginProviderParam, c.loginTokenNameParam, "token"], redirectUrl);
		//Add in the token provider and param name parameters.
		redirectUrl = CF.url.addParams(toAdd, redirectUrl);
		//Strip out any url fragments that might be in it.
		redirectUrl = CF.url.removeHash(redirectUrl);
	
		//Get the token url 
		var tokenUrl = CF.context.api_v1.loginreg_rpxforward_url(redirectUrl);
		
		//Add the token URL as a parameter to the rpx Login url that was passed in.
		var rpxEmbed = CF.url.build([c.rpxUrl, "/openid/embed"]);
		return {iframeUrl: CF.url.addParam("token_url", tokenUrl, rpxEmbed)};
	};
	return that;	
};