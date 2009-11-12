/**
 * @static
 * @class
 * An extremely simplistic form validator
 * Pass it an element in the run method and it will validate any fields that have 
 * cf_validate class, and display their validator_msg attribute if they've failed.
 */
CF.validate = function(){
	
	var that = {};
	
	that.events = CF.EventPublisher();
	that.hideAll = function (elem)
	{
		elem.find(".cf_validate_fail").removeClass("cf_validate_fail");
		elem.find(".cf_validate_success").removeClass("cf_validate_success");
		elem.find(".cf_validate_fail_msg").remove();
	};	
	that.validators = {
		required:function (v){return jQuery.trim(v).length > 0;},
		email:/\w{1,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/,
		alpha:/^[a-zA-Z]+$/,
		url:/^(http|https|ftp):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i,
		urlSafe:/^[a-zA-Z0-9_\-,\.]+$/,
		imageUrl:function (v) {return that.test(that.validators.url, v) && v.split('?')[0].toLowerCase().match(/.(\.jpg|\.gif|\.png|.jpeg)/);},
		number:function (v){return !isNaN(v);}
	};	
	that.addValidator = function (name, v)
	{
		that.validators[name] = v;
	};	
	that.showError = function (e, msg)
	{
		if(msg)
		{
			var elem = CF.build(".cf_validate_fail_msg", msg).hide();
			e.after(elem);
			elem.fadeIn();		
		}
		e.addClass("cf_validate_fail");		
	};
	that.test = function (v, val)
	{
		if (typeof v == "function")
		{
			return v(val);
		}
		return v.test(val);
	};	
	that.run = function (elem)
	{
		that.hideAll(elem);
		var elems = elem.find(".cf_validate");
		if(elem.is(".cf_validate"))
			elems = elems.andSelf();
		var failElems = CF.collect(elems, function (i, e)
		{
			e = jQuery(e);
			var req = CF.hasClass(e, "cf_required");
			var val = e.attr("validator");
			var msg = e.attr("validator_msg");
			var v = that.validators[val];
			if(!v && val)
			{
				v = CF.evalFx(val, null, false, "Error evaluating validator expression");
			}
			req= (req || (val == 'required'));
			var value = e.val();
			var hasValue = that.validators.required(value); 
			if (hasValue || req) {			
				var result = that.test(v, value) && hasValue;
				if(!result)
			 	{
					that.events.fire("validate_elem_failed", e, msg);
					that.showError(e, msg);
					return {elem:e, msg:msg};
				}	
			}
			that.events.fire("validate_elem_success", e);
			e.addClass("cf_validate_success");			
			return null;						
		});
		if(failElems.length == 0)
		{
			that.events.fire("validate_success", elem, failElems);
			return true;
		}
		that.events.fire("validate_failed", elem);
		return false;
	};
	return that;
}();
