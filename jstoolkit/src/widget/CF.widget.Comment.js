//= require <CF.widget.SimpleWidget.js>
/**
 * @class
 * A widget for rendering a single comment.  This is best used inside a comment list widget like CF.widget.EntityComments
 *
 * @extends CF.widget.SimpleWidget
 * @param {element} targetElem   The element or jQuery object that the widget will be rendered into.
 * 
 * @behavior {click} .cf_activate_reply Fires the comment_reply_activated event.
 * 
 * 
 */
CF.widget.Comment = 
function (targetElem, template, templateEngine, data, opts)
{
	if (!data)
	{
		CF.error("The data parameter is required for a CF.widget.Comment", "The data parameter should be a comment object.");
	}
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.getDefaultTemplateBody = function ()
	{
	 return "<div class='cf_widgetLoader' widgettype='CF.widget.UserProfile' data='comment.user' options='{showPopup:false}'></div> \
     <p>[% comment.body %]</p> \
     <div class='cf_date'>[% CF.friendlyDate(comment.created) %]</div> \
     <div class='cf_comment_actions'>\
     	 <div class='cf_if' binding='authUser && opts.flaggable'>\
    	 <span class='cf_widgetLoader' widgettype='CF.widget.AddFlag' data='comment.id' options='{type:\"comment\"}'>\
	     	</span>\
	     </div>\
	     <div class='cf_if' binding='authUser && opts.nested'> \
	   		<a class='cf_activate_reply' binding='item'> \
	   			Reply to [% comment.user.display_name %] \
	   		</a>\
	     </div>\
     </div>\
     <div class='cf_clear'> </div>";
	};
	that.activated = function ()
	{
		/**
		 * @name CF.widget.Comment#comment_reply_activated
		 * @event
		 * @description
		 * Fired when activated() is called. 
		 * @param {Object} comment The comment that is displayed for this widget.
		 * @param {CF.widget.Comment} The current widget object.
		 */
		that.events.fire("comment_reply_activated", that.getData().comment, that);
	};
	that.bindEvents = function (elem)
	{
		elem.find(".cf_activate_reply").click(that.activated);
	};
	that.getData = function ()
	{
		return {comment:data, opts:opts, authUser:CF.context.auth_user};
	};
	return that;
};
