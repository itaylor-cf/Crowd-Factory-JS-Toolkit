//= require <CF.widget.SimpleWidget.js>
/**
 * @class
 * A widget for rendering a user's profile. 
 * @extends CF.widget.SimpleWidget
 * 
 * @behavior {click} .cf_activate_user Activates a user.  If the option showPopup is true, the user's detail
 * information is shown in a .cf_profile_popup class element.  The event userprofile_activated is also fired.
 * @behavior {click} .cf_close_popup_btn Hides the popup element.
 * 
 */
CF.widget.UserProfile = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
			showPopup:true
		};
	opts = CF.extend(defaultOpts, (opts || {}));
	
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	if(!data)
	{
		CF.error("UserProfile: the data parameter must be set to an user or userId", data);
		return null;
	}
	that.onStart = function ()
	{
		if (typeof data == 'string')
		{
			that.userId = data;
			that.fetchUser();
		}
		else
		{
			that.user = data;
			that.draw();
		}
	};
	that.onReload = function()
	{
		that.fetchUser();
	};	
	that.fetchUser = function ()
	{
		CF.context.api_v1.user_get(that.userLoaded, that.userId);
	};
	that.isSelf = function()
	{
		var authUser = CF.context.auth_user;
		return authUser && that.userId == authUser.external_id;
	};
	that.userLoaded = function (user, error)
	{
		if(error)
		{
			CF.error("Error fetching user", error);
			return;
		}
		that.user = user;
		that.userId = user.external_id;
		that.draw();
	};
	that.getData = function ()
	{
		return {user:that.user, opts:opts, isSelf:that.isSelf()};
	};	
	that.getDefaultTemplateBody = function ()
	{
		return " \
		<div class='cf_avatar'> \
				<div class='cf_if' binding='user.profile_photo_url'> \
				<a class='cf_activate_user'> \
					<img cf_src='[% user.profile_photo_url %]'/> \
				</a> \
		    </div> \
		</div> \
		<cite class='cf_activate_user'> \
		 	<a>[% user.display_name %]</a> \
		</cite> \
		<div class='cf_profile_popup' style='display:none;'> \
		 	<h4>[%user.display_name%] details <span class='cf_close_popup_btn'>x</span></h4> \
		 	<div class='cf_profile_popup_details'> \
			 	<div class='cf_if' binding='!user.badges'> \
			 		<div>This user has no badges</div> \
			 		<div class='cf_else'> \
				 		<div class='cf_for' binding='user.badges' rendertag=false> \
					 		<div class='cf_item cf_badge'> \
					 			<img cf_src='[%item.img_url%]'></img><a cf_href='[item.url]'>[%item.name%]</a> \
					 		</div> \
				 		</div> \
			 		</div> \
			 	</div> \
			 	<span class='cf_if' binding='user.profile_url'> \
			 		<div><a cf_href='[%user.profile_url%]'>Visit [%user.display_name%]'s page</a></div> \
			 	</span> \
		 	</div> \
		 </div>"; 		 
	};
	that.activate = function()
	{
		/**
		 * @name CF.widget.UserProfile#userprofile_activated
		 * @event
		 * @description
		 * Fired when a user is activated. 
		 * @param {Object} The user whose profile is being viewed.
		 * @param {CF.widget.UserProfile} The current widget object.
		 */
		that.events.fire("userprofile_activated", that.user, that);
		if(opts.showPopup)
		{
			that.popupElem.fadeIn();
		}
	};
	that.hidePopup = function ()
	{
		that.popupElem.hide();
	};
	that.bindEvents = function (elem, subWidgets)
	{
		elem.find(".cf_activate_user").click(that.activate);
		that.popupElem = elem.find(".cf_profile_popup");
		elem.find(".cf_close_popup_btn").click(that.hidePopup);
	};
	return that;
};