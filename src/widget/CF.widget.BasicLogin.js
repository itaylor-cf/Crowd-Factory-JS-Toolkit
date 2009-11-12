//=  require <CF.widget.SimpleWidget.js>
//=  require <CF.login.js>
//=  require <CF.context.js>

/**
 * @class
 * A class for simple username / password based login to the CF platform.
 * 
 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_loginBtn Attempts to log the user in with the username and password specified by the values of the #cf_username and #cf_password elements.
 * @behavior {click} .cf_logoutBtn  Attempts to log the currently logged in user out.
 * @behavior {keydown#enterKey} #cf_password Attempts to log the user in when the enter key is pressed in the #cf_password element.
 * 
 */

CF.widget.BasicLogin = function (targetElem, template, templateEngine, data, opts)
{
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
					Logged in as [% authUser.display_name %] \
					<br/> \
					<a class='cf_logoutBtn'>Click here to log out</a> \
					<div class='cf_else cf_loginForm'> \
						<div class='cf_formRow'> \
							<label for='cf_username'>Username:</label> \
							<input name='cf_username' id='cf_username' type='text' /> \
							<div class='cf_clear'> </div>\
						</div> \
						<div class='cf_formRow'> \
							<label for='cf_password'>Password:</label> \
							<input type='password' name='cf_password' id='cf_password'/> \
							<div class='cf_clear'> </div>\
						</div>\
						<div class='cf_loginError'> \
							<div class='cf_if' binding='error'> \
								Incorrect username or password. \
							</div>\
						</div>\
						<div class='cf_buttonRow'> \
							<button type='button' class='cf_loginBtn'>Login</button>\
						</div>\
					</div>\
		 	</div>";
	};
	that.bindEvents = function (elem, subWidgets)
	{
		that.usernameElem = elem.find("#cf_username");
		that.passwordElem = elem.find("#cf_password").keypress(CF.enterPressed(that.processLogin));
		elem.find(".cf_loginBtn").click(that.processLogin);
		elem.find(".cf_logoutBtn").click(that.processLogout);
	};
	that.processLogout = function ()
	{
		//Hand off to the CF.login helper methods
		CF.login.logout();
	};
	that.processLogin = function ()
	{
		that.error = null;
		CF.login.events.listen("login_fail", that.setLoginError);
		CF.login.login(that.usernameElem.val(), that.passwordElem.val());
	};
	that.setLoginError = function (evt, error)
	{
		that.error = error;
		that.reload();
	};
	that.getData = function ()
	{
		return {authUser:CF.context.auth_user, error: that.error};
	};
	return that;	
};