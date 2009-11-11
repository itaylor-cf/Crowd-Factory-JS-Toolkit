//= require <CF.widget.EntityRating.js>
//= require <CF.widget.SyndicationMixin.js>

/**
 * @class
 * A Widget that allows you to add and remove syndication capabilities for all of the configured service providers.
 * @extends CF.widget.SyndicationIcons
 */

CF.widget.SyndicationManager = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.addable = true;
	var that = CF.widget.SyndicationIcons(targetElem, template, templateEngine, data, opts);
	that.getDefaultTemplateBody = function ()
	{
		return "\
				<div class='cf_if' binding='user'>\
					<div class='cf_for cf_syndication_manager' binding='providers'>\
						<div class='cf_item cf_syndication_icon'>\
							<div class='cf_if' binding='item.active'>\
								<label class='[% item.className %]' for='[%item.provider%]_icon_[%idOffset+1%]' >\
								</label>\
								<a class='cf_prov_rem_link' prov='[%item.provider%]'>Remove</a>\
								<div class='cf_else'>\
									<label class='[%item.className%] [%item.className%]_inactive' for='[%item.provider%]_icon_[%idOffset+1%]' >\
									</label>\
									<a class='cf_prov_add_link' target='cf' cf_href='[%item.rpxUrl%]'>Add</a>\
								</div>\
							</div>\
						</div>\
					</div>\
				</div>";
	};
	that.provRemoved = function (prov, altId, res, error)
	{
		CF.context.silentUpdateUser(that.reload);
	};
	that.removeProv = function (evt)
	{
		var elem = jQuery(this);
		elem.html("");
		var prov = elem.attr("prov");
		var altId = that.findAltId(prov);
		var ctx =CF.context;
		if (altId)
		{
			var fx = CF.curry(that.provRemoved, prov, altId.id);
			ctx.api_v1.alt_id_user_remove(fx, ctx.auth_user.external_id, prov, altId.id);
		}
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subWidgets)
	{
		that.superBindEvents(elem, subWidgets);
		that.removers = elem.find(".cf_prov_rem_link").click(that.removeProv);
	};
	return that;	
};