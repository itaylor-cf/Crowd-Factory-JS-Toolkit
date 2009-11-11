//=  require <CF.widget.SimpleWidget.js>
//=  require <CF.context.js>
/**
 * @class
 * A widget for displaying a captcha that gates access to the RegForm 
 * 
 * 
 * @extends CF.widget.SimpleWidget
 */

CF.widget.CaptchaLogin = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	var defaultOpts = {
		scriptSrc:"http://api.recaptcha.net/js/recaptcha_ajax.js",
		key:"6Lc-fAcAAAAAAJhL3j6CpAswfjvdgfaNood9j5n7",
		theme:"red"	
	};
	opts = CF.extend(defaultOpts, opts);
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.onReload = function ()
    {
		Recaptcha.destroy();
		that.draw();
	};
	that.onStart = function ()
	{
		if(!window.Recaptcha)
		{
			jQuery.getScript(opts.scriptSrc, that.draw);
		}
		else
		{that.draw();}
	};
	that.onRemove = function ()
	{
		Recaptcha.destroy();
	};	
	that.getDefaultTemplateBody = function ()
	{
		return "\
				<div class='cf_captcha_body'>\
					<h2>Prove your humanity</h2>\
					<p>In order to create an account, you must first prove that you are not a robot.</p>\
					<p>Please solve this captcha.</p>\
					<div id='recaptcha_div'></div>\
					<div class='cf_captcha_msg'></div>\
					<button class='cf_captcha_cancel' type='button'>Cancel</button>\
					<button class='cf_captcha_submit' type='button'>Submit Answer</button>\
				</div>\
				";
	};
	that.bindEvents = function (elem, subWidgets)
	{
		that.captchaBody = elem.find(".cf_captcha_body");
		that.captchaMsg = elem.find(".cf_captcha_msg");
		that.captchaSubmit = elem.find(".cf_captcha_submit").click(that.submitCaptcha);
		that.captchaCancel = elem.find(".cf_captcha_cancel").click(that.cancelCaptcha);
		Recaptcha.create(opts.key,
			"recaptcha_div", {
			   theme: opts.theme,
			   callback: Recaptcha.focus_response_field
			});
	};
	that.cancelCaptcha = function ()
	{
		/**
		 * @name CF.widget.CaptchaLogin#captcha_cancel
		 * @event
		 * @description
		 * Fired when the user has canceled their captcha attempt.
		 * @param {CF.widget.CaptchaLogin} The current widget object.
		*/
		that.events.fire("captcha_cancel", that);
		that.captchaBody.fadeOut();
		Recaptcha.destroy();
	};
	that.submitCaptcha = function ()
	{
		that.captchaMsg.html("");
		var token = Recaptcha.get_challenge() + "|" + Recaptcha.get_response();
		CF.context.api_v1.loginreg_auth(that.tokenOk, token, "cf-captcha");
	};
	
	that.tokenOk = function (result, error)
	{
		if (error)
		{
			/**
			 * @name CF.widget.CaptchaLogin#captcha_incorrect
			 * @event
			 * @description
			 * Fired when the user has failed a captcha attempt.
			 * @param {Error} The error passed back from the captcha.
			 * @param {CF.widget.CaptchaLogin} The current widget object.
			*/
			that.events.fire("captcha_incorrect", error, that);
			var error = CF.build("div", "Incorrect answer.  Please try again.").hide();
			that.captchaMsg.append(error);
			Recaptcha.reload();
			error.fadeIn();
		}
		else
		{
			/**
			 * @name CF.widget.CaptchaLogin#captcha_success
			 * @event
			 * @description
			 * Fired when the user has passed a captcha attempt.
			 * @param {User} user The user that was created as a result of the captcha passing.
			 * @param {String} jsessionid The jsessionid of the newly logged-in user.
			 * @param {CF.widget.CaptchaLogin} The current widget object.
			*/
			that.events.fire("captcha_success", result.user, result.jsessionid || result.cf_token, that);
		}
	};

	return that;	
};