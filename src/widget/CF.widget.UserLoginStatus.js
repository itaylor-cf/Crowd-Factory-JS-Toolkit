//= require <CF.widget.SimpleWidget.js>
//= require <CF.login.js>
//= require <CF.modal.js>

/**
 * @class
 * A widget that displays the current user's display name or a link to login that opens a login form in a 
 * modal.  Supports multiple types of login, currently: 'cf_basic', 'rpx', 'cf_captcha'.
 * 
 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_logout_hover Displays the .cf_logout_popup, starts a hover listener for the logout popup. 
 * @behavior {click} .cf_logoutBtn  Attempts to log the currently logged in user out.
 * @behavior {click} .cf_loginBtn Opens the .cf_login_modal which will display the login forms for the configured options.loginTypes
 * 
 */

CF.widget.UserLoginStatus = function (targetElem, template, templateEngine, data, opts)
{
	
	var defaultOpts = {
				loginTypes:["cf_basic"] // currently supported ['cf_basic', 'rpx', 'cf_captcha']
	};
	opts = CF.extend(defaultOpts, opts);
	
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
		
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
	<div class='cf_current_user cf_logout_hover'><a>[% authUser.display_name || 'unknown user' %]</a>\
		<div class='cf_logout_popup' style='display:none;'>\
			<div><a class='cf_logoutBtn'>Logout</a></div>\
			<div class='cf_if' rendertag='true' binding='opts.showLinked'>\
				<a class='cf_linkedAcctsBtn'>Linked Accounts</a>\
				<div class='cf_noprocess cf_linkedAcctTmpl' style='display:none'>\
					<div>\
						<h2>Your Linked Accounts</h2>\
						<div class='cf_widgetLoader' widgettype='CF.widget.SyndicationManager'></div>\
					</div>\
				</div>\
			</div>\
		</div>\
	</div>\
	<div class='cf_else'> \
		<a class='cf_loginBtn'>Login</a>\
		<div class='cf_noprocess cf_login_modal' style='display:none;'>\
			<div class='cf_for' rendertag='false' binding='opts.loginTypes'>\
				<div class='cf_item' rendertag='false'>\
					<div class='cf_choice cf_logintype' binding='item'>\
						<div class='cf_condition' eq_s='cf_basic'>\
							<div class='cf_widgetLoader' widgettype='CF.widget.BasicLogin' options='parent.opts'></div>\
						</div>\
						<div class='cf_condition' eq_s='cf_captcha'>\
							<div class='cf_widgetLoader' widgettype='CF.widget.CaptchaShowLink' options='parent.opts'></div>\
						</div>\
						<div class='cf_condition' eq_s='rpx'>\
							<div class='cf_widgetLoader' widgettype='CF.widget.RPXLogin' options='parent.opts'></div>\
						</div>\
					</div>\
				</div>\
			</div>\
		</div>\
	</div>\
</div>";
	};
	that.showPopup = function ()
	{
		that.logoutPopup.fadeIn();
	};
	that.hoverOut = function()
	{
		that.logoutPopup.fadeOut();
	};
	that.bindEvents = function (elem, subWidgets)
	{
		that.logoutPopup = elem.find(".cf_logout_popup");
		elem.find(".cf_logoutBtn").click(that.processLogout);
		that.logoutHover = elem.find(".cf_logout_hover").click(that.showPopup);
		CF.effect.Hover(that.logoutPopup, null, that.hoverOut, 1);
		that.loginModal = elem.find(".cf_login_modal");
		elem.find(".cf_loginBtn").click(that.showModal);
		if (opts.showLinked)
		{
			elem.find(".cf_linkedAcctsBtn").click(that.showLinkedAccts);
			that.linkedAcctTmpl = elem.find(".cf_linkedAcctTmpl");
		}
	};
	that.showLinkedAccts = function()
	{
		CF.modal.events.listen("modal_hidden", CF.context.reload);
		CF.modal.show(that.linkedAcctTmpl.html());		
	};
	that.hideLinkedAccts = function ()
	{
		if (that.linkedAcctsElem)
			that.linkedAcctsElem.hide();
	};
	that.showModal = function ()
	{
		CF.login.events.listen("login_success", CF.modal.hide);
		CF.modal.show(that.loginModal.clone().removeClass("cf_noprocess"), that.getData(), {width:450});
	};
	that.processLogout = function ()
	{
		CF.login.logout();
	};
	that.getData = function ()
	{
		return {authUser:CF.context.auth_user, opts:opts};
	};
	return that;	
};