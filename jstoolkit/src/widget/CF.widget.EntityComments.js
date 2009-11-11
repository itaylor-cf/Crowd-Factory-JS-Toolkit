//= require <CF.widget.BaseComments.js>

/**
 * @class
 * A widget for creating lists of comments on entities.
 * @extends CF.widget.BaseComments
 * 
 * */
CF.widget.EntityComments = function (targetElem, template, templateEngine, data, opts)
{
	var entity= null;
	if (data && typeof data === 'object') {
		entity = data;
		data = data.uid;
	}
	if(!data)
	{
		CF.error("EntityComments: the data parameter must be set to an entity or entityId", data);
		return null;
	}
	var that = CF.widget.BaseComments(targetElem, template, templateEngine, data, opts);
	
	that.fetchComments = function()
	{
		CF.context.api_v1.comment_entity_get(that.commentListLoaded, data, that.updateParams(that.params));
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
			CF.context.api_v1.comment_entity_create(that.commentPosted, data, commentBody, params);
		}
	};
	that.superGetData = that.getData;
	that.getData = function ()
	{
		var o = that.superGetData();
		if (entity)
			o.entity = entity;
		return o;
	};
	return that;
};