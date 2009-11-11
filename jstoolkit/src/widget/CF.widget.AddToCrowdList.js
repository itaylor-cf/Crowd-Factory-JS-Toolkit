//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.SyndicationMixin.js>
//= require <CF.context.js>

/**
 * @class
 * A widget for adding items to a crowd list.  The user must be the owner of the list. 
 * The list will be created if it does not already exist.
 * 
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.SyndicationMixin
 * 
 */
CF.widget.AddToCrowdList = function (targetElem, template, templateEngine, data, opts)
{
	opts = CF.extend({name:"Favorites", category:"FavoritesList", checkExists:true, syndicate:true, syndicationUrl:location.href, syndicationCategory:"favorite", hovertime:5000}, opts);
	
	if (!data) {
		CF.error("AddToCrowdList: The data parameter must be set to an entity or entityId");
		return null;
	}
	var entityId = data.uid || data;
		
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.SyndicationMixin(that);	
	that.exists = null;
	
	that.onReload = function()
	{
		//only check for existance once.  After that, just toggle it in the widget.
		if (opts.checkExists && that.exists === null) 
			that.getExists();
		else 
			that.draw();
	};
	that.onStart = that.onReload;
	
	that.getExists = function ()
	{
		CF.context.api_v1.list_entity_exists(that.setExists, entityId, opts.category, opts.name);
	};
	
	that.setExists = function (exists, error)
	{
		if(!error)
			that.exists = exists;
		else
			that.exists = false;
		that.draw();
	};
		
	that.getData = function()
	{
		return {user:CF.context.auth_user, opts:opts, exists:that.exists};
	};
	that.getDefaultTemplateBody = function ()
	{
		var templ = 
		"<div class='cf_addlist cf_if' binding='user' rendertag='true'>\
			<span class='cf_if' binding='exists'>\
				<span class='cf_addlist_exists'>One of your favorites <a class='cf_removelist_btn'>Unfavorite</a></span>\
				<span class='cf_else'>\
					<a class='cf_addlist_btn'>Save as a favorite</a>\
				</span>\
			</span>\
			<div class='cf_addlist_hoverbox' style='display:none'>\
				<h4>Saved to your favorites list</h4>\
				<a class='cf_addlist_synd_btn'>Publish to: </a>\
				<span class='cf_widgetLoader cf_syndication_icons' widgetType='CF.widget.SyndicationIcons' options='{addable:true}'></span>\
			</div>\
			<div class='cf_else'>\
				Sign in to save favorites\
			</div>\
		</div>\
		";		
		return templ;
	};
	that.bindEvents = function (elem)
	{
		elem.find(".cf_addlist_btn").click(that.addToList);
		elem.find(".cf_removelist_btn").click(that.removeFromList);
		
		that.hoverbox = elem.find(".cf_addlist_hoverbox");
		that.hoverboxObj = CF.effect.Hover(that.hoverbox, null, that.hideHoverBox, 5);
		that.syndBtn = elem.find(".cf_addlist_synd_btn").click(that.publish);
		//Suspend the hover timer while waiting for an addition of a new provider.  
		jQuery.each(that.subWidgets.find("CF.widget.SyndicationIcons"), 
			function (i, o){
				o.widget.events.listen("syndprov_add_started",  function (){that.hoverboxObj.stop();});
		        o.widget.events.listen("syndprov_add_finished", function (){that.showHoverBox(); that.hoverboxObj.restart();});  
		  });		
	};
	that.addToList = function ()
	{
		CF.context.api_v1.list_entity_add(that.handleAdded, entityId, opts.category, opts.name);
	};
	that.removeFromList = function ()
	{
		CF.context.api_v1.list_entity_remove(that.handleRemoved, entityId, opts.category, opts.name);
	};
	that.hideHoverBox = function(){
		that.hoverbox.fadeOut(that.reload);
	};
	that.showHoverBox = function ()
	{
		that.hoverbox.fadeIn(function (){that.hoverboxObj.startGracePeriod();});
	};
	that.handleRemoved = function (result, error)
	{
		/**
		 * @name CF.widget.AddToCrowdList#listitem_removed
		 * @event
		 * @description
		 * The listitem_removed event is fired when an entity has been removed from the list.
		 * @parameter {String} entityId The entity id of the entity that was removed
		 * @parameter {AddToCrowdList} that The current widget object.
		 */
		that.events.fire("listitem_removed", entityId, that);
		that.exists = false;
		that.reload();
	};
	that.handleAdded = function (result, error)
	{
		if (!error)
		{
			/**
			 * @name CF.widget.AddToCrowdList#listitem_added
			 * @event
			 * @description
			 * The listitem_added event is fired when an entity has been added to the list.
			 * @parameter {String} entityId The entity id of the entity that was added
			 * @parameter {AddToCrowdList} that The current widget object.
			 */
			that.events.fire("listitem_added", entityId, that);
			that.exists = true;
			if(opts.syndicate)
			{
				that.showHoverBox();
			}
			else
			{
				that.reload();
			}
		}		
	};
	that.publish = function ()
	{
		var providers = that.getActiveSyndProviders();
		that.syndicate(providers, opts.syndicationCategory, entityId, opts.syndicationUrl, opts.name, that.syndComplete);
		that.hideHoverBox();
	};
	that.syndComplete = function (result, error)
	{
		
	};
	return that;
};
