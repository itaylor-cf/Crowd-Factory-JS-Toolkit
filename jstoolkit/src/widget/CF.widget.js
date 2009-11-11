//= require <CF.template.js>
/** 
 *  @namespace
 *  The top level widget namespace which holds some function for starting the rendering of widgets.
 */
CF.widget = {};

/**
*  @static
*  @description
*  Starts all top-level widgets.  A widget is an element of class cf_widgetLoader that has a widgettype attribute.
*  Calling this function is the simplest way to start all the widgets on a page.
*  It will wait until the DOM is fully loaded and the CF.context has been properly initialized before 
*  attempting to start widgets.
*/
CF.widget.startAll =  function (autoReload)
{
	jQuery(function()
	{	
		CF.context.whenLoaded(function ()
		{
		//Not really sure if this is faster than doing two queries and comparing the results...
		var topLevels = jQuery(".cf_widgetLoader:not(.cf_widgetLoader .cf_widgetLoader):not(.cf_noprocess .cf_widgetLoader)");
			CF.widget.start(topLevels);
			if (autoReload)
			{
				CF.context.events.listen("context_loaded", CF.widget.reloadAll);
			}
		});
	});
};

/**
 * Reloads all the top level widgets
 * Very useful to call after a login/logout where you don't want to reload the page.
 */
CF.widget.reloadAll = function ()
{
	//Not really sure if this is faster than doing two queries and comparing the results...
	var topLevels = jQuery(".cf_widget:not(.cf_widget .cf_widget)");
	jQuery.each(topLevels, function (i, elem)
	{
		var id = elem.id;
		if(id)
		{
			var w = CF.widget.registry.getId(id);
			if(w)
			{
				w.widget.reload();			
			}
		}	
	});
};


CF.widget.start = function (el)
{
	jQuery(el).each(function (i, widg)
	{
		widg = jQuery(widg);
		if (!CF.hasClass(widg, "cf_noprocess")) {
			var res = CF.widget.process(widg, null, widg.attr('id'));
			if (res) {
				res.widget.start();
			}
		}	
	});	
};

/**
 * @static
 * @description
 * Processes a widget, creating a new template Engine, reading in any data parameters,
 * initializing the widget, and adding it to the widget registry.  
 * Returns an object containing 
 * Does not call widget.start().
 * @returns {widget:widgetObj, id:id, type:widgetType, targetElem:targetElem} or null on failure.
 * @param {Element} template the template element node to render
 * @param {Object} data An object to use as the data parameter for the evaluation of the widget.
 * @param {String} id An id to use as the seed for the new widget id.
 */
CF.widget.process = 
function(template, data, id)
{
	id = CF.widget.registry.nextWidgetId(id);
	template = jQuery(template);
	var tNode = template.get(0);
	var tClass = "cf_widget "+ tNode.className.replace("cf_widgetLoader", "");
	var targetElem =CF.build(tNode.tagName, {className:tClass, id:id});
	template = template.replaceWith(targetElem);
	
	var widgetType = template.attr("widgettype");
	if(!widgetType)
		widgetType = "CF.widget.SimpleWidget";
	targetElem.attr("widgettype", widgetType);
	var templateEngine = CF.template.Engine();
	if (widgetType)
	{
		var widgetFx = CF.evalFx(widgetType);
		if (!widgetFx)
		{
			CF.error("The widgetType " + widgetType + "is not defined");
			return null;
		}
		
		var options = template.attr("options");
		if(options)
		{
			options = CF.evalFx(options, data);
		}
		var attr_data = template.attr("data");
	    if (attr_data)
	    {
	    	data = CF.evalFx(attr_data, data);
	    }
	    //Grab the template to use from some other node by id
	    var altTemplateId = template.attr("alt_template_id");
	    if (altTemplateId)
	    {
	    	var alt = jQuery("#"+altTemplateId);
	    	if (alt.length > 0 )
	    	{
	    		template.html(alt.html());
	    	}	    	
	    }
		//put up the loading widget.
		var widgetObj = widgetFx.apply(null, [targetElem, template, templateEngine, data, options]);
		if (!widgetObj)
			return null;
		//Apply the default template if no template was specified.
		if (jQuery.trim(template.html()).length == 0)
		{
			var defTmpl = widgetObj.getDefaultTemplateBody();
			if (defTmpl)
			{ 
				template.html(defTmpl);
			}
		}
		templateEngine.showLoadingMessage(targetElem, template, widgetObj.loadingMessage);		    
		CF.widget.registry.add(widgetType, id, widgetObj);
	    return {widget:widgetObj, id:id, type:widgetType, targetElem:targetElem};		
	}
	else
	{
		CF.error("Missing widget type on top level widget");
	}
	return null;
};

