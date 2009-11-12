//= require <CF.widget.SimpleWidget.js>
//= require <CF.widget.SyndicationMixin.js>
//= require <CF.login.js>
//= require <CF.context.js>

/**
 * @class
 * The widget for updating a user's profile over B2C.
 * This form works by convention that textual form fields (input, textarea) with an id that is prefixed with cf_ will have their
 * value sent as parameters to the rest/v1/loginreg/register function as the suffix of their id field.
 * 
 * The data field MUST be passed set to an object with a "provider" property that is set to the loginreg provider that is 
 * will be used to process the registration request.
 * 
 * @extends CF.widget.SimpleWidget
 * @extends CF.widget.SyndicationMixin
 */

CF.widget.RegForm = function(targetElem, template, templateEngine, data, opts){
	
	opts = CF.extend({syndicate:false, syndicationUrl:location.href, syndicationCategory:"registration"}, opts);
	
	if (!data.provider)
	{
		return null;
	}
	
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	CF.widget.SyndicationMixin(that);
	that.onReload = function(){
		that.draw();
	};
	that.onStart = function(){
		that.draw();
	};
	that.getDefaultTemplateBody = function(){
		return "<div class='cf_regform cf_if' binding='user' rendertag='true'> \
					<h2>Create your Profile</h2>\
					<div class='cf_widgetLoader cf_syndication_icons' widgettype='CF.widget.SyndicationIcons'></div>\
					<div class='cf_if' binding='requirePass'>\
						<div class='cf_regform_row'>\
							<label for='cf_username'>Username:</label>\
							<input type='text' id='cf_external_id' class='cf_validate' validator='required' validator_msg='Please enter a username'></input>\
							<div class='cf_clear'> </div>\
						</div>\
						<div class='cf_regform_row'>\
							<label for='cf_password'>Password:</label>\
							<input type='password' id='cf_password' class='cf_validate' validator='required' validator_msg='Please enter a password' value=''></input>\
							<div class='cf_clear'> </div>\
						</div>\
					</div>\
					<div class='cf_regform_row'>\
						<label for='cf_display_name'>Display name:</label>\
						<input type='text' id='cf_display_name' class='cf_validate' validator='required' validator_msg='Please enter a display name' value='[%user.display_name%]'></input>\
						<div class='cf_clear'> </div>\
					</div>\
					<div class='cf_regform_row'>\
						<label for='cf_email'>Email address:</label>\
						<input type='text' id='cf_email' class='cf_validate cf_required' validator='email' validator_msg='Please enter a valid email address' value='[%user.email%]'></input>\
						<div class='cf_clear'> </div>\
					</div>\
					<div class='cf_regform_row'>\
						<label for='cf_email'>First name:</label>\
						<input type='text' id='cf_first_name' class='cf_validate' validator='required' validator_msg='Please enter your first name' value='[%user.firstName%]'></input>\
						<div class='cf_clear'> </div>\
					</div>\
					<div class='cf_regform_row'>\
						<label for='cf_email'>Last name:</label>\
						<input type='text' id='cf_last_name' class='cf_validate' validator='required' validator_msg='Please enter your last name' value='[%user.lastName%]'></input>\
						<div class='cf_clear'> </div>\
					</div>\
					<div class='cf_regform_row'>\
						<label for='cf_profile_photo_url'>Avatar:</label>\
						<input type='text' id='cf_profile_photo_url' class='cf_validate' validator='imageUrl' validator_msg='Please enter a valid avatar url' value='[%user.profile_photo_url%]'></input>\
						<div class='cf_if' binding='user.profile_photo_url'>\
							<img class='cf_avatar_preview' src='[%user.profile_photo_url%]'></img>\
						</div>\
						<div class='cf_clear'> </div>\
					</div>\
					<div class='cf_regform_error_msg'></div>\
					<div class='cf_regform_row cf_regform_syndicate' style='display:none;'>\
							<label> </label>\
							<input type='checkbox' class='cf_regform_syndicate_cbx' checked='checked'>Let my friends know about this site\
					</div>\
					<div class='cf_regform_button_row'>\
						<button type='button' class='cf_regform_submit'>Save</button>\
					</div>\
					<div class='cf_else'>\
						You must be logged in with an account in the 'Unverified' state to use this widget.\
					</div>\
				</div>\
		";
	};
	that.getData = function(){
	    var d = {};
	    CF.extend(d, data);
	    d.opts = opts;
	    d.user = CF.context.auth_user;
		return d;
	};
	that.updateAvatar = function ()
	{
		that.avatarPreview.attr("src", that.profilePhotoUrl.val());
	};
	that.processForm = function ()
	{
		that.errorMsg.html("");
		if (CF.validate.run(targetElem)) {
			var params = {};
			targetElem.find("input, textarea").each(function(i, elem){
				elem = jQuery(elem);
				var val = elem.val();
				var id = elem.attr("id");
				if (val && id) 
					params[id.replace("cf_", "")] = val;
			});
			params.provider = data.provider;
			CF.context.api_v1.loginreg_register(that.formComplete, params);
		}
		else{
			/**
			 * @name CF.widget.RegForm#regform_validate_failed
			 * @event
			 * @description
			 * Fired when the user has entered something incorrectly on the registration form.
			 * @param {CF.widget.RegForm} The current widget object.
			 */
			that.events.fire("regform_validate_failed", that);
		}
	};
	that.formComplete = function (user, error)
	{
		if (error)
		{
			var errElem;
			if(error.error_code == 164)
			{
				errElem = CF.build("div", ["The username you've selected is already taken.  Please select a different username."]);			
			}
			else{
				errElem = CF.build("div", "Error: "+ error.error_str + " - "+ error.error_detail);
			}
			errElem.hide();
			that.errorMsg.append(errElem);
			errElem.fadeIn();			
			/**
			 * @name CF.widget.RegForm#regform_error
			 * @event
			 * @description
			 * Fired when the server had an error processing the registration form.  The most common reason for this is that the external id that the user passed in is already taken.
			 * @param {Error} The error object for the error.
			 * @param {CF.widget.RegForm} The current widget object.
			 */
			that.events.fire("regform_error", error, that);
		}
		else
		{
			if(opts.syndicate && that.isSyndicated)
			{
				var provs = that.getActiveSyndProviderNames();
				that.syndicate(provs, opts.syndicationCategory, data.user.external_id, opts.syndicationUrl, null, that.syndicationComplete);
			}
			
			/**
			 * @name CF.widget.RegForm#regform_complete
			 * @event
			 * @description
			 * Fired when the user has successfully completed the registration form
			 * @param {Object} user The new user object with its fields updated to reflect the user's input.
			 * @param {CF.widget.RegForm} The current widget object.
			 */
			that.events.fire("regform_complete", user, that);	
		}		
	};
	that.syndicationComplete = function (synd, error)
	{
		if (error) 
			CF.error("Error performing syndication event", error);
		else {
			CF.log("Syndication completed", synd);
			that.events.fire("regform_syndication_complete", synd, that);
		}
	};
	that.toggleSyndicate = function(){
		that.isSyndicated = this.checked;	
	};
	that.bindEvents = function(elem, subWidgets)
	{
		that.avatarPreview = elem.find(".cf_avatar_preview");
		that.profilePhotoUrl = elem.find("#cf_profile_photo_url").blur(that.updateAvatar);
		elem.find(".cf_regform_submit").click(that.processForm);
		that.errorMsg = elem.find(".cf_regform_error_msg");
		if (that.canSyndicate())
		{
			that.isSyndicated = true;
			that.syndElems = elem.find(".cf_regform_syndicate").show();
			that.syndIcon = elem.find(".cf_regform_syndicate_cbx").click(that.toggleSyndicate);		
		}
	};
	return that;	
};