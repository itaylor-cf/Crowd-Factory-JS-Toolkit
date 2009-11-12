//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.Pageable.js>
//= require <CF.context.js>
/**
 * @class
 * A CrowdList is a list of entities that is identified by its name, category, and either a user or a group who owns it.
 * To use this widget, it must be instantiated with a its options parameter set with the fields name, category, and either user or group parameter.
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.Pageable
 * 
 */
CF.widget.CrowdList = function (targetElem, template, templateEngine, data, opts)
{
	opts = CF.extend({offset:0, max_return:20, isUserList:true}, opts);
	
	if(opts.isUserList)
		opts.user = (typeof data ==='object') ? data.external_id : data;
	else
		opts.group = (typeof data === 'object') ? data.id : data;
	
	if(!opts.user && !opts.group)
	{
		CF.error("CrowdList: The data parameter must be set to either a user or a group", data);
		return null;
	}	
	if(!opts.category || !opts.name)
	{
		CF.error("Category, and name are required options for the CrowdList widget");
	}
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.Pageable(opts,that);
	
	that.onStart = function ()
	{
		that.onReload();
	};	
	
	that.onReload = function ()
	{
		var params = that.updateParams(opts);
		CF.context.api_v1.list_get(that.handleListLoad, opts.category, opts.name, opts);
	};	
	that.pageChanged = function (){
		that.reload();
	};
	that.handleListLoad = function (list, error)
	{
		if(error)
		{
			list = {};
			list.items = [];
		}
		that.list = list;	
		that.updatePager(list.items);
		that.draw();	
	};
	that.getData = function()
	{
		return {list:that.list, pager:{ offset:that.getOffset(), num_page:that.getPageNum()}, items:that.list.items};
	};
	that.getDefaultTemplateBody = function ()
	{
		var templ = 
		"<div>Total Items ([%list.item_count%]) Current page (<span class='cf_num_page'></span>) \
		Items on page (<span class='cf_num_items'></span>)\
		<a class='cf_first_page'>First</a> <a class='cf_prev_page'>Prev</a> <a class='cf_next_page'>Next</a>\
		</div>\
			<ul class='cf_for' binding = 'items'> \
			<li class='cf_item'>\
				<div class='cf_widgetLoader' widgettype='CF.widget.Entity' data='item.ExternalEntity'></div>\
			</li> \
			<li class='cf_item_empty'>No items.</li> \
		</ul>";
		return templ;
	};
	that.removeFromList = function (evt)
	{
		var jq = jQuery(this);
		CF.context.api_v1.list_entity_remove( that.reload, jq.attr("entity_id"), opts.category, opts.name);
	};
	that.bindEvents = function (elem)
	{
		elem.find(".cf_list_remove").click(that.removeFromList);
		that.bindPagerEvents(elem);
	};
	return that;
};
