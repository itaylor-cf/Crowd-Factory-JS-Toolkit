//= require <CF.widget.BaseInsightEntityWidget.js>

CF.widget.UserActivityView = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	if (!opts.widgetStyle){
		CF.error("widgetStyle is a required option");
		return null;
	}
	
	var user = opts.user || CF.context.auth_user;
	
	opts.entityId = opts.entityId  || CF.insight.getEntityId();
	//opts.entityId += "-activity-view";
	
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.loginController = CF.insight.LoginController();
	that.title = CF.build(".cf_see_activity", "Recent Activity");
	
	that.onReload = function()
	{
		that.onStart();
	};
	
	that.getDefaultTemplateBody = function ()
	{
		if (user != undefined) {
			return that.title;
		} else {
			return "<a class='cf_no_user'>Please log in to view your activity</a>";
		}
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subwidgets)
	{
		that.elem = elem;
		that.superBindEvents(elem, subwidgets);
		if ( elem.find(".cf_see_activity").length > 0) {
			that.loggedIn();
		} else {
			that.link =  elem.find(".cf_no_user");
			that.link.click(that.logInUser);
		}
	};
	that.mouseoverRow = function (rowObj){
		rowObj.addClass("cf_alt_bg");
	};
	that.mouseoutRow = function (rowObj){
		rowObj.removeClass("cf_alt_bg");
	};
//	that.createTestActivity = function () {
//		CF.log("opts ", opts);
//		var params = {
//				category:	 	"test",
//				performerid:	user.external_id,
//				performertype: 	"user",
//				participanttype: "entity",
//				participantid: opts.entityId,
//				message: 		"Test message"
//		};
//		// TODO: does the entity URL go anywhere, or do we have to pull that separately?
//		CF.context.api_v1.activityevent_create(that.getActivity, params);
//	};
	
	that.getActivity = function() {
		CF.context.api_v1.activityevent_get(that.viewActivity, {activityfilter:"performer", id:user.external_id, idtype:"user"});
	};
	that.viewActivity = function(result, error){
		if (error || result == null){
			CF.error("error",error);
		}
		var i;
		var rdLen = result.length;
		var rows = [];
		var rowClasses = ".cf_activity_view_row";
		for (i=0; i<rdLen; i+=1) {
			var rowContent = [
			                  CF.build(".cf_activity_view_cell", [
			                                                      user.display_name +  " " + result[i].message + " ",
			                                                      CF.build("a[href="+result[i].participant.ExternalEntity.url+"]", result[i].participant.ExternalEntity.title)
			                                                      ]),
                              CF.build(".cf_activity_view_cell.cf_date_long", CF.friendlyDate(result[i].created))];
			if (i == rdLen-1){
				rowClasses += ".cf_activity_row_last";
			}
			rows.push( CF.build(rowClasses, rowContent));
		}
		
		// Create and display list
		that.activityList = cf_jq(CF.build(".cf_activity_view",rows));	
		that.activityList.insertAfter(that.title);
		
		that.activityList.appendTo(targetElem);
		that.activityList.slideDown();
	};
	that.logInUser = function() {
		that.loginController.setElems(that.elem, that.elem);
		var state=that.loginController.manualStartFlow({}, opts);
		that.loginController.addStage("actionFx", that.loggedIn);
		that.loginController.addStage("RPXLogin");
		if(!state.provider){
			that.loginController.addStage("SignIn");
		}
		that.loginController.nextStage();
	};
	that.loggedIn = function() {
		that.loginController.nextStage();
		if (that.link){
			that.title.insertAfter(that.link);
			that.link.remove();
		}
		user = CF.context.auth_user;
		that.getActivity();
	};
	return that;
	
};