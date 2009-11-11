//= require <CF.widget.EntityRating.js>
//= require <CF.widget.SyndicationMixin.js>

/**
 * @class
 * A Widget for rendering a set of syndication icons that are applicable to the current user.
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.SyndicationMixin
 */

CF.widget.SyndicationIcons = function (targetElem, template, templateEngine, data, opts)
{
	opts = CF.extend({addable:false}, opts);
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.SyndicationMixin(that);
	that.checkedToggles = {};
	that.onStart = function ()
	{
		that.draw();
	};
	that.getDefaultTemplateBody = function ()
	{
		return "\
				<div class='cf_if' binding='user'>\
					<div class='cf_if' binding='opts.addable'>\
						<div class='cf_for' rendertag='false' binding='providers'>\
							<div class='cf_item cf_syndication_icon'>\
								<div class='cf_if' binding='item.active'>\
									<input type='checkbox' id='[%item.provider%]_icon' class='cf_synd_icon_cbx' prov='[% item.provider %]'>\
									<label class='[% item.className %]' for='[%item.provider%]_icon_[%idOffset+1%]' ></label>\
									<div class='cf_else'>\
										<input type='checkbox' id='[%item.provider%]_icon' class='cf_synd_icon_cbx' cf_disabled='disabled'>\
										<label class='[%item.className%] [%item.className%]_inactive' for='[%item.provider%]_icon_[%idOffset+1%]' >\
										</label>\
										<a class='cf_prov_add_link' target='_blank' cf_href='[%item.rpxUrl%]'>Add</a>\
									</div>\
								</div>\
							</div>\
						</div>\
						<div class='cf_else'>\
							<div class='cf_for' rendertag='false' binding='providers'>\
								<div class='cf_item cf_syndication_icon'>\
									<div cf_class='[%item.className%]'></div>\
								</div>\
							</div>\
						</div>\
					</div>\
				</div>";
	};
	that.getData = function ()
	{
		var providers;
		if (opts.addable)
			providers = that.setupRpxUrls(that.getSyndProvidersAsList(),that.provAdded);
		else
			providers = that.getActiveSyndProviders();
		return {opts:opts, user:CF.context.auth_user, providers:providers, checkedToggles:that.checkedToggles};
	};
	that.toggleIcon = function ()
	{
		var v = jQuery(this).attr("prov");
		if (this.checked)
			that.checkedToggles[v] = true;
		else
			delete that.checkedToggles[v];	
	};
	that.uncheckAll = function ()
	{
		that.checkedToggles = {};
		that.reload();
	};
	that.addProvClicked = function ()
	{
		that.startIEEvtQueue();
		that.events.fire("syndprov_add_started");
	};
	that.startIEEvtQueue = function ()
	{
		//IE needs this crazy event queuing crap to deal with the fact 
		//that a function call made from one window to another messes up the 
		//window.postMessage transport as it future postMessage requests are made from the 
		//caller window instead of the callee.
		if (CF.isIE() && !CF._evtQueue)
		{
			CF._evtQueue = [];
			var poll = function (){
				if (CF._evtQueue && CF._evtQueue.length > 0)
				{
					var fx = CF[CF._evtQueue.pop()];
					if (fx)
						fx.call(null);
				}
			};
			setInterval(poll, 1000);
		}
	};
	that.provAdded = function (prov)
	{
		that.checkedToggles[prov.provider] = true;
		that.events.fire("syndprov_add_finished", prov);
		that.reload();
	};
	that.setChecked = function ()
	{
		var v = jQuery(this).attr("prov");
		if(that.checkedToggles[v])
			this.checked = true;
		else
			this.checked = false;
	};
	that.bindEvents = function (elem, subWidgets)
	{
		if(opts.addable)
		{
			that.toggles = elem.find(".cf_synd_icon_cbx");
			that.toggles.each(that.setChecked);
			that.toggles.change(that.toggleIcon);
			that.adders = elem.find(".cf_prov_add_link").click(that.addProvClicked);
		}
	};
	return that;	
};