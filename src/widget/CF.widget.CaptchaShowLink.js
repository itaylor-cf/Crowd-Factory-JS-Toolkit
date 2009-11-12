//= require <CF.widget.SimpleWidget.js>
//= require <CF.modal.js>

/**
 * @class
 * Opens the CF CaptchaLogin widget in a modal when activated. * 
 * @behavior {click} .cf_captcha_start Starts the captcha modal (as designated by the cf_captcha_modal class) in a new modal. Listens for modal completion and calls CF.login.showRegForm when done.
 * @extends CF.widget.SimpleWidget
 * 
 */

CF.widget.CaptchaShowLink = function (targetElem, template, templateEngine, data, opts)
{
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);

	that.getDefaultTemplateBody = function ()
	{
		return "<a class='cf_captcha_start'>Register for an account!</a>\
				<div class='cf_captcha_modal cf_noprocess cf_widgetLoader' widgettype='CF.widget.CaptchaLogin' options='opts'></div>\
			";
	};
	that.bindEvents = function (elem, subWidgets)
	{
		elem.find(".cf_captcha_start").click(that.startCaptcha);
		that.captchaModal = elem.find(".cf_captcha_modal");		
	};
	that.fireSuccess = function(evt, user, sessionToken, widg){
		CF.login.showRegForm({
			user: user,
			requirePass: true,
			provider: "cf-captcha"
		}, sessionToken);
	};
	that.startCaptcha = function ()
	{
		var elem = that.captchaModal.clone().removeClass("cf_noprocess");
		var subWidgets = CF.modal.show(elem, {opts:opts});
		jQuery.each(subWidgets, function (i, o){
			if (o.type && o.type == "CF.widget.CaptchaLogin") {
				o.widget.events.listen("captcha_success", that.fireSuccess);
				o.widget.events.listen("captcha_cancel", CF.modal.hide);
			}
		}
		);
	};
	return that;	
};