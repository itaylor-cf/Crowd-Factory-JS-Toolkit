//= require <CF.widget.BaseInsightEntityWidget.js>

CF.widget.HBOComments = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.entityId = opts.entityId  || CF.insight.getEntityId();
	opts.showComments = CF.coerce(opts.showComments, "bool");
	opts.scrollToCommentEntry = CF.coerce(opts.scrollToCommentEntry, "bool");
	
	if(!opts.commentPageUrl || !opts.shareWidgetName || !opts.commentWidgetName){
		CF.error("HBOComments: commentPageUrl, shareWidgetName, and commentWidgetName are required options");
	}
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.onReload = function()
	{
		that.onStart();
	};
	that.hasNamedChildren = true;
	that.getDefaultTemplateBody = function ()
	{
		return '\
		<div class="cf_hbo_comments">\
			<div class="cf_hbo_comment_prompt">\
				<ul class="cf_hbo_comment_ul">\
					<li class="cf_hbo_comment_li1">\
						<div class="cf-post-comments">\
							<a cf_href="[%opts.commentPageUrl%]?commenting=1">\
								<span class="cf_post_icon" />\
								Comments <span class="comment-counter"></span>\
							</a>\
						</div>\
					</li>\
					<li class="cf-comment-item">\
						<a class="cf-post-comments" cf_href="[%opts.commentPageUrl%]?commenting=1">\
							<img cf_src="http://imagecms-cf.crowdfactory.com/cms/0n2vK4-0ncUsJ-Q0s3g0HYtLO/xlrgr00049b740e07-214e-4d66-8c19-f34feb307ce4.png" />\
	  					</a>\
					</li>\
					<li class="cf-share-item">\
	  					<div class="cf_widgetLoader" widgetname="[%opts.shareWidgetName%]" options="{entityId:opts.entityId}"></div>\
					</li>\
				</ul>\
				<br style="clear: both" />\
			</div>\
			<iframe cf_src="http://www.facebook.com/widgets/like.php?href=[%opts.commentPageUrl%]&colorscheme=dark" scrolling="no" frameborder="0" style="bgcolor: #000; margin: 5px 0 0 0; padding: 0; width: 450px; height: 25px; border:none;" allowTransparency="true"></iframe>\
			<div class="cf_if" binding="opts.showComments">\
				<div class="cf_hbo_comment_main outer-wrapped">\
		      	<h3 class="caption">\
					<span class="cf_post_icon" />\
		      	Join the conversation</h3>\
		      	<div class="caption-text">Enter your comment</div>\
		      	<div class="commenting">\
		      		<div class="cf_widgetLoader" widgetname="[%opts.commentWidgetName%]" options="{entityId:opts.entityId}"></div>\
	            </div>\
	            <br style="clear:both" />\
	        </div>\
		</div>';
	};
	that.getData = function (){
		return {opts:opts};
	};
	that.updateCommentCount = function (newCount){
		that.commentCountElem.html("("+(newCount || "be the first")+")");
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subwidgets){
		that.superBindEvents(elem, subwidgets);
		that.commentCountElem = elem.find(".comment-counter");
		if(!opts.showComments){
			//If we're not showing the comment, we need to go grab the count, otherwise, the comment widget will do it for us.
			CF.context.api_v1.entity_get(function (entity, error){
				var commentCount = 0;
				if(!error){
					commentCount = entity.comments_count;
				}
				that.updateCommentCount(commentCount);
			}, opts.entityId);
		}else{
			//If the comments are already shown, don't take them to another page, just focus the comment element.
			elem.find(".cf-post-comments a,.cf-comment-item a").click(function (e){
				e.preventDefault();
				elem.find(".cf_comment_post_form_wrap textarea").focus();
			});
			cf_jq.each(subwidgets, function (i, widg){
				if(widg.type == "CF.widget.InsightComments"){
					widg.widget.events.listen("widget_drawn", function (evt, w){
						that.updateCommentCount(w.commentCount);
						if(opts.scrollToCommentEntry){
							var wrap = elem.find(".cf_comment_post_form_wrap");
							if(wrap && wrap.length){
								var offset = wrap.offset().top -100;
								cf_jq("html,body").animate({scrollTop:offset}, 500, function (){
									wrap.find("textarea").focus();
								});
							}
							
						}
					});
				}
			});
		}
	};
	return that;
	
};