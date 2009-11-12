
/**
 * @Class
 * A mixin class that adds star rating capabilities to another class instance.
 */
CF.widget.StarRatingMixin = function (that, targetElem, template, templateEngine, data, opts)
{
	that.scaleFactor = (opts.width / (opts.maxVal - opts.minVal));
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subWidgets)
	{
		that.superBindEvents(elem, subWidgets);
		that.avgElem = elem.find(".cf_rating_avg");
		that.selectedElem = elem.find(".cf_rating_selected");
		that.maskElem = elem.find(".cf_rating_mask");
		elem.find(".cf_opacity").css("opacity", opts.opacity);
		that.computeWidths();
		if (CF.context.auth_user && opts.canRate)
		{
			that.containerElem = elem.find(".cf_hover_select_rating").mousemove(that.selectionMoved).click(that.selectionClicked).mouseout(that.mouseout);	
		}
	};
	that.getDefaultTemplateBody = function()
	{
		return " \
		<span class='cf_rating'> \
			<div class='cf_hover_select_rating'>\
				<div class='cf_rating_avg'></div>\
				<div class='cf_rating_selected cf_opacity'></div>\
				<div class='cf_rating_mask'></div>\
			</div>\
			<span class='cf_average'>\
				Average:[% rating.average_rating %]/[% opts.maxVal %] Votes: [% rating.count %]\
			</span>\
			<div class='cf_rating_hoverbox' style='display:none'>\
			<h4>Your rating has been counted</h4>\
				<a class='cf_rating_synd_btn'>Publish to: </a>\
				<span class='cf_widgetLoader cf_syndication_icons' widgetType='CF.widget.SyndicationIcons' options='{addable:true}'></span>\
			</div>\
		</span>\
		";	
	};		
	that.mouseout = function (e)
	{
		that.setRatings(that.avgVal, that.selectedVal);
	};
	that.selectionMoved = function (e)
	{
		if (opts.canRate)
		{
			var offset = targetElem.offset();
			var mouseX = e.pageX - offset.left;
			that.selectedElem.width(mouseX);
		}
	};
	that.selectionClicked = function (e)
	{
		if (opts.canRate)
		{
			var offset = targetElem.offset();
			var clickX = e.pageX - offset.left;
			var newX = Math.round(clickX);
			that.newRating = that.round((newX/that.scaleFactor), opts.roundTo);
			that.sendRating(that.newRating);
		}
	};
	that.computeWidths = function ()
	{
		that.avgElem.width(Math.round(that.scaleFactor * that.avgVal));
		that.selectedElem.width(Math.round(that.scaleFactor * that.selectedVal));
	};
	that.clearRatings = function ()
	{
		return that.setRatings(null, null);
	};
	that.setRatings = function (avgVal, selectedVal)
	{
		that.avgVal = (avgVal || opts.minVal);
		that.selectedVal = (selectedVal || opts.minVal);
		if(that.containerElem)
		{
			that.computeWidths();
		}
	};
	return that;
};
