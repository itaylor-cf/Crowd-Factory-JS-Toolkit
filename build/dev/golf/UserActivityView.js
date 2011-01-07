//= require <CF.widget.BaseInsightEntityWidget.js>

CF.widget.UserActivityView = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	if (!opts.widgetStyle){
		CF.error("widgetStyle is a required option");
		return null;
	}
	
	var user;
	if (opts.user || CF.context.auth_user) {
		user = opts.user || CF.context.auth_user;
	}
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
	that.createTestActivity = function () {
		CF.log("opts ", opts);
		var params = {
				category:	 	"test",
				performerid:	user.external_id,
				performertype: 	"user",
				participanttype: "entity",
				participantid: opts.entityId,
				message: 		"Test message"
		};
		// TODO: does the entity URL go anywhere, or do we have to pull that separately?
		CF.log("params ", params);
		//CF.context.api_v1.activityevent_create(that.getActivity, params);
		that.getActivity();
	};
	
	
	that.getActivity = function() {
		// TODO: possible to sort by date in this?
		CF.context.api_v1.activityevent_get(that.viewActivity, {activityfilter:"performer", id:user.external_id, idtype:"user"})
	};
	that.viewActivity = function(result, error){
		//CF.log("result ", result);
		CF.log("1");
		if (error || result == null){
			// couldn't find user
			CF.error("error",error);
		}
		// for testing until I can pull real data
//		var returnedData = [{date:"01/04/2010", ms:"commented on", entityTitle:"Wazool!", entityUrl:"http://popto.com/wazool"},
//		                    {date:"03/14/2010", ms:"shared", entityTitle:"Sweet Zombie Jesus", entityUrl:"http://popto.com/gablug"},
//		                    {date:"12/04/2010", ms:"rated", entityTitle:"Don't touch me there", entityUrl:"http://popto.com/snorksnork"}];
		//result = returnedData;
		// Create rows for table
		CF.log("result.length: " + result.length);
		var i;
		var rdLen = result.length;
		CF.log("rdLen: " + rdLen);
		var rows = [];
		var rowClasses = ".cf_activity_view_row";
		for (i=0; i<rdLen; i+=1) {
//			var ms = user.firstName +  " " + result[i].ms + " ";
			var rowContent = [
			                  CF.build(".cf_activity_view_cell", [
			                                                      user.firstName +  " " + result[i].message + " ",
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
//		that.elem.find(".cf_activity_view_row")
//			.mouseover(function(){ that.mouseoverRow(cf_jq(this)); })
//			.mouseout(function(){ that.mouseoutRow(cf_jq(this)); });
	};
	that.logInUser = function() {
		that.loginController.setElems(that.elem, that.elem);
		that.loginController.startFlow(that.loggedIn, null, {});
	};
	that.loggedIn = function() {
		that.loginController.nextStage();
		if (that.link){
			that.title.insertAfter(that.link);
			that.link.remove();
		}
//		that.getActivity();
		that.createTestActivity();
	};
	return that;
	
};