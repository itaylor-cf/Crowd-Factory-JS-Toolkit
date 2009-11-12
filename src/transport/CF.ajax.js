
CF.ajax = function ()
{
	var that = {};
	that.xd_receivers= {};
	that.seq = 1;
	that.xd_polltime=50;
	that.xd_queue=[];
	
	/**
	 * This method will determine the appropriate transport mechanism to use 
	 * for the given request. 
	 */
	that.request = function (url, params, doneFx)
	{
		var keys = CF.keys(params);
		var fx = that.ajax; //default
		if(params.redirect)
			fx = that.formPost;
		else if (!that.sameDomain(url, location.href))
		{
			fx = that.jsonp;
			if (that.checkPostMessage())
				fx = that.winPostMessage;
			else if(that.use_xdr)
				fx = that.winName;
		}
		fx(url, params, doneFx);
	};
	
	/*Transport wrapper methods */
	/**
	 * Real AJAX.  Only works to the exact same domain as location.href.
	 */
	that.ajax = function (url, params, doneFx)
	{
		jQuery.ajax({
					dataType:"json",
					url:url,
					data:params,
					type:"POST",
					success:doneFx
				});	
	};
	/**
	 * The transport method for JSONP
	 * Note: IE has a character limit on the amount of data that can be sent 
	 * with JSONP due to its limit on url length of about 2000 characters.
	 * Consider using window.name transport if you need to send more data 
	 * than 2000 chars.
	 */
	that.jsonp = function (url, params, doneFx)
	{
		jQuery.ajax({
			dataType:"jsonp",
			url: url,
			data: params,
			jsonp:"jsonp",
			success:doneFx
		});			
	};
	/**
	 * The transport method for form posts.
	 * Note: this method does not call a function on completion, the page will reload
	 * as a result of the formPost.
	 */
	that.formPost = function(url, params)
	{
		var inputs = [];
		jQuery.each(CF.keys(params), function (i, k) {inputs.push(CF.build("input", {type:"hidden", name:k, value:params[k]}));});
		var form = CF.build("form", {method:"POST", action:url}, inputs);
		jQuery("body").append(form);
		form.submit();
	};
	/**
	 * The transport method for window.postMessage transport 
	 * Note: this can only be used by browsers that support window.postMessage
	 * IE 8, Safari 4+, FireFox 3+, Chrome 3+
	 */
	that.winPostMessage = function (url, params, doneFx)
	{	
		if (!that.checkPostMessage())
		{
			CF.error("Browser does not support window.postMesage transport");
			return;
		}		
		var msg = {
			seq:"seq_"+that.seq++,
			url:url,
			params:params
		};
		that.xd_receivers[msg.seq] = doneFx;
		that.waitForXdHost(function (){that.xd_host.postMessage(CF.toJSON(msg), "*");});
	};
	
	/** 
	 * The transport method for window.name transport. 
	 * Window.name transport requires that you've configured a xdr_loc
	 * which means that you have a xd_host.html on the same domain as 
	 * location.href.  It is the slowest transport because it relies 
	 * on polling and can only have one request in-flight at a time.
	 * It should only be used when postMessage transport is not available.
	 * */
	that.winName = function (url, params, doneFx)
	{
		var msg = {
				seq:that.seq++,
				url:url,
				params:params,
				returnUrl:that.xdr_loc
			};
		that.xd_receivers[msg.seq] = doneFx;
		that.xd_queue.push(msg);
		that.xd_check();
	};
	
	that.checkPostMessage = function ()
	{
		return window.postMessage && !CF.isIE8Compat();
	};
	
	that.waitForXdHost = function (fx)
	{
		if (that.xd_host && that.xd_hostReady)
			fx();
		else
			setTimeout(function (){that.waitForXdHost(fx);}, that.xd_polltime);
	};
	
	that.sameDomain = function (url1, url2)
	{
		//remove the protocol part and compare the whole domain.
		var op = function (str)
		{
			return str.toLowerCase().replace("http://").replace("https://").split("/")[0];
		};
		return (url1 && url2) && (op(url1) == op(url2));	
	};
	
	/**
	 * This function must be called before you can use any of the 
	 * cross domain transport mechanisms that require an iframe
	 * (window.postMessage and window.name)
	 */
	that.xd_setup = function (hostname, path, xd_path, use_xdr, xdr_loc)
	{
		that.xd_hostname= hostname;
		that.xdr_loc = xdr_loc;
		that.use_xdr = use_xdr;
		that.xd_loc = hostname + xd_path;
		if(!that.sameDomain(location.href, xdr_loc))
		{
			CF.error("xdr_loc must match current hostname for cross domain communication to work", location.href, xdr_loc);
			return;
		}
		that.frameName = "xd_frame" + Math.random().toString().replace(".", "");
		jQuery(function (){
			var src = null, clickStop = false;
			if (that.checkPostMessage())
			{
				src = that.xd_loc;
				//Safari has an issue where it will only set cookies on child iframes if the iframe is "active".
				//Usually, that means that the user has clicked on the frame.  We get around this by having the iframe
				//Do a POST that redirects back to the xd_host, which also makes the iframe "active".  From then on, it will
				//Set cookies normally.
				//We don't have to do this extra step if the config is set to use the cf token
				if (CF.isSafari() && !CF.config.current.use_cf_token)
					src = CF.url.addParam("safariFix", hostname+path+"no-op", src);
				jQuery(window).bind("message", that.xd_msg_handler);
			}
			else if(that.use_xdr)
			{
				src = that.xdr_loc + "?ready=true";
				if ("ActiveXObject" in window) {
					clickStop = true;
				    var doc = new ActiveXObject("htmlfile");
				    doc.open();
				    doc.write("<html><body><iframe id='iframe' src='"+src+"' name='"+that.frameName+"'></iframe></body></html>");
				    doc.close();
				    var el = doc.getElementById('iframe');
				    el.onload = function (){
					    that.xd_host_elem = jQuery(el);
					    that.xd_host = el.contentWindow;
				    };
					CF.log("xd_host iframe created inside htmlfile instance");
				}
			}
			if (src && !clickStop)
			{	
				that.xd_host_elem = CF.build("iframe", {style:"display:none", name:that.frameName, src:src});
				jQuery("body").append(that.xd_host_elem);
				that.xd_host = window.frames[that.frameName];
				CF.log("xd_host iframe created");
			}
		});		
	};
	that.xd_check = function ()
	{
		var loc = null;
		try {
			if (that.xd_host_elem)
			{
				var ifr = that.xd_host_elem.get(0);
				var ok = true;
				if (CF.isIE() &&  ifr.readyState != 'complete')
					ok = false;
				if(ok)
				{
					that.xd_host = that.xd_host_elem.get(0).contentWindow;
					loc = that.xd_host.location.toString();
				}
			}
		}
		catch (e){}//fails when the location can't be accessed b/c it's still on the wrong domain.
		if(loc && loc.indexOf(that.xdr_loc) == 0)
		{
			var n = that.xd_host.name;
			if ( n == "ready" && that.xd_queue.length > 0)
			{
				that.xd_host.name = "request:"+CF.toJSON(that.xd_queue.pop());
				if (CF.isIE())
					that.xd_host.location = that.xd_loc + "?request=true";
				else
					that.xd_host_elem.attr("src", that.xd_loc + "?request=true");
			}
			if (n.indexOf("response:") == 0 )
			{
				var data = CF.evalFx(n.replace("response:", ""));
				that.xd_host.name = "ready";
				that.xd_msg_dispatch(data);
			}
		}
		setTimeout(that.xd_check, that.xd_polltime);
	};
	that.xd_msg_dispatch = function (msg)
	{
		CF.log("processing seq", msg.seq);
		if(!msg.seq || !that.xd_receivers[msg.seq])
		{
			CF.error("Message with invalid sequence received", msg);
			return;
		}
		that.xd_receivers[msg.seq](msg.data);	
		delete that.xd_receivers[msg.seq]; 
	};
	that.xd_msg_handler = function (msg)
	{
		if(msg.type != "message")
			return;
		msg = msg.originalEvent;
		if (msg.origin != that.xd_hostname) {
			return;
		}
		if(! that.xd_hostReady && msg.data == "ready")
			that.xd_hostReady = true;
		else
		{
			that.xd_msg_dispatch(CF.evalFx(msg.data));	
		}
	};
	
	return that;
}();

