//= require <CF.widget.EntityRating.js>
/***
 * @class
 * A "Stars" rating widget for entities.  
 * It uses a kind of multi-layered bar graph approach with an image mask above it to make the stars, and 
 * could easily be adapted to use a different image mask for a different appearance (eg, check marks instead of stars).
 * The stars display implemented as CSS.  Make sure you have included the CSS and its images from the examples.
 *  
 * @extends CF.widget.EntityRating
 * @description
 * The opts parameter behaves as {@link CF.widget.EntityRating} with the following additional properties:<br/>
 * width: the width in pixels of the stars rating box.<br/>
 * opacity: the opacity to set with the .cf_opacity behavior.
 * 
 * @behavior {mousemove} .cf_hover_select_rating Moves the user's rating bar when they have their mouse over the rating.
 * @behavior {click} .cf_hover_select_rating Sets a rating when the rating is clicked.
 * @behavior {mouseout} .cf_hover_select_rating Returns the user's rating bar to the stored value when they no longer have their mouse over the ratings bar;
 * @behavior .cf_opacity sets the opacity of any elements to the value of opacity from the opts parameter.
 */
CF.widget.StarEntityRating = 
function (targetElem, template, templateEngine, data, opts)
	{		
		var defaultOpts = {
			width : 83,
			minVal: 0,
			maxVal: 5,
			roundTo: .5,
			opacity: .7,
			canRate:true,
			category:"Stars"
		};
		opts = CF.extend(defaultOpts, opts);
		
		var that = CF.widget.EntityRating(targetElem, template, templateEngine, data, opts);
		that = CF.widget.StarRatingMixin(that, targetElem, template, templateEngine, data, opts);
		
		that.superPopulateEntity = that.populateEntity;
		that.populateEntity = function (entity)
		{
			that.superPopulateEntity(entity);
			
			if (that.rating)
			{
				that.rating.average_rating = that.round(that.rating.average_rating, opts.roundTo);
				that.rating.user_rating = that.round(that.rating.user_rating, opts.roundTo);
				that.setRatings(that.rating.average_rating, that.rating.user_rating);
			}
		};
			//Set up the values
		if (that.entity)
		{
			that.populateEntity(that.entity);
		}
		return that;
	};