/** 
 * @Class
 * The comment widget for insight.  Supports up to 3 deep threading, and an option to show or not show avatars.
 * 
 */

CF.widget.InsightStories = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.depth = CF.coerce(opts.depth, "int", 0);
	opts.socialIcons = CF.coerce(opts.socialIcons, "array", []);
	opts.actionRequiredMsg = opts.actionRequiredMsg || "Please post a comment to continue";
	opts.successDuration = CF.coerce(opts.successDuration, "int", 5000);
	opts.widgetHeadlineText = opts.widgetHeadlineText || "Sign in to comment and share:";
	opts.noStoryMsg = opts.noStoryMsg || "Your story could be here!  Be the first to tell your story!"; 
	opts.postConfirmMessage = opts.postConfirmMessage || "Thank you for sharing!";
	opts.shareTease = opts.shareTease || "Tell us briefly how Excel tables make life simpler for you...";
	opts.shareTeaseComplete = opts.shareTeaseComplete || "Thanks for sharing! You can share again if you wish...";
	opts.shareCbxLabel = opts.shareCbxLabel || "Share this with your friends";

	if (!opts.widgetStyle){
		CF.error("widgetStyle is a required option");
		return null;
	}
	
	
	var entityIdPassed = opts.entityId;	
	var that = CF.widget.BaseInsightEntityWidget(targetElem, template, templateEngine, data, opts);
	if (!entityIdPassed){
		opts.entityId += "-story";
	}
	
	that.onReload = function()
	{
		that.onStart();
	};
	
	that.getDefaultTemplateBody = function ()
	{
		return "\
		<div class='cf_stories'>\
				<div class='cf_commentheader cf_ms_arrow'>How others are using tables</div> \
				<div class='cf_commentList'>\
				<div class='cf_for' binding='comments'>\
					<div class='cf_item cf_comment [% (index == length -1) ? \"cf_last\" : \"\" %] cf_comment_depth0'> \
						<div class='cf_widgetLoader' widgetType='CF.widget.InsightStory' data='{comment:item}' options='CF.extend(parent.opts, {showReply:(item.posting_depth < parent.opts.depth)})'></div>\
					</div> \
					<div class='cf_item_alt cf_alt cf_comment [% (index == length -1) ? \"cf_last\" : \"\" %] cf_comment_depth0'>\
					<div class='cf_widgetLoader' widgetType='CF.widget.InsightStory' data='{comment:item}' options='parent.opts'></div>\
					</div>\
				        <div class='cf_item_empty'> \
				         	<div class='cf_if' binding='pager.current != 1'>\
				               There are no comments on this page yet.  \
				               <div class='cf_else'>\
				               		[%opts.noStoryMsg%]\
				               </div>\
				            </div>\
				         </div> \
				    </div>\
				   </div>\
				<div class='cf_replyarea'>\
				<div class='cf_reply_container'>\
					<div class='cf_replyprompt cf_commentheader'>\
						Tell your Story\
					</div>\
					<div class='cf_reply_bounder'>\
						<textarea class='cf_replybox'></textarea>\
						<label class='cf_sharebox_lbl'><input type='checkbox' class='cf_sharecbx'/>[%opts.shareCbxLabel%]</label>\
						<div class='cf_errormsg'></div>\
					</div>\
					<div class='cf_btnrow'>\
						<div class='cf_btnPostComment'/>\
					</div>\
				</div>\
			</div>\
			<div class='cf_login_holder'/>\
		</div>\
		<div class='cf_clear'/>";		
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subwidgets)
	{
		that.superBindEvents(elem, subwidgets);
		elem.find(".cf_signout").click(that.signOut);
		that.pointTest = elem.find(".pointTest");
		
		// for form
		that.errMsg= elem.find(".cf_errormsg");
		elem.find(".cf_signout").click(CF.login.logout);
		that.loginHolder = elem.find(".cf_login_holder");
		that.postBtn =  elem.find(".cf_btnPostComment").click(that.postComment);
		
		that.replyBox = elem.find(".cf_replybox").focus(that.replyBoxFocus).blur(that.replyBoxBlur);
		that.replyBox.val(opts.shareTease);

		var noShare = CF.coerce(CF.cookie.readCookie("CF_commentNoShare"), "bool", false);
		that.shareCbx = elem.find(".cf_sharecbx").attr('checked',!noShare);

	};
	that.replyBoxFocus = function () {
		that.replyBox.addClass("cf_active");
		if(that.replyBox.val()==opts.shareTease || that.replyBox.val() == opts.shareTeaseComplete) {
			that.replyBox.val('');
		}
	}
	that.replyBoxBlur = function () {
		if(that.replyBox.val()=='') {
			that.replyBox.removeClass("cf_active");
			that.replyBox.val(opts.shareTease);
		}
	}
	that.entityFetched = function (entity)
	{
		if(!entity)
		{
			that.comments = [];
			that.pager = {show:false, current:0, pageCount:0};
			that.draw();
			that.commentCount = 0;
		}
		else
		{
			that.commentCount = entity.comments_count || 0;
			that.getComments(entity);
		}
	};
	that.getComments = function (entity)
	{
		CF.context.api_v1.comment_entity_get(that.commentsFetched, entity.uid, 
		{ 
			offset:0,
			max_return:200,
			order:"MostRecentFirst",
			depth:opts.depth,
			status:["NONE","BANNED","DELETED"],
			show_myflag:true
		} );
	};
	that.commentsFetched = function (comments, error)
	{
		if(!error)
		{
			that.comments = comments;
			that.draw();
		}
	};
	that.postComment = function (){
		that.val = cf_jq.trim(that.replyBox.val());
		that.errMsg.html("");
		CF.log("that.val: " + that.val);
		if(!that.val || !that.val.length || that.val==opts.shareTease || that.val == opts.shareTeaseComplete){
			var e = CF.build("div", "Please enter your own comment.");
			that.errMsg.append(e);
			setTimeout(function (){
				e.fadeOut();
			}, 5000);

		} else{
			
			var shareChecked = that.shareCbx.attr('checked');
			CF.cookie.createCookie("CF_commentNoShare", (!shareChecked).toString());

			var shareChecked = that.shareCbx.attr('checked');
			CF.cookie.createCookie("CF_commentNoShare", (!shareChecked).toString());
			var o = CF.extend({}, opts);
			o.skipSyndication = !shareChecked;		
			that.insightMgr.doLoginFlow(that.loginHolder, that.postBtn, null, opts.widgetName,
					CF.curry(that.beforeAction, that.doPostComment), 
					that.performSyndication, o);
		}
	};
	that.doPostComment = function (afterActionFx){
		that.newBody = that.val;
		that.afterActionFx = afterActionFx;
		CF.context.api_v1.comment_entity_create(that.commentPosted, that.entity.uid, that.val, { 
			cflog_widgetname:opts.widgetName,
			widget:opts.widgetName
		});
	};
	
	that.commentPosted = function (comment, error){
		that.afterActionFx(that.postBtn, that.postBtn);
		// HB success message
		var fade = function (){
			that.hbElem.fadeOut();
		}
		var body = CF.build(".cf_success_msg", CF.build(".cf_success_msg_text", opts.postConfirmMessage));
		that.hb = CF.Hoverbox(that.loginHolder, null,body, null, {pointTo:that.postBtn});
		that.hbElem = that.hb.getElem();
		that.replyBox.val(opts.shareTeaseComplete);
		that.replyBox.removeClass("cf_active");
		setTimeout(fade, opts.successDuration);
	};
	
	that.scrollTo = function (elem){
		cf_jq("html,body").animate({scrollTop:elem.offset().top}, 1000);
	};
	
	that.performSyndication = function (prov, params, completeFx){
		params.value = that.newBody;
		params.cflog_widgetname = opts.widgetName;
		that.syndicate(prov, opts.widgetName, that.entity.uid, opts.syndicationUrl || location.href, params, completeFx);
	};
	
	that.getData = function ()
	{
		return {entity:that.entity, commentCount:that.commentCount || 0, opts:opts, 
			currentUser:CF.context.auth_user, comments:that.comments};
	};
	that.createEntity = function ()
	{
		var params = CF.insight.getEntityCreateParams(opts.entityId);
		params.cflog_widgetname = opts.widgetName;
		params.comments_require_premoderation = true;
		CF.context.api_v1.entity_create(that.entityCreated, params);
	};
	that.fetchEntity = function (entityId)
	{ 
		var userId = null;
		if (CF.context.auth_user)
			userId = CF.context.auth_user.uid;
		CF.context.api_v1.entity_get(that.verifyEntity, entityId , {rating:opts.rating, user:userId, cflog_widgetname:opts.widgetName});
	};
	return that;
};


