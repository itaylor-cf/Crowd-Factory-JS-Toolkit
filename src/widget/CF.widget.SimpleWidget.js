/**
 * @class
 * This widget contains basically no business logic and serves only to render templates based on data passed in through the data 
* Attribute of the template.  Its most common use is as a base class for other widgets to inherit basic widget structure and methods from
* 
* Events:
* widget_started fired when start() is called
* widget_reloaded fired when reload() is called
* widget_removed fired when remove() is called
* widget_drawn fired after the widget is added to the DOM.
* 
* @param {element} targetElem   The element or jQuery object that the widget will be rendered into.
* @param {element} template  The node or jQuery object that will be used as the template for this widget. 
* @param {CF.template.Engine} templateEngine  An instance of the templateEngine that will be used to render this widget
* @param {object} data  Any data that the widget needs to render or to fetch the data that will be rendered.
* @param {object} options  Any options that the widget needs to render the template.
*/
CF.widget.SimpleWidget = function (targetElem, template, templateEngine, data, options)
{
	if (!template)
	{
		template = CF.build("div");
	}
	var that = {};
	
	/**
	 * @type CF.EventPublisher
	 * @description The events property is a way for portlets to register event based communication with other widgets or non-widget code.
	 */
	that.events = CF.EventPublisher();
	
	/**
	 * @name CF.widget.SimpleWidget#widget_started
	 * @event
	 * @description
	 * Fired when the start() method is called.  Fires before onStart is called.
	 * @param {CF.widget.SimpleWidget} widget The current widget object.
	 */
	
	/**
	 * @name CF.widget.SimpleWidget#widget_reloaded
	 * @event
	 * @description
	 * Fired when the reload() method is called.  Fires before onReload is called.
	 * @param {CF.widget.SimpleWidget} widget The current widget object.
	 */
	
	/**
	 * @name CF.widget.SimpleWidget#widget_drawn
	 * @event
	 * @description
	 * Fired after the widget has been rendered and all of its subwidgets have been started.
	 * @param {CF.widget.SimpleWidget} widget The current widget object.
	 */

	/**
	 * @name CF.widget.SimpleWidget#widget_removed
	 * @event
	 * @description
	 * Fired when reload() is called.  Fires before the widget is removed from the registry.
	 * @param {CF.widget.SimpleWidget} widget The current widget object.
	 */
	
	
	/**
	* @description The getDefaultTemplateBody function allows you to provide a template that will be used to render a widget if the template is passed in empty.
	* This is especially useful for creating widgets that may have complex interactions that you want organize into a widget,
	* but that don't usually need to have their structure modified with a template because they don't display large amounts of data.
	* This can return either a HTML string, a node, a jQuery wrapped node, or null.  It will be called by the render method.
	*/
	that.getDefaultTemplateBody = function()
	{
		return null; //This widget does not have a default template body	
	};
	
 	/**
 	* @description returns the data that will be passed into the template render function.  
 	* If your widget fetched data via ajax in the start or reload function, you will probably want to pass the data through here.
 	*/
 	that.getData = function ()
	{
		return data;
	};
	
	/**
	* The start function kicks off the start stage of the widget lifecyle. 
	* @returns {object} "that" (the widget object) to enable chaining.
	*/
	that.start = function ()
	{
		that.events.fire("widget_started", that);
		that.onStart();
		return that;
	};
	
	/**
	 * @description
	 * Override this method to do any fetching of data via AJAX or other methods that your widget needs in order to be rendered
	 * When your data fetch is complete, call the that.draw() function.
	 */	
	that.onStart = function ()
	{
		//This widget doesn't fetch any data so it can call that.draw immediately.
		that.draw();
	};	
	
	/**
	* The draw function takes the rendered template and adds it to the targetElem.
	* For the top level widget in a nested widget heirarchy this will add it to the viewable DOM.  For nested widgets,
	* it will add the widget to the nested DOM.  Then, after it has been appended to the DOM, it starts its subWidgets
	*/
	that.draw = function ()
	{
		var frag = that.render();
		//hold on to any subwidgets that we may have, for later when we may need to remove them.
	    that.subWidgets = templateEngine.subWidgets;
	    targetElem.empty();
		targetElem.append(frag);
		that.subWidgets.find = function(type){
			return CF.collect(that.subWidgets, function (i, w){if (w.type === type)return w;});
		};
		that.bindEvents(targetElem, that.subWidgets);	
		templateEngine.startSubWidgets();
		that.events.fire("widget_drawn", that);
	};
	
	/**
	* Override this method to wire up DOM nodes to events using jQuery's find function.
	* This is the bindEvents function.  It is called by the draw function after rendering is complete but before the 
	* element has been appended to the dom.  
	* @param elem A jQuery wrapped node containing a rendered widget which has been rendered but not yet inserted into the DOM.
	* @param subWidgets A list of subWidgets and their wrappers that were rendered in the creation of this widget.  They will not have been started or rendered yet, 
	* but you may bind to their events
	*/	
	that.bindEvents = function (elem, subWidgets)
	{
		//Does nothing in this widget, you may wish to override this method with something like the below
		
		//The below will alert a message whenever an element of class "hoverable" inside the rendered template is hovered. 
		//elem.find(".hoverable").hover(function(){alert('You hovered a hoverable')});
		
		//The below will reload the widget whenever anyone clicks on a dom element with a class of "reload"
		//elem.find(".reload").click(that.reload); 
	};
	
	/**
	* Render calls to the templateEngine instance that was passed in at widget creation and gets back a jQuery wrapped 
	* dom node that has in it the entire DOM of the rendered template.  This template is not yet bound to the viewable DOM, 
	* so it may be manipulated easily and inexpensively.
	*/
	that.render = function ()
	{
		//Before rendering we need to call remove on all subwidgets that we have rendered, 
		// as they will be removed from the and recreated.
		if(that.subWidgets)
		{
			jQuery.each(that.subWidgets, function (i, o) {o.widget.remove();});
		}
		//I'm doing this clone here because the template engine is replacing the 
		//cf_widgetLoader statements with cf_widget statements.  This is problematic because it
		//modifies the original template... which means that on a reload, there are no cf_widgetLoader
		//statements. This is obviously slower, though.
		//I can think of a few fixes (not replacing cf_widgetLoader, adding it back in on reload), but 
		//they all have side-effects that may be unpleasant. 
		var elem = templateEngine.render(template.clone(), that.getData());
		return elem;
	};
	
	/**
	 * This method should be called when a widget is about to be removed from the DOM by a parent widget or another.
	 * It needs to clean up anything that holds a reference to it and detach any events that were bound.
	 * If your widget has listed to another widget's events, you may need to override this method, and unlisten to them here.
	 */
	that.remove = function ()
	{
		that.events.fire("widget_removed", that);
		CF.widget.registry.remove(that);
		if(that.events)
		{
			that.events.unlistenAll();
		}
		if(that.subWidgets)
		{
			jQuery.each(that.subWidgets, function (i,o) 
					{o.widget.remove();});
		}
		that.onRemove();
	};
	
	/**
	 * Override this method to do any additional cleanup that was not performed by the that.remove function.
	 * Typically, this is used to unlisten on any events from other widgets that this widget has listened to.
	 * The default implementation does nothing.
	 */
	that.onRemove = function ()
	{
	
	};
	
	/**
	* The reload function should fetch any data that needs fetched via AJAX and when complete call that.render().
	* It should return "that" (the simpleWidget object) to enable chaining.
	* This method is typically overridden.
	*/
	that.reload  = function ()
	{
		that.events.fire("widget_reloaded", that);
		that.onReload();	
		return that;
	};
	
	/**
	 * Override this method to do any fetching of data via AJAX or other methods that your widget needs in order to be re-rendered
	 * When your data fetch is complete, call the that.draw() function.
	 */	
	that.onReload = function ()
	{
		//This widget doesn't fetch any data via ajax, so it can call that.draw immediately
		that.draw();
	};
	
	return that;
};

