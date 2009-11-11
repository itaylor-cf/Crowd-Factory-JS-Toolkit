//= require <CF.widget.SimpleWidget.js>
//= require <CF.context.js>

/**
 * @class
 * The base rating class for all ratings widgets.  
 * @extends CF.widget.SimpleWidget
 *
 * @behavior {click} .cf_vote When clicked, a vote is registered for the entity with a value equal to the 'voteval' attribute of the
 * clicked element. The new rating's value will be rounded as per the roundTo option and will be within the options minVal and maxVal.
 * If the new rating is successfully created or updated, the rating_created event will be fired.
 * 
 * @description
 * The opts parameter has 5 properties that can be set.<br/>
 * minVal: the minimum value for the rating (default:0)<br/>
 * maxVal: the maximum value for a rating (default:0)<br/>
 * roundTo: the amount to round the results, eg .25 to round to nearest quarter or 10 to round to the nearest product of 10 (default:1)<br/>
 * canRate: If set false, the rating widget will display only and not allow more votes.<br/>
 * category: The ratingType category to rate with.  
 * syndicate: If set true, users will be prompted to syndicate their ratings out to external social networks.
 * syndicationUrl: the URL to set to the syndication event to.  Default is current page url.
 * syndicationCategory: the category name of the syndication event.  Default of "rating"
 *  
 */

CF.widget.BaseRating = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		minVal: 0,
		maxVal: 1,
		roundTo: 1,
		canRate:true,
		category:"ThumbsUp",
		syndicate:false,
		syndiationUrl:location.href,
		syndicationCategory:null,
		hovertime:5000
	};
	opts = CF.extend(defaultOpts, opts);	
	
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine);
	CF.widget.SyndicationMixin(that);
	
	that.avgVal = opts.minVal;
	that.selectedVal = opts.minVal;
	
	that.getDefaultTemplateBody = function ()
	{
		return "\
<span class='cf_rating'> \
	<span class='cf_choice' binding='rating.user_rating'>\
		<span class='cf_condition' lt='0' eq='0'>\
			<span class='cf_thumbs_up cf_vote cf_deselected' voteval='1'></span>\
			<span class='cf_thumbs_down cf_vote cf_selected' voteval='0'></span>\
		</span>\
		<span class='cf_condition' gt='1' eq='1'>\
			<span class='cf_thumbs_up cf_vote cf_selected' voteval='1'></span>\
			<span class='cf_thumbs_down cf_vote cf_deselected' voteval='0'></span>\
		</span>\
		<span class='cf_otherwise'>\
			<span class='cf_thumbs_up cf_vote' voteval='1'></span>\
			<span class='cf_thumbs_down cf_vote' voteval='0'></span>\
		</span>\
	</span>\
	<span class='cf_average'>\
		Average: [% rating.average_rating * 100 %]% Votes: [% rating.count %]\
	</span>\
	<div class='cf_rating_hoverbox' style='display:none'>\
		<h4>Your rating has been counted</h4>\
		<a class='cf_rating_synd_btn'>Publish to: </a>\
		<span class='cf_widgetLoader cf_syndication_icons' widgetType='CF.widget.SyndicationIcons' options='{addable:true}'>  </span>\
	</div>\
</span>\
		";
	};
	
	that.bindEvents = function (elem, subWidgets)
	{
		if(CF.context.auth_user && opts.canRate)
		{
			elem.find(".cf_vote").click(that.vote);
			that.hoverbox = elem.find(".cf_rating_hoverbox");
			that.hoverboxObj = CF.effect.Hover(that.hoverbox, null, that.hideHoverBox, 5);
			that.syndBtn = elem.find(".cf_rating_synd_btn").click(that.publish);
			//Suspend the hover timer while waiting for an addition of a new provider.  
			jQuery.each(that.subWidgets.find("CF.widget.SyndicationIcons"), 
				function (i, o){
					o.widget.events.listen("syndprov_add_started",  function (){that.hoverboxObj.stop();});
			        o.widget.events.listen("syndprov_add_finished", function (){that.hoverbox.fadeIn(); that.hoverboxObj.restart();});  
			  });
		}
	};
	
	that.round = function (num, roundTo)
	{
		var rem, ramt, ret;
		rem = num % roundTo;
		ramt = roundTo / 2;
		if (rem >= ramt)
			ret = (num - rem) + roundTo;
		else 
			ret = num - rem;
		
		return Math.max(opts.minVal, Math.min(opts.maxVal, ret));
	};
	that.vote = function ()
	{
		var voteVal = jQuery(this).attr("voteval");
		if (voteVal)
		{
			that.newRating = that.round(new Number(voteVal), opts.roundTo);
			that.sendRating(that.newRating);	
		}		
	};
	
	that.sendRating = function (val)
	{
		//Call that.ratingCreated when complete.
		//EG: CF.context.api_v1.rating_entity_create(that.ratingCreated, that.entity.uid, opts.category, val);
		CF.error("sendRating must be overridden in child classes of CF.widget.BaseRating");
	};

	that.hideHoverBox = function(){
		that.hoverbox.fadeOut(that.reload);
	};
	that.showHoverBox = function ()
	{
		that.hoverbox.fadeIn(function (){that.hoverboxObj.startGracePeriod();});
	};
	that.publish = function ()
	{
		CF.error("publish must be overridden in child classes of CF.widget.BaseRating");
		//var providers = that.getActiveSyndProviders();
		//that.syndicate(providers, opts.syndicationCategory, entityId, opts.syndicationUrl,that.syndComplete)
	};
	that.syndComplete = function (result, error)
	{
		
	};
	
	/**
	 * @name CF.widget.BaseRating#rating_created
	 * @event
	 * @description
	 * The rating_created event is fired when a rating has been succesfully created.
	 * @parameter {Object} The entity object that was rated. 
	 * @parameter {CF.widget.BaseRating} The current widget object.
	 */
	that.ratingCreated = function (result, error)
	{
		if (!error)
		{
			that.events.fire("rating_created", that.entity, that);
			if (opts.syndicate)
				that.showHoverBox();
			else
				that.reload();
		}
	};
	return that;
};
