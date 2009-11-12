
/**
 * @class
 * A mixin class that allows for detection of which service providers are active (based off auth_user's alt ids).
 * @extends CF.widget.SimpleWidget
 */

CF.widget.SyndicationMixin = function (that)
{	
	that = that || {};
	var rpxUrl = CF.config.current.rpxUrl;
	that.syndProvs = {
					"facebook": {
						className: "cf_synd_icon_fb",
						provider:"facebook",
						rpxUrl:rpxUrl+"/facebook/start"
					},
					"twitter": {
						className: "cf_synd_icon_tw",
						provider:"twitter",
						rpxUrl:rpxUrl+"/twitter/start"
					},
					"myspace": {
						className: "cf_synd_icon_ms",
						provider:"myspace",
						rpxUrl:rpxUrl+"/myspace/start"
					},
					"yahoo": {
						className: "cf_synd_icon_yh",
						provider:"yahoo",
						rpxUrl:rpxUrl+"/openid/start?openid_identifier=yahoo.com"
					}					
				};
	that.getSyndProviders = function()
	{
		var ids = that.getAltIdsProviders();
		var sp = {};
		jQuery.extend(true, sp, that.syndProvs);
		if (sp)
			jQuery.each(ids, function (i, id){
				sp[id].active = true;
			});
		return sp;
	};
	that.getSyndProvidersAsList = function ()
	{
		return CF.vals(that.getSyndProviders());		
	};
		
	that.setupRpxUrls = function (provs, authCompleteFx)
	{
		jQuery.each(provs, function (i, prov)
		{
			if (!CF._syndCount)
				CF._syndCount = 0;
			var fxName= "_syndAuthComplete_"+CF._syndCount++;
		
			CF[fxName] = function (alt_id) {
				CF.context.silentUpdateUser(CF.curry(authCompleteFx, prov));
			};
			var c = CF.config.current;
			var toAdd= {};
			toAdd[c.loginTokenNameParam] = "token";
			toAdd[c.loginProviderParam] = prov.provider;
			toAdd["cf_window_close"] = fxName;
			var redirectUrl = CF.url.addParams(toAdd);
			prov.rpxUrl = CF.url.addParam("token_url",  CF.context.api_v1.loginreg_rpxforward_url(redirectUrl), prov.rpxUrl);
		});
		return provs;
	};
	that.getSyndProviderNames = function ()
	{
		return CF.keys(that.syndProvs);
	};
	that.getActiveSyndProviderNames = function ()
	{
		var provs = that.getActiveSyndProviders();
		return CF.collect(provs, function (i, p)
		{
			return p.provider;
		});
	};
	/** 
	 * returns all the provider names for the current user's alt_ids
	 */
	that.getAltIdsProviders = function ()
	{
		var u = CF.context.auth_user;
		if(!u || !u.alt_ids)
		{
			return [];
		}
		return CF.pluck(u.alt_ids, "provider");
	};
	that.findAltId = function (prov)
	{
		var u = CF.context.auth_user;
		if(u)
			return CF.arrayFind(u.alt_ids, function (i, a){return a.provider === prov;});
		return null;
	};
	
	that.getActiveSyndProviders = function ()
	{
		var provs = that.getSyndProvidersAsList();
		return CF.collect(provs, function (i, p){
			if (p.active === true)
				return p;
		});
	};
	that.canSyndicate = function ()
	{
		return that.getActiveSyndProviders().length > 0;
	};
	that.syndicate = function (providers, category, target, urls, value, completeFx)
	{
		completeFx = completeFx || function (){};
		if(!jQuery.isArray(providers))
			providers = [providers];
		var count = providers.length;
		var results = [];
		var errors = [];
		
		var wrapComplete = function (result, error){
			count--;
			if(error)
				errors.push(error);
			else
				results.push(result);
			if(count <= 0)
			{
				errors = errors.length == 0 ? null : errors;
				completeFx(results, errors);
			}
		};
		var params = {};
		if (value)
			params.value = value;
		jQuery.each(providers, function (i, prov){
			CF.context.api_v1.syndication_create(wrapComplete, 
						(prov.provider || prov),
						category,
						target,
						urls, params);
				});
	};
	return that;	
};