/**
 * @Class
 * The class for an individual insight comment record.  This class includes a comment creation form, 
 * but does not actually perform any comment creation.  All comment creation events are fired as external
 * events, and are expected to be handled by a parent widget.
 * 
 * opts:
 * showReply (boolean default false)
 * avatars (boolean default true)
 * 
 * data input: 
 * 	comment:{commentObj}
 */

CF.widget.InsightStory = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.depth = CF.coerce(opts.depth, "int", 0);
	opts.avatars = CF.coerce(opts.avatars, "bool", false);
	opts.showReply = CF.coerce(opts.showReply, "bool", false);
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.textCollapsed = true;
	
	that.getDefaultTemplateBody = function ()
	{	
		return "<a name='cf_comment_[% comment.id %]'></a>\
				<div class='cf_comment_container'>\
					<div class='cf_comment_metadata'>\
						<div class='cf_comment_text'></div>\
						<div class='cf_if' binding='comment.user.status==\"Active\" && comment.status ==\"NONE\"'>\
							<div class='cf_username_container'>\
								<div class='cf_username'>\
									<div class='cf_if' binding='comment.user.profile_url'>\
									[% CF.getFirstName(comment.user.display_name) %], posted [%CF.dateFormat(comment.created, 'shortDate')%]\
									</div>\
								</div>\
							</div>\
						</div>\
					</div>\
					<div class='cf_formholder'></div>\
				</div>";
	};
	that.computeText= function (){
		if(!that.computedTxt){//all this text xform is expensive, only do it once.
			var txt = CF.text;
			var res = txt.spaceout(data.comment.body, 30);
			res = txt.nl2br(res);
			that.fullText = txt.linkify(res, {target:"_blank"});
			that.shortText = txt.smartTruncate(that.fullText, 250);
			that.computedTxt = true; 
		}
	};
	that.getData = function (){
		data.opts = opts;
		data.currentUser = CF.context.auth_user;
		return data;
	};
	that.toggleText = function (){
		that.textCollapsed = !that.textCollapsed;
		that.drawText();
	};
	that.drawText = function (){
		if(that.textCollapsed)
			that.txtElem.html(that.shortText);
		else
			that.txtElem.html(that.fullText + "<span class='cf_truncated'>show less</span>");
		that.txtElem.find(".cf_truncated").click(that.toggleText);
	};
	
	that.bindEvents = function(elem, subwidgets){
		that.txtElem = elem.find(".cf_comment_text");
		that.computeText();
		that.drawText();
	};
	
	that.newComment = function (evt, body, locElem, share, parentId, buttonObj, socialIconsElem){
		//Refire the event, adding the comment parent id.
		that.events.fire(evt, body, locElem, share, data.comment.id, buttonObj, socialIconsElem);
	};		
	return that;
};
