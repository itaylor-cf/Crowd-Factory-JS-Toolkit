CF.widget.ListAdd = function (targetElem, template, templateEngine, data, opts){
	opts.privacyEnabled = CF.coerce(opts.privacyEnabled, "bool", true);
	opts.privacyText = opts.privacyText || "Privacy";
	opts.privacyUrl = opts.privacyUrl || "http://pop.to/privacy.html";
	opts.entityId = CF.insight.getEntityId(opts.entityId);
	opts.privacyEnabled = CF.coerce(opts.privacyEnabled, "bool", false);
	opts.widgetHeadlineText = opts.widgetHeadlineText || "Sign in to save as a favorite";
	opts.noItemsMsg = "There are no items in your list.";
	
	var that = CF.widget.BaseInsightEntityWidget(targetElem,template, templateEngine, data, opts);
	that.getDefaultTemplateBody = function ()
	{
			return "\
				<div class='cf_listadd'>\
					[%CF.log(user, opts)%]\
					<div class='cf_if' binding='!user && opts.imgBefore'>\
						<img class='cf_imgButton cf_imgBefore' cf_src='[% opts.imgBefore %]'>\
					</div>\
					<div class='cf_if' binding='user && opts.imgAfterUnsaved && !inList'>\
						<img class='cf_imgButton cf_imgAfterUnsaved' cf_src='[% opts.imgAfterUnsaved %]'/>\
					</div>\
					<div class='cf_if' binding='user && opts.imgAfterSaved && inList'>\
						<img class='cf_imgButton cf_imgAfterSaved' cf_src='[% opts.imgAfterSaved %]'/>\
					</div>\
					<div class='cf_if' binding='user && opts.imgAfterArrow'>\
						<img class='cf_imgButton cf_imgAfterArrow' cf_src='[% opts.imgAfterArrow %]'/>\
					</div>\
					<div class='cf_login_holder'></div>\
				</div>";		
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subwidgets) {
		that.superBindEvents(elem, subwidgets);
		that.loginHolder = elem.find(".cf_login_holder");
		that.imgBeforeElem = elem.find(".cf_imgBefore").click(that.saveClicked);
		that.imgAfterUnsavedElem = elem.find(".cf_imgAfterUnsaved").click(that.saveClicked);
		that.imgAfterSavedElem = elem.find(".cf_imgAfterSaved");
		that.imgAfterArrowElem = elem.find(".cf_imgAfterArrow").click(that.showListClicked);
		that.loginController.setElems(that.loginHolder, that.imgBeforeElem);
	};
	that.saveClicked = function (){
		that.verifyLogin(that.saveToList, null, null, opts);
	};
	that.saveToList = function (){
		CF.context.api_v1.list_entity_add(that.reload, opts.entityId, opts.category, opts.name, {sequence:Math.round((new Date().getTime()/1000) * -1)});
	};
	that.showListClicked = function (){
		var title = that.buildProviderHeader();
		var body= CF.build(".cf_list", 
				[
				 that.listBody = CF.build(".cf_listBody"),
				 CF.build(".cf_pagerControls", [
                        CF.build(".cf_prev_page", "Previous"),
      				    CF.build(".cf_next_page", "Next"),
      				    CF.build(".cf_clear")
				   ])
				 ]);
		
		var hb = CF.Hoverbox(that.loginHolder, title, body, null, {className:"cf_listdialog", pointTo:that.imgAfterArrowElem});
		that.pager = CF.widget.Pageable({max_return:5});
		that.pager.bindPagerEvents(body);
		that.pager.pageChanged = that.pageChanged;
		that.pager.pageChanged();
	};
	that.fetchEntity = function (){
		CF.context.api_v1.list_entity_exists(that.listExists, opts.entityId, opts.category, opts.name);
		CF.context.api_v1.entity_get(that.verifyEntity, opts.entityId);
	};
	that.entityFetched = function (){
		that.entityFinished = true;
		if(that.listFinished){
			that.draw();
		}
	};
	that.pageChanged = function (){
		CF.context.api_v1.list_get(that.listFetched, opts.category, opts.name, that.pager.toParams());
	};
	that.updateListBody = function (items){
		if(items.length == 0){
			that.listBody.html(".cf_noItems", opts.noItemsMsg);
		}
		var list = CF.build(".cf_listBox", CF.collect(items, function (i, li){
			var e = li.ExternalEntity;
			if(e){
				var share, del;
				var listItem = CF.build(".cf_listItem", 
						[
						 CF.build(".cf_description", [
							 CF.build(".cf_date", ["Added ", CF.friendlyDate(li.created)]),
							 CF.build(".cf_title", CF.text.simpleTruncate(e.title, 40))
						 ]),
						 CF.build(".cf_actionIcons", 
								 [
								  share = CF.build(".cf_share", {title:"Share"}),
								  del = CF.build(".cf_delete", {title:"Remove"})
						         ]),
						 CF.build(".cf_clear")
						 ]).click(CF.curry(that.visitEntity, e)).hover(that.hoverIn, that.hoverOut);
				share.click(CF.curry(that.shareClicked, e, listItem));
				del.click(CF.curry(that.deleteClicked, e, listItem));
				return listItem;
			}
		}));
		that.listBody.html(list);
	};
	that.hoverIn = function (){
		cf_jq(this).addClass("cf_hover");
	};
	that.hoverOut = function (){
		cf_jq(this).removeClass("cf_hover");
	};
	that.listFetched = function (list, error){
		if(error){
			list = {items:[]};
		}
		that.pager.updatePager(list.items, list.item_count);
		that.updateListBody(list.items);
	};
	that.shareClicked = function (entity, li, evt){
		evt.stopPropagation();
		that.shareEntity = entity;
		that.performShare();
	};
	that.performShare = function (){
		var provider = that.getUsersFirstSupportedProvider().provider;
		that.loginController.setElems(that.loginHolder, that.imgAfterArrowElem);
		that.loginController.startFlow(that.shareAction, that.performSyndication, {entityTitle:that.entity.title, provider:provider}, opts);		
	};
	that.shareAction = function (){
		that.loginController.nextStage();
	};
	that.performSyndication = function (state){
		var params = state.syndParams;
		params.cflog_widgetname = opts.widgetName;
		that.syndicate(state.provider, opts.widgetName, that.shareEntity.uid, that.shareEntity.url, params);
		that.loginController.nextStage();
	};
	that.deleteClicked = function (entity, li, evt){
		evt.stopPropagation();
		CF.context.api_v1.list_entity_remove(that.pager.pageChanged, entity.uid, opts.category, opts.name);
	};
	that.visitEntity = function (entity){
		location.href = entity.url;
	};
	that.onReload = function()
	{
		that.onStart();
	};
	that.listExists = function (result, error){
		that.listFinished = true;
		that.inList = result;
		if(that.entityFinished){
			that.draw();
		}
	};
	that.getData = function (){
		return {opts:opts, user:CF.context.auth_user, inList:that.inList};
	};

	that.buildProviderHeader = function (){
		var prov = that.getUsersFirstSupportedProvider();
		var networkIconContainer, imgArrow, title, titleLabel;
		var imageDir = CF.config.current.scriptHost+"/images/";
		
		var changeAccount = function (){
			CF.login.silentLogout();
			that.loginController.setElems(that.loginHolder, that.imgAfterArrowElem);
			that.verifyLogin(that.showListClicked, null, null, opts);
		};
		var providerChanged = function(provider){
			CF.login.silentLogout();
			that.loginController.setElems(that.loginHolder, that.imgAfterArrowElem);
			that.verifyLogin(that.showListClicked, null, provider, opts);
		};
		
		var toggleNetworkIcons = function (){
			var curSrc = imgArrow.attr("src");
			if(networkIconContainer.is(":visible")){
				imgArrow.attr("src", curSrc.replace("-down", "-side"));
				networkIconContainer.hide();
			}
			else{
				imgArrow.attr("src", curSrc.replace("-side", "-down"));
				networkIconContainer.show();
			}
		};
		
		var excludeIcons = prov.isEmail ? "email" : prov.provider;
		
		var icons = "";
		if(!opts.singleProvider){
			var icons = that.getProviderIcons(providerChanged, excludeIcons, true, null, true);
		}
		var avatarUrl = "";
		var u= CF.context.auth_user;
		var userName = "";
		var className = prov.className;
		if(u && u.profile_photo_url){
			avatarUrl = u.profile_photo_url;
			className ='cf_avatar_tiny';
			userName = u.display_name;
		}
		var avatar;
		var titleString = userName || prov.title;
		title = CF.build(".cf_title_wrap", [
	            	titleLabel = CF.build(".cf_title_label."+ className, [
	                  avatar = CF.build("img.cf_avatar", {src:avatarUrl}),
	                  imgArrow = CF.build("img.cf_arrow", {src:imageDir+"network-arrow-side.png"}),
	   		          titleText = CF.build("span.cf_title_text", titleString)]),
	   		        networkIconContainer = CF.build(".cf_network_icon_container", 
	   						CF.build(".cf_synd_icons", [
	   						   icons,
	   						   CF.build("a.cf_notyou", "Change account").click(changeAccount),
	   						   CF.build(".cf_clear")]
	   						  ))
	   		     ]);
		if(!avatarUrl){
			avatar.hide();
		}
		titleLabel.click(toggleNetworkIcons);
		return title;
	};
	
	
	
	return that;
};
