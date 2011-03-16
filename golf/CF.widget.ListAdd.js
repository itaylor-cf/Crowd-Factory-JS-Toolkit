CF.widget.ListAdd = function (targetElem, template, templateEngine, data, opts){
	opts.privacyEnabled = CF.coerce(opts.privacyEnabled, "bool", true);
	opts.privacyText = opts.privacyText || "Privacy";
	opts.privacyUrl = opts.privacyUrl || "http://pop.to/privacy.html";
	opts.entityId = CF.insight.getEntityId(opts.entityId);
	opts.privacyEnabled = CF.coerce(opts.privacyEnabled, "bool", false);
	opts.widgetHeadlineText = opts.widgetHeadlineText || "Sign in to save as a favorite";
	opts.noItemsMsg = opts.noItemsMsg || "There are no items in your list.";
	opts.name = opts.name || "favorites";
	opts.category = CF.coerce(opts.category, "int", 0);
	
	var that = CF.widget.BaseInsightEntityWidget(targetElem,template, templateEngine, data, opts);
	that.getDefaultTemplateBody = function ()
	{
			return "\
				<div class='cf_listadd'>\
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
	};
	that.saveClicked = function (){
		that.loginController.setElems(that.loginHolder, that.imgBeforeElem);
		var state=that.loginController.manualStartFlow({}, opts);
		var actionFx = CF.curry(that.beforeAction, that.saveToList);
		that.loginController.addStage("actionFx", actionFx);
		that.loginController.addStage("RPXLogin");
		if(!state.provider){
			that.loginController.addStage("SignIn");
		}
		that.loginController.nextStage();		
	};
	that.saveToList = function (){
		CF.context.api_v1.list_entity_add(that.reload, opts.entityId, opts.category, opts.name, {sequence:Math.round((new Date().getTime()/1000) * -1)});
	};
	that.showListClicked = function (){
		that.loginController.setElems(that.loginHolder, that.imgAfterArrowElem);
		var state = that.loginController.manualStartFlow({currentEntity:that.entity}, opts);
		that.loginController.registerStageFx("actionFx", that.reloadAndShowList);
		that.loginController.registerStageFx("syndicationFx", that.performSyndication);
		that.loginController.addStage("ListViewer");
		that.loginController.nextStage();
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
	that.performSyndication = function (state){
		var params = state.syndParams;
		params.cflog_widgetname = opts.widgetName;
		that.syndicate(state.provider, opts.widgetName, state.shareEntity.uid, state.shareEntity.url, params);
		that.loginController.nextStage();
	};
	that.onReload = function()
	{
		that.listFinished =false;
		that.entityFinished = false;
		that.fetchEntity();
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

	that.reloadAndShowList = function (){
		that.events.listen("widget_drawn", function (){
			that.loginController.setElems(that.loginHolder, that.imgAfterArrowElem);
			that.loginController.nextStage();
		}, true);
		that.reload();	
	};
	
	that.buildProviderHeader = function (){
		var prov = that.getUsersFirstSupportedProvider();
		var provider = prov != null ?  prov.provider : null;
		var networkIconContainer, imgArrow, title, titleLabel;
		var imageDir = CF.config.current.scriptHost+"/images/";
		var provTitle = prov != null ? prov.title : "";
		var titleString = CF.context.auth_user != null ? CF.context.auth_user.display_name : provTitle;
		return;
	};
	return that;
};

CF.insight.StageBuilder("ListViewer", function (state, controller, opts){
	var that = CF.insight.BaseStage(state, controller, opts);
	that.getClassName = function (){return "cf_listdialog";};
	that.fetchData = function (dataFetchCompleteFx){
		if(CF.context.auth_user){
			dataFetchCompleteFx();
		}else{
			controller.clearStages();
			//reload the component, User is no longer signed in.
			controller.addStage("actionFx");
			controller.nextStage();
		}
	};
	
	var titleTxt = opts.pleaseWaitTitle || "Processing your request...";
	var bodyTxt = opts.pleaseWaitBody || "Please wait while we process your request.";
	that.getTitle = function (){
		return CF.insight.selectProviderHeader(state,controller,opts,that,CF.context.auth_user.display_name, ["ListViewer", "actionFx", "RPXLogin"]);
	};
	that.updateListBody = function (items){
		if(items.length == 0){
			that.listBody.html(CF.build(".cf_noItems", opts.noItemsMsg));
		} else {
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
		}
	};
	that.pageChanged = function (){
		CF.context.api_v1.list_get(that.listFetched, opts.category, opts.name, that.pager.toParams());
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
		state.shareEntity = entity;
		state.entityTitle = entity.title;
		controller.addStage("syndicationFx");
		controller.addStage("ShareResolver");
		controller.nextStage(state);
	};
	that.getBody = function (){
		var body= CF.build(".cf_list", 
				[
				 that.listBody = CF.build(".cf_listBody"),
				 CF.build(".cf_pagerControls", [
                        CF.build(".cf_prev_page", "Previous"),
      				    CF.build(".cf_next_page", "Next"),
      				    CF.build(".cf_clear")
				   ])
				 ]);
		that.pager = CF.widget.Pageable({max_return:5});
		that.pager.bindPagerEvents(body);
		that.pager.pageChanged = that.pageChanged;
		that.pager.pageChanged();
		return body;
	};
	that.checkState = function (){
		return true;
	};

	that.deleteClicked = function (entity, li, evt){
		evt.stopPropagation();
		var removeCompleteFx = that.pager.pageChanged;
		if(state.currentEntity && entity.uid == state.currentEntity.uid){
			controller.addStage("ListViewer");
			controller.addStage("actionFx");
			controller.nextStage();
		}
		CF.context.api_v1.list_entity_remove(removeCompleteFx, entity.uid, opts.category, opts.name);
	};

	that.visitEntity = function (entity){
		location.href = entity.url;
	};
	return that;	
});
