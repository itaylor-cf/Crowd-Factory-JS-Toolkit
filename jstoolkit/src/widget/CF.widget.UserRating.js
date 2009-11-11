//= require <CF.widget.SimpleWidget.js>
//= require <CF.context.js>

/**
 * @class
 * A widget for displaying and editing ratings on users.  The default template is a thumbs up/thumbs down
 * widget.
 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_vote When clicked, a vote is registered for the user with a value equal to the 'voteval' attribute of the
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
 * @see <a href='http://docs.crowdfactory.com/version/current/rest/v1_rating_user_create.html'>The rating/user/create/ documentation</a>
 */

CF.widget.UserRating = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		minVal: 0,
		maxVal: 1,
		roundTo: 1,
		canRate:true,
		category:"ThumbsUp",
		syndicate:false,
		syndiationUrl:location.href,
		syndicationCategory:"rating_user",
		hovertime:5000
	};
	opts = CF.extend(defaultOpts, opts);	
	
	var that = CF.widget.BaseRating(targetElem, template, templateEngine,data, opts);

	that.sendRating = function (val)
	{
		CF.context.api_v1.rating_user_create(that.ratingCreated, that.userId, opts.category, val);
	};	
	that.fetchUser = function ()
	{
		CF.context.api_v1.user_get(that.handleFetchUser, that.userId, {rating:opts.category});
	};
	that.getData = function ()
	{
		return {user:that.user, rating:that.rating, opts:opts, authUser:CF.context.auth_user}; 
	};
	that.populateUser = function (user)
	{
		that.rating = CF.arrayFind(user.user_ratings, function (i, r){
			if(r.category == opts.category)
				return r;
		});
		if (that.rating)
		{
			that.user = user;
			that.userId = user.external_id;
		}
	};
	
	that.handleFetchUser = function (user, error)
	{
		if(!error)
		{
			that.populateUser(user);
			that.draw();
		}
		else
		{
			//TODO: Handle error;
		}
	};
	
	that.publish = function (user, error)
	{
		var providers = that.getActiveSyndProviders();
		var value = "" + that.newRating;
		that.syndicate(providers, opts.syndicationCategory, that.userId, opts.syndicationUrl,value,that.syndComplete);
		that.hideHoverBox();
	};
	
	/**
	 * @description
	 * On reload, the user will always be refetched.
	 */
    that.onReload = function ()
    {
    	that.fetchUser();
	};
	/**
	 * @description
	 * On start, an user will be fetched if only the id was passed in
	 */
	that.onStart = function ()
	{
		if (!that.user)
		{
			that.fetchUser();
		}
		else
		{
			that.draw();
		}
	};
	
	//On object constructed to set up data.
	if (typeof data == 'object')
	{
		if(data.user_ratings)
		{
			that.populateUser(data);
		}
		that.userId = data.external_id;
	}
	else
	{
		that.userId = data;
	}
	if(!that.userId)
	{
		CF.error("Cannot create UserRating, invalid data parameter set.");
		return null;
	}
	
	return that;

};
