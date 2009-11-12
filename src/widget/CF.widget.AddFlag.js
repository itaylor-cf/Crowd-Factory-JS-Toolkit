//= require <CF.widget.SimpleWidget.js>
/**
 * @class
 * A class that provides a simple UI for flagging inappropriate content.
 * It allows the user to enter a reason for flagging the content and works with 
 * activityevent, board, comment, entity, and user objects.
 * 
 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_add_flag Shows the cf_add_flag_popup element.
 * @behavior {click} .cf_add_flag_cancel Hides the cf_add_flag_popup element if it is shown.
 * @behavior {click} .cf_add_flag_send Sends a flag for the current object.  Uses the value of the text field .cf_add_flag_txt as the desc parameter.  On completion, shows the cf_flag_add_msg element and hides the cf_add_flag_popup element and fires the flag_created event.
 * 
 */
CF.widget.AddFlag = function (targetElem, template, templateEngine, data, opts)
{
	 /**
	 * @name CF.widget.AddFlag#flag_created
	 * @event
	 * @description
	 * Fired when the when a flag has been created. 
	 * @param {Object} data The data parameter passed in to the widget, it is the identifier of the object that was flagged.
	 * @param {CF.widget.Entity} The current widget object.
	 */
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	if(!data)
	{
		CF.error("The data parameter is required and must be the identifier for a flaggable object");
	}
	opts = opts || {};
	if (!CF.inList(opts.type, ["activityevent", "board", "comment", "entity", "user"]))
	{
		CF.error("Invalid or missing type option");
	}
	that.onReload = function ()
    {
    	that.draw();
	};
	that.onStart = function ()
	{
		that.draw();
	};
	that.getDefaultTemplateBody = function ()
	{
		return " \
			<div class='cf_if' binding='authUser'>\
				<a class='cf_add_flag'>Flag as Inappropriate</a>\
				<div class='cf_add_flag_popup' style='display:none;'>\
					<div class='cf_flag_create'>\
						<em>Reason for flagging:</em>\
						<textarea class='cf_add_flag_txt'>I find this content objectionable.</textarea>\
						<div class='cf_add_flag_button_row'>\
							<button type='button' class='cf_add_flag_cancel'>Cancel</button>\
							<button type='button' class='cf_add_flag_send'>Raise the Flag</button>\
						</div>\
					</div>\
					<div class='cf_flag_added_msg'>\
						<em>Your flag has been raised.</em><br/>\
						A moderator will examine the content.\
					</div>\
				</div>\
			</div>\
			";
	};
	that.showPopup = function ()
	{
		if (! that.isShown)
		{
			that.isShown =true;
			that.addFlagPopup.slideDown(function () {that.selectTxt();});
		}
		if (that.flagSent)
		{
			that.flagComplete();
		}
	};
	that.hidePopup = function ()
	{
		if (that.isShown)
		{
			that.addFlagPopup.slideUp(function(){that.isShown = false;});
		}
	};
	that.selectTxt = function ()
	{
		that.addFlagTxt.select();
	};
	that.bindEvents = function (elem, subWidgets)
	{
		that.addFlag = elem.find(".cf_add_flag").click(that.showPopup);
		that.addFlagPopup = elem.find(".cf_add_flag_popup");
		that.addFlagTxt = elem.find(".cf_add_flag_txt");
		that.addFlagCancel = elem.find(".cf_add_flag_cancel").click(that.hidePopup);
		that.addFlagSend = elem.find(".cf_add_flag_send").click(that.sendFlag);
		that.addFlagButtonRow = elem.find(".cf_add_flag_button_row");
		that.flagAddedMsg = elem.find(".cf_flag_added_msg").hide();
		that.flagCreate = elem.find(".cf_flag_create");
	};
	that.sendFlag = function ()
	{
		var t = opts.type;
		
		CF.context.api_v1["flag_"+t](that.flagComplete, data, {desc:(that.addFlagTxt.val() || "")});
	};
	that.flagComplete= function (res, error)
	{
		if(!error)
		{
			that.events.fire("flag_created", data, that);
		}
		that.flagSent = true;
		that.flagCreate.hide();
		that.flagAddedMsg.fadeIn(function (){
			setTimeout(that.hidePopup, 5000);
		});
	};
	that.getData = function ()
	{
		return {authUser:CF.context.auth_user, opts:opts};
	};
	return that;	
};