/**
 * 
 * @static
 * @class
 * The widget registry keeps track of all the rendered widgets.  It allows you get access to widgets by id or type.
* Once you have a widget instance, you can call reload or any other methods on them, and you can subscribe to events using 
* each widget's .events property, or if you are interested in all widgets of a given type you can use the listenType method to subscribe to 
* events on all widgets of that type (widgets that are not created yet will be automatically bound when they are added to the registry).
* 
* Events: widget_added - Fired after a widget is added to the registry.
*         widget_removed - Fired when a widget is removed from the registry.\
*/
CF.widget.registry = function ()
{
	var that = {};
	that._widgets = [];
	/**@type CF.EventPublisher*/
	that.events = CF.EventPublisher();
	that.listenedEvents = [];
	
	//This is the count of how many widgets have been allocated that will be used by the Template and Widget engines when they create a new
	//widget and need to give it a unique id.
	var count = 0;
	
	/**
	 * Adds a widget to the registry.  This should be called inside of the CF.widget.process function
	 */
	that.add = function (type, id, widget)
	{
		var o ={type:type, id:id, widget:widget};
		that._widgets.push(o);
		jQuery.each(that.listenedEvents, function (i, e) 
				{
					if(e.type === type && widget && widget.events)
					{
						widget.events.listen(e.event, e.fx);
					}
				});
		/**
		 * @name CF.widget.registry#widget_added
		 * @event
		 * @description
		 * Fired when a widget is added to the registry
		 * @param {Object} o The widget that was added to the registry
		 */
		that.events.fire("widget_added", o);
	};
	that._getCurrentCount = function ()
	{
		return count;
	};
	that._usedIds = {};
	/**
	 * Gets the next unique widget id by incrementing.
	 */
	that.nextWidgetId = function(id)
	{
		count++;
		if(!id)
			return "cf_w_" + count;
		if(!that._usedIds[id])
		{
			that._usedIds[id]= true;
			return id;
		}
		return id + count;
	};
	/***
	 * Removes a widget from the registry.  
	 * @param v A typeString, widgetId, or widgetObject to remove from the registry. 
	 */
	that.remove = function(v)
	{
		var removed = [];
		that._widgets = CF.arrayReject(that._widgets, function (i, o){
				var remove = (o.type === v || o.id === v || o.widget === v);
				if(remove)
					removed.push(o);
				return remove;
		});
		/**
		 * @name CF.widget.registry#widget_removed
		 * @event
		 * @description
		 * Fired when a widget is removed from the registry
		 * @param {Object} o The widget that was removed from the registry
		 */
		jQuery.each(removed, function (i, o){ that.events.fire("widget_removed", o);});
	};
	/**
	 * Fetches a widget container by id
	 */
	that.getId = function (id)
	{
		return CF.arrayFind(that._widgets, function (i, o){ return id === o.id; });
	};
	/**
	 * Fetches an array of widget containers by type
	 */
	that.getType = function (t)
	{
		return CF.collect(that._widgets, function (i, o) { if(t === o.type) return o; return null;});
	};
	/**
	 * Fetches a widget container by widget object
	 */
	that.getWidget = function (widget)
	{
		return CF.arrayFind(that._widgets, function (i, o) {return widget === o.widget;});
	};
	
	/**
	 * Adds a function as a listener to all widgets of a given type.  This will automatically take care of rebinding the 
	 * event when new widgets are added to the registry. 
	 */
	that.listenType = function (t, event, fx)
	{
		that.listenedEvents.push({type:t, event:event, fx:fx});
		var wgts = that.getType(t);
		jQuery.each(wgts, function (i, o)
		{
			if(o.widget && o.widget.events)
			{
				o.widget.events.listen(event, fx);
			}
		});
	};
	return that;
}();


