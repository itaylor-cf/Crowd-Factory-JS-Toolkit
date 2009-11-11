//= require <CF.widget.SimpleWidget.js>
//= require <CF.context.js>

/**
 * @class
 * A widget for displaying and editing ratings on entities.  The default template is a thumbs up/thumbs down
 * widget.
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
 * @see <a href='http://docs.crowdfactory.com/version/current/rest/v1_rating_entity_create.html'>The rating/entity/create/ documentation</a>
 */

CF.widget.EntityRating = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		minVal: 0,
		maxVal: 1,
		roundTo: 1,
		canRate:true,
		category:"ThumbsUp",
		syndicate:false,
		syndiationUrl:location.href,
		syndicationCategory:"rating_entity",
		hovertime:5000
	};
	opts = CF.extend(defaultOpts, opts);		
	var that = CF.widget.BaseRating(targetElem, template, templateEngine, data, opts);
	
	that.sendRating = function (val)
	{
		CF.context.api_v1.rating_entity_create(that.ratingCreated, that.entity.uid, opts.category, val);
	};	
	that.fetchEntity = function ()
	{
		CF.context.api_v1.entity_get(that.handleFetchEntity, that.entityId, {rating:opts.category});
	};
	that.getData = function ()
	{
		return {entity:that.entity, rating:that.rating, opts:opts, authUser:CF.context.auth_user}; 
	};
	that.populateEntity = function (entity)
	{
		that.rating = CF.arrayFind(entity.entity_ratings, function (i, r){
			if(r.category == opts.category)
				return r;
		});
		if (that.rating)
		{
			that.entity = entity;
			that.entityId = entity.uid;
		}
	};
	
	that.handleFetchEntity = function (entity, error)
	{
		if(!error)
		{
			that.populateEntity(entity);
			that.draw();
		}
		else
		{
			//TODO: Handle error;
		}
	};
	
	that.publish = function (entity, error)
	{
		var providers = that.getActiveSyndProviders();
		var value = "" + that.newRating;
		that.syndicate(providers, opts.syndicationCategory, that.entityId, opts.syndicationUrl,value, that.syndComplete);
		that.hideHoverBox();
	};
	
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
	 * On start, an entity will be fetched if only the id was passed in
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
	
	//On object constructed to set up data.
	if (typeof data == 'object')
	{
		if(data.entity_ratings)
		{
			that.populateEntity(data);
		}
		that.entityId = data.uid;
	}
	else
	{
		that.entityId = data;
	}
	if(!that.entityId)
	{
		CF.error("Cannot create EntityRating, invalid data parameter set.");
		return null;
	}
	return that;
};
