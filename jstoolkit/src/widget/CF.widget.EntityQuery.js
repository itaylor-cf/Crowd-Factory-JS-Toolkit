//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.Pageable.js>
//= require <CF.context.js>
/**
 * @class
 * A widget used to fetch entities that have been ranked by a specific order.
 * It supports the following queryTypes: 
 * highest_rated, most_commented, most_rated, number_lists, recently_commented, and top_rated
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.Pageable
 * @description 
 * Each of the EntityQuery queryTypes may have different allowed parameters.  The appropriate 
 * parameters can be found by looking at the documentation for the rest/v1/query/entity/* apis.
 * @see <a href='http://docs.crowdfactory.com/version/current/rest/rest_api_overview.html#activityqueries'>The query/entity/* documentation</a> 
 */
CF.widget.EntityQuery = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		queryType:"highest_rated", //most_commented, most_rated, number_lists, recently_commented, top_rated
		offset:0,
		max_return:20
	};
	opts = CF.extend(defaultOpts, opts);
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.Pageable(opts,that);
	
	that.onStart = function ()
	{
		that.getEntityList();
	};	
	that.onReload = function ()
	{
		that.getEntityList();
	};
	that.getEntityList = function()
	{
		try{
			var params = jQuery.extend({}, opts);
			delete params.queryType;
			params = that.updateParams(params);
			CF.context.api_v1["query_entity_"+opts.queryType](that.handleListLoad, params);
		}
		catch(e)
		{
			CF.error("Error making entity query (is queryType valid?)", e);
		}
	};	
	that.pageChanged = function (){
		that.reload();
	};
	that.handleListLoad = function (entities, error)
	{
		if(error)
		{
			entities = [];
		}
		that.entities = entities;	
		that.updatePager(that.entities);
		that.draw();	
	};
	that.getData = function()
	{
		return {entities:that.entities, pager:{ offset:that.getOffset(), num_page:that.getPageNum()}};
	};
	that.getDefaultTemplateBody = function ()
	{
		var templ = 
		"<div class='cf_pager_row'> \
		Current page (<span class='cf_num_page'></span>) \
		Items on page (<span class='cf_num_items'></span>)\
		<a class='cf_first_page'>First</a> <a class='cf_prev_page'>Prev</a> <a class='cf_next_page'>Next</a>\
		</div>\
		<ul class='cf_for' binding = 'entities'> \
			<li class='cf_item'>\
				<div class='cf_widgetLoader' widgettype='CF.widget.Entity' data='item'></div> \
			</li> \
			<li class='cf_item_empty'>No items.</li> \
		</ul>";
		return templ;
	};
	that.bindEvents = function (elem)
	{
		that.bindPagerEvents(elem);
	};
	return that;
};
