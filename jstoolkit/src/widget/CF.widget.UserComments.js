//= require <CF.widget.BaseComments.js>
/**
 * @class
 * @extends CF.widget.BaseComments
 * @description A widget for creating lists of comments on users.
 */
CF.widget.UserComments = function (targetElem, template, templateEngine, data, opts)
{
	var that = CF.widget.BaseComments(targetElem, template, templateEngine, data, opts);
	if(data && typeof data === 'object')
		data = data.external_id;
	if(!data)
	{
		CF.error("UserComments: the data parameter must be set to a user or a user's id", data);
		return null;
	}
	that.fetchComments = function()
	{
		CF.context.api_v1.comment_user_get(that.commentListLoaded, data, that.updateParams(that.params));
	};
	that.postComment = function ()
	{
		var commentBody = that.commentTxt.val();
		if (commentBody)
		{
			var params = {};
			if (that.responseToComment)
			{
				params.parent= that.responseToComment.id;	
			}
			params.subject = "";
			CF.context.api_v1.comment_user_create(that.commentPosted, data, commentBody, params);
		}
	};
	return that;
};
