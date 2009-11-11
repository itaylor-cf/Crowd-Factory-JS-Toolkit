//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.Pageable.js>
//= require <CF.context.js>
/**
 * @class
 * An incomplete in-progress version of a widget used to display activity events.
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.Pageable
 * @description 
 */
CF.widget.ActivityEventView = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
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
		CF.context.api_v1.activityevent_get(that.handleListLoad, opts);
	};	
	that.pageChanged = function (){
		that.reload();
	};
	that.handleListLoad = function (activityEvents, error)
	{
		if(error)
		{
			activityEvents = [];
		}
		that.activityEvents = activityEvents;	
		that.updatePager(that.activityEvents);
		that.draw();	
	};
	that.getData = function()
	{
		return {activityEvents:that.activityEvents, pager:{ offset:that.getOffset(), num_page:that.getPageNum()}};
	};
	that.getDefaultTemplateBody = function ()
	{
		var templ = 
			"<div class='cf_pager_row'> \
			Current page (<span class='cf_num_page'></span>) \
			Items on page (<span class='cf_num_items'></span>)\
			<a class='cf_first_page'>First</a> <a class='cf_prev_page'>Prev</a> <a class='cf_next_page'>Next</a>\
			</div>\
				<ul class='cf_for' binding = 'activityEvents'> \
				<li class='cf_item'>\
					<div class='cf_if' binding='item.performer.user' assign='true'>\
						performer: [% display_name %] \
					</div> \
					<div class='cf_if' binding='item.participant.user' assign='true'>\
						participant: [% display_name %] \
					</div> \
					<div class='cf_if' binding='item.container.user' assign='true'>\
						container: [% display_name %] \
					</div> \
					<div class='cf_if' binding='item.performer.ExternalEntity' assign='true'>\
						performer: [% title %] \
					</div> \
					<div class='cf_if' binding='item.participant.ExternalEntity' assign='true'>\
						participant: [% title %] \
					</div> \
					<div class='cf_if' binding='item.container.ExternalEntity' assign='true'>\
						container: [% title %] \
					</div> \
					<div class='cf_message cf_if' rendertag='true' binding='item.message'>\
						[% item.message %]\
					</div>\
					<div class='cf_widgetLoader' widgettype='CF.widget.Entity' data='item'/> \
				</li> \
				<li class='cf_item_empty'>No items.</li> \
			</ul>";
		return templ;
	};
	that.bindEvents = function (elem, subwidgets)
	{
		CF.widget.registry.listenType("CF.widget.MyStatusActivity", "activityevent_created", that.reload);
		that.bindPagerEvents(elem);
	};
	return that;
};
