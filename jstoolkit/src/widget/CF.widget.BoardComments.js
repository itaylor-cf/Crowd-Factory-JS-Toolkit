//= require <CF.widget.BaseComments.js>
/**
 * @class
 * A widget for creating lists of comments on boards.
 * @extends CF.widget.BaseComments
 * 
 */
CF.widget.BoardComments = function (targetElem, template, templateEngine, data, opts)
{
	var that = CF.widget.BaseComments(targetElem, template, templateEngine, data, opts);
	if(data && typeof data === 'object')
		data = data.id;
	if(!data)
	{
		CF.error("BoardComments: the data parameter must be set to a board or a board's id", data);
		return null;
	}
	that.fetchComments = function()
	{
		CF.context.api_v1.comment_board_get(that.commentListLoaded, data, that.updateParams(that.params));
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
			CF.context.api_v1.comment_board_create(that.commentPosted, data, commentBody, params);
		}
	};
	return that;
};