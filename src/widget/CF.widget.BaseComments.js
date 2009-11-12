//= require <CF.context.js>
//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.Pageable.js>

/** @class 
 * The base class for comments.
 * Only allows logged in users to comment, other users are show It wires up behaviors for having a comment text body and a post comments button, as well as
 * listening for comment_reply_activated events on nested CF.widget.Comment widgets.
 * You need to override the fetchComments and postComments methods to use this class.
 * 
 *  @extends CF.widget.SimpleWidget
 *  @extends CF.widget.Pageable
 *  @extends CF.widget.SyndicationMixin
 *  
 *  @behavior {click} .cf_response_cancel Cancels a response to a nested comment.
 *  @behavior {click} .cf_comment_post Posts a comment from the currently logged in user with the 
 *  text in the .cf_comment_txt textarea.
 *  
 *  
 * */

CF.widget.BaseComments = function (targetElem, template, templateEngine, data, opts)
{
	opts = CF.extend({nested:false, syndicate:false, syndicationCategory:"comment", syndicationUrl:location.href }, opts); 
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.SyndicationMixin(that);
	CF.widget.Pageable(opts, that);
	
    that.setupParams = function ()
	{
		var params = CF.extend({}, opts);
		delete params['nested']; //These options aren't actual parameter options for the rest call.
		delete params['syndicate'];
		delete params['syndicationUrl'];
		delete params['syndicationCategory'];
		if(opts.nested && !params.depth)
		{
			params.order = "LineageLeastRecentFirst";
			params.depth = 10;// default 10 depth for nested.
		}
		params.nest = false; //we draw nesting with the depth property, not recursion.
		return params;
		//Test
	};
	
	that.params = that.setupParams();
	
	that.getDefaultTemplateBody = function ()
	{
		return "<div class='cf_comment_message'></div>\
		<div class='cf_comment_page'> \
			Showing (<span class='cf_num_items'></span>) comments \
		</div> \
		<ol class='cf_for cf_comments' binding='data.list'> \
        <li class='cf_item cf_comment cf_comment_depth[% (item.posting_depth || 0) %]'> \
        	<div class='cf_widgetLoader' widgettype='CF.widget.Comment' data='item' options='parent.opts'></div> \
        </li> \
         <li class='cf_item_empty'> \
         	No one has commented yet. \
         	<div class ='cf_if' binding='authUser'> \
         		 Be the first to comment! \
         	</div> \
         </li> \
       </ol> \
       <div class='cf_pager_row'> \
	   	Page (<span class='cf_num_page'></span>) <a class='cf_first_page'>First</a> <a class='cf_prev_page'>Prev</a> <a class='cf_next_page'>Next</a> \
	   </div> \
	    <div class='cf_if' binding='authUser'> \
		    <div> \
		    	<label for='cf_commentTxt'>Add your comment:</label> \
		    </div> \
	    <div class='cf_response' style='display:none;'> \
      		<span>In response to:</span> \
      		<span class='cf_response_to'></span> \
      		<a class='cf_response_cancel'> cancel</a> \
      	</div> \
		<div> \
      		<textarea class='cf_comment_txt'></textarea> \
      	</div> \
      	<div class='cf_comment_button_row'> \
			<div class='cf_comment_syndicate' style='display:none;'>\
				<div class='cf_syndicate_text'>Publish to:</div>\
				<div class='cf_widgetLoader cf_syndication_icons' widgettype='CF.widget.SyndicationIcons' options='{addable:true}'></div>\
				<div class='cf_clear'> </div>\
			</div>\
			<button class='cf_comment_post' type='button'>Post comment</button> \
      	</div> \
      	<div class='cf_else'> \
      		Please log in to start commenting. \
      	</div> \
      </div> \
     ";		            
	};            
	that.responseTo = function (evt, comment, w)
	{
		if (that.responseElem)
		{
			that.responseToComment = comment;
			that.responseElem.find(".cf_response_to").html(comment.user.display_name);
			that.responseElem.show();
			that.focusReply();
		}
	};
	that.cancelResponseTo = function()
	{
		that.responseToComment = null;
		that.responseElem.hide();
	};
	that.focusReply = function ()
	{
		if (that.commentTxt)
		{
			CF.focusLater(that.commentTxt, 20);
		}
	};
	that.bindEvents = function (elem, subWidgets)
    {
		that.responseElem = elem.find(".cf_response");
    	jQuery.each(subWidgets, function (i, w){ 
    		if (w.type === "CF.widget.Comment")
    		{
    			w.widget.events.listen("comment_reply_activated", that.responseTo);
    		}
    	});
		elem.find(".cf_focus_reply").click(that.focusReply);
    	elem.find(".cf_response_cancel").click(that.cancelResponseTo);
    	elem.find(".cf_comment_post").click(that.postComment);
    	that.commentTxt = elem.find(".cf_comment_txt");
    	that.commentMsg = elem.find(".cf_comment_message");
    	that.bindPagerEvents(elem);
		if (opts.syndicate)
		{
			elem.find(".cf_comment_syndicate").show();
			that.syndIcons = CF.collect(subWidgets, function (i, w){ 
			if (w.type== 'CF.widget.SyndicationIcons')
				return w.widget;	
			});
		}
		
    };
    that.pageChanged = function ()
    {
    	that.params = that.updateParams(that.params);
    	that.reload();
    };
    that.onReload = function ()
    {
		that.fetchComments();
	};
	that.onStart = function ()
	{
		that.fetchComments();
	};
	that.fetchComments = function()
	{
		throw ("Implementation required for fetchComments.");
	};
	that.postComment = function ()
	{
		throw ("Implementation required for postComment");
	};
	
	/**
	 * @name CF.widget.BaseComments#comment_posted
	 * @event
	 * @description
	 * Fired when a comment is posted. 
	 * @param {Object} result The result of the post comment call.
	 * @param {CF.widget.Entity} that The current widget object.
	 */
	
	
	that.commentPosted = function (result, error)
	{
		that.events.fire("comment_posted", result, that);
	
		if (error)
		{
			CF.error("Error posting comment", error);
		}
		else
		{
			if (opts.syndicate)
			{
				var providers = [];
				jQuery.each(that.syndIcons, function(i, w){
						providers = CF.keys(w.checkedToggles);
					});
				that.syndicate(providers, opts.syndicationCategory, result.id, opts.syndicationUrl, null);
			}
			
			that.responseToComment = null;
			if (that.commentMsg)
			{
				that.commentMsg.show();
				that.commentMsg.html("Your comment was added.");
			}
			that.reload();
		}
	};
    that.commentListLoaded = function (comments, error)
    {
    	if (error)
    	{
    		comments = [];
    		CF.error("Error fetching comments", error);
    	}
    	that.commentList = comments;
    	that.updatePager(that.commentList);
    	that.draw();
    };
    that.getData = function ()
    {
    	return {
    		opts:opts,
    		list: that.commentList,
    		authUser : CF.context.auth_user
    	};
    };
    return that;
};
