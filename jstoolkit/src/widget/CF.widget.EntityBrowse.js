//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.Pageable.js>
//= require <CF.context.js>
/**
 * @class
 * A widget used to fetch multiple entities.
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.Pageable
 * @description 
 * The constructor for EntityBrowse
 * @see <a href='http://docs.crowdfactory.com/version/current/rest/v1_entity_browse.html'>The entity/browse documentation</a> 
 * For the values allowed in the opts object.
 */
CF.widget.EntityBrowse = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		order:"MostRecentFirst", //LeastRecentFirst, MostCommented, MostRecentlyCommented, LeastRecentlyCommented, HighestRated
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
		that.updateParams(opts);
		CF.context.api_v1.entity_browse(that.handleListLoad, opts);
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
					<div class='cf_widgetLoader' widgettype='CF.widget.Entity' data='item'/> \
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
