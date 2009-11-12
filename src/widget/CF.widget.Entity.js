//=  require <CF.widget.SimpleWidget.js>
//=  require <CF.context.js>
/**
 * @class
 * A Widget for rendering a single entity by either id or by passing the full entity object.  If the full entity object is passed
 * as data, no request will be made to fetch the entity.
 * The options are past through as a parameters to the underlying entity/get call.

 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_entity_activate Fires the entity_activated event and fades in any .cf_entity_activate_target elements in the template.
 * @behavior {click} .cf_entity_deactivate Fires the entity_deactivated event and hides any .cf_entity_activate_target elements in the template.
 * @behavior {hover} .cf_entity_hover Fires the entity_hover_in event when an element is hovered and the entity_hover_out event when an element 
 * is unhovered.  Also fades in any .cf_entity_hover_target elements when hover_in happens and hides them on hover_out.
 */

CF.widget.Entity = function (targetElem, template, templateEngine, data, opts)
{
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	/**
	 * @name CF.widget.Entity#entity_activated
	 * @event
	 * @description
	 * Fired when the entity is activated. 
	 * @param {Object} entity The entity that is displayed for this widget.
	 * @param {CF.widget.Entity} The current widget object.
	 */
	
	/**
	 * @name CF.widget.Entity#entity_deactivated
	 * @event
	 * @description
	 * Fired when the entity is deactivated. 
	 * @param {Object} entity The entity that is displayed for this widget.
	 * @param {CF.widget.Entity} The current widget object.
	 */
	
	/**
	 * @name CF.widget.Entity#entity_hover_in
	 * @event
	 * @description
	 * Fired when the entity has began to be hovered. 
	 * @param {Object} entity The entity that is displayed for this widget.
	 * @param {CF.widget.Entity} The current widget object.
	 */
	
	/**
	 * @name CF.widget.Entity#entity_hover_out
	 * @event
	 * @description
	 * Fired when the entity has finished being hovered. 
	 * @param {Object} entity The entity that is displayed for this widget.
	 * @param {CF.widget.Entity} The current widget object.
	 */
	
	if(!data)
	{
		CF.error("Entity: data parameter of either an entity object or an entity id required");
		return null;
	}
	if (typeof data == 'object')
	{
		that.entity = data;
		that.entityId = that.entity.uid;
	}else
	{
		that.entityId = data;
	}
		
	/**
	 * @description
	 * On reload, the entity will always be refetched.
	 */
    that.onReload = function ()
    {
    	that.fetchEntity();
	};
	/**
	 * @description
	 * On start, an entity will be fetched if only the id was passed in.
	 */
	that.onStart = function ()
	{
		if (!that.entity)
		{
			that.fetchEntity();
		}
		else
		{
			that.draw();
		}
	};
	
	/**
	 * The default template body for this is unlikely to be used, as the display case for entities is very different for each
	 * customer.
	 */
	that.getDefaultTemplateBody = function ()
	{
		return " \
			<div class='cf_entity'> \
				<div class='cf_if' binding='entity.url'>\
					<a cf_href='[%entity.url%]'>\
					 <div class='cf_title'>[%entity.title%]</div> \
					</a> \
					<div class='cf_else'> \
					<div class='cf_title'>[%entity.title%]</div> \
					</div> \
				</div>\
				<div class='cf_created'> Added: [% CF.friendlyDate(entity.created) %] </div>\
				<div class='cf_if' binding='entity.description'>\
					<div class='cf_description'>\
						[%entity.description%] \
					</div>\
				</div> \
		 	</div>";
	};
	that.getData = function ()
	{
		return {entity:that.entity, opts:opts, authUser:CF.context.auth_user};
	};
	that.fetchEntity = function()
	{
		CF.context.api_v1.entity_get(that.entityFetched, that.entityId, opts);
	};
	that.entityFetched = function (entity, error)
	{
		if (error)
			that.entity = null;
		else
			that.entity = entity;
		that.draw();
	};
	that.hoverIn = function ()
	{
		that.events.fire("entity_hover_in", that.entity, that);
		that.hoverTargetElem.fadeIn();
	};
	that.hoverOut = function()
	{
		that.events.fire("entity_hover_out", that.entity, that);
		that.hoverTargetElem.hide();
	};
	that.entityActivated = function ()
	{
		that.events.fire("entity_activated", that.entity, that);
		that.activateTargetElem.fadeIn();		
	};
	that.entityDeactivated = function ()
	{
		that.events.fire("entity_deactiviated", that.entity, that);
		that.activateTargetElem.hide();
	};
	that.bindEvents = function (elem, subWidgets)
	{
		elem.find(".cf_entity_hover").hover(that.hoverIn, that.hoverOut);
		elem.find(".cf_entity_activate").click(that.entityActivated);
		elem.find(".cf_entity_deactivate").click(that.entityDeactivated);
		that.activateTargetElem = elem.find(".cf_entity_activate_target").hide();
		that.hoverTargetElem = elem.find(".cf_entity_hover_target").hide();
	};
	return that;	
};