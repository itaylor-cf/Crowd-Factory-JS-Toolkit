/** 
 * @Class
 * The comment widget for insight.  Supports up to 3 deep threading, and an option to show or not show avatars.
 * 
 */

CF.widget.InsightStories = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.depth = CF.coerce(opts.depth, "int", 0);
	opts.avatars = CF.coerce(opts.avatars, "bool", false);
	opts.socialIcons = CF.coerce(opts.socialIcons, "array", []);
	opts.deleteComments = CF.coerce(opts.deleteComments, "bool", false);
	opts.actionRequiredMsg = "Please post a comment to continue";
	opts.widgetHeadlineText = opts.widgetHeadlineText || "Sign in to comment and share:";
	if (!opts.widgetStyle){
		CF.error("widgetStyle is a required option");
		return null;
	}
	
	var entityIdPassed = opts.entityId;	
	var that = CF.widget.BaseInsightEntityWidget(targetElem, template, templateEngine, data, opts);
	if (!entityIdPassed){
		opts.entityId += "-story";
	}
	that = CF.widget.Pageable({}, that);
	
	that.onReload = function()
	{
		that.onStart();
	};
	
	that.getDefaultTemplateBody = function ()
	{
		that.defaultMsg = "Tell us briefly how Excel tables make life simpler for you...";
		return "\
		<div class='cf_stories'>\
				<div class='cf_commentheader cf_ms_arrow'>How others are using tables</div> \
				<div class='cf_commentList'>\
				<div class='cf_for' binding='comments'>\
					<div class='cf_item cf_comment [% (index == length -1) ? \"cf_last\" : \"\" %] cf_comment_depth0'> \
						<div class='cf_widgetLoader' widgetType='CF.widget.InsightStory' data='{comment:item}' options='CF.extend(parent.opts, {showReply:(item.posting_depth < parent.opts.depth)})'></div>\
					</div> \
					<div class='cf_item_alt cf_alt cf_comment [% (index == length -1) ? \"cf_last\" : \"\" %] cf_comment_depth0'>\
					<div class='cf_widgetLoader' widgetType='CF.widget.InsightStory' data='{comment:item}' options='CF.extend(parent.opts, {showReply:(item.posting_depth < parent.opts.depth)})'></div>\
					</div>\
				        <div class='cf_item_empty'> \
				         	<div class='cf_if' binding='pager.current != 1'>\
				               There are no comments on this page yet.  \
				               <div class='cf_else'>\
				               		No one has commented yet. \
				               </div>\
				            </div>\
				         </div> \
				    </div>\
				   </div>\
				<div class='cf_if' binding='pager.show'>\
					<div class='cf_pager'>\
						<button class='cf_prev_page cf_btn_small cf_button_green_small' type='button'>Previous</button> \
						<span class='cf_pagecount'>\
							Page [% pager.current %] of [% pager.pageCount %]\
						</span>\
						<button class='cf_next_page cf_btn_small cf_button_green_small' type='button'>Next</button>\
					</div>\
				</div>\
				<div class='cf_replyarea'>\
				<div class='cf_reply_container'>\
					<div class='cf_replyprompt cf_commentheader'>\
						Tell your Story\
					</div>\
					<div class='cf_reply_bounder'>\
						<div class='cf_char_holder' style='display:none;'>\
							<span class='cf_char_count'></span> letters remaining\
							<a class='cf_why_limit' style='display:none;'>why?</a>\
						</div>\
						<textarea class='cf_replybox' rows='' cols='' onfocus=\"if(this.value==this.defaultValue) {this.value='';}\" onblur=\"if(this.value=='') {this.value='"+that.defaultMsg+"';}\">"+that.defaultMsg+"</textarea>\
						<label class='cf_sharebox_lbl'><input type='checkbox' class='cf_sharecbx'/>Share this comment</label>\
						<div class='cf_errormsg'></div>\
					</div>\
					<div class='cf_btnrow'>\
						<div class='cf_btnPostComment'/>\
						<div class='cf_login_holder'/>\
					</div>\
				</div>\
			</div>\
		</div>\
		";		
	};
	that.countChars = function (evt){
		var v = that.replyBox.val();
		var c = that.charMax;
		var len = v.length;
		if(len > c){
			that.replyBox.val(v.substring(0,c));
			CF.text.setCursorPos(that.replyBox, c);
			len = c;
		}
		if(len == c + 1)
			evt.preventDefault();
		if(len < (c - 100))
			that.charHolder.hide();
		else{
			that.charHolder.show();
			var l = c - len;
			that.charCount.html(l.toString() + " ");			
		}	
		
		// Shorten textarea in IE by a single pixel to avoid right border disappearing (cws-2608)
		// Only do this once
		if (CF.isIE() && !that.w) {
			that.w = that.replyBox.outerWidth();
			that.replyBox.width(that.w-1);
		}
	};
	that.isSuckyBrowser = function ()
	{
		return CF.isIE6() || CF.isIE7() || CF.isIE8Quirks() || CF.isIE8Compat();
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subwidgets)
	{
		that.superBindEvents(elem, subwidgets);
		that.bindPagerEvents(elem);
		elem.find(".cf_signout").click(that.signOut);
		
		// for form
		that.errMsg= elem.find(".cf_errormsg");
		elem.find(".cf_signout").click(CF.login.logout);
		
		that.postBtn =  elem.find(".cf_btnPostComment").click(that.postComment);

		that.replyBox = elem.find(".cf_replybox");
		that.charMax = 10000;
		that.replyBox.keydown(that.countChars);
		that.charHolder = elem.find(".cf_char_holder");
		that.charCount = elem.find(".cf_char_count");
/* 		that.loginArea = elem.find(".cf_loginArea"); */

		var noShare = CF.coerce(CF.cookie.readCookie("CF_commentNoShare"), "bool", false);
		that.shareCbx = elem.find(".cf_sharecbx").attr('checked',!noShare);
		if(that.isSuckyBrowser())
		{
			that.charMax = 500;
			that.whyLimitElem = elem.find(".cf_why_limit").show().click(that.showWhyLimit);
		}
	};
	
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
			offset:that.getOffset(),
			max_return:that.getMaxReturn(),
			order:opts.order,
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
			that.updatePager(that.comments, that.commentCount);
			that.draw();
		}
	};
	that.pageChanged = function ()
	{
		that.getComments(that.entity);
	};
	that.postComment = function (){
		that.val = cf_jq.trim(that.replyBox.val());
		that.errMsg.html("");
		CF.log("that.val: " + that.val);
		if(!that.val || !that.val.length || that.val==that.defaultMsg){
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
		setTimeout(fade, 5000);
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
		var pager = {
				show: !(that.isFirstPage() && that.isLastPage()),
				current: that.getPageNum(),
				pageCount: that.getPageCount()
			};
		return {entity:that.entity, commentCount:that.commentCount || 0, opts:opts, 
			currentUser:CF.context.auth_user, comments:that.comments, pager:pager};
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
	
	that.getData = function (){
		data.opts = opts;
//		data.defaultAvatar = CF.config.current.scriptHost + "/images/default-avatar.png";
		data.currentUser = CF.context.auth_user;
		return data;
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
		that.reportBtn = elem.find(".cf_btnReport").click(that.reportClicked);
		that.replyBtn = elem.find(".cf_btnReply").click(that.replyClicked);
		that.formholder = elem.find(".cf_formholder");
		that.reportArea = elem.find(".cf_reportarea");
		that.deleteBtn = elem.find(".cf_btnDelete").click(that.deleteClicked);
	};
	that.deleteClicked = function (){
		that.events.fire("comment_deleted", data.comment.id, that.reportArea, that.deleteBtn);		
	};
	
	that.replyClicked = function () {
		var e= CF.build(".cf_widgetLoader", {widgetType:"CF.widget.InsightCommentPostForm"});
		that.replyBtn.hide();
		that.formholder.html(e);
		var postFormOpts = {};
		CF.extend(postFormOpts, opts);
		CF.extend(postFormOpts, {allowCancel:true, focus:true});
		var res = CF.widget.process(e, null, postFormOpts);
		if (res) {
			that.commentFormObj= res; 
			res.widget.start();
			res.widget.events.listen("commentform_newcomment", that.newComment);
			res.widget.events.listen("commentform_closed", that.closeCommentForm);
		}
	};
	
	that.newComment = function (evt, body, locElem, share, parentId, buttonObj, socialIconsElem){
		//Refire the event, adding the comment parent id.
		that.events.fire(evt, body, locElem, share, data.comment.id, buttonObj, socialIconsElem);
	};
	that.closeCommentForm = function ()
	{
		that.commentFormObj.widget.remove();//unlisten
		that.commentFormObj.targetElem.remove();//kick it out of DOM
		that.replyBtn.show();
	};
	
	that.reportClicked = function ()
	{	
		that.events.fire("comment_report_activated", data.comment, that.reportBtn, that.reportArea, that);
	};
	
		
	return that;
};
