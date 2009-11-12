
/**
 * @static
 * @class
 * A simplisitic "lightbox" type effect.
 * Can be passed a jQuery node, or a node that contains a widget to be evaluated before display.
 * If content contains an img tag it will attempt to preload the image before fully showing the image to avoid
 * jerky resizing of the modal content window.<br/>
 * 
 * You need to define a few css styles for the modal to display properly. See the example section for 
 * a starting guide.
 * 
 * @example
&lt;style&gt;
.cf_modal_bg {background-color:#FFF}
.cf_modal_closer {float:right; font-size:25px; color:#666; cursor:pointer; margin-top:10px;}
.cf_modal_header {text-align:center; height:40px;}
.cf_modal_body {padding:0 10px 10px; background-color:#000; color:#666;}
.cf_modal_load {margin:auto; width:31px; height:31px; 
                background-image:url(../../images/greyspinner.gif);}
&lt;/style&gt;

&lt;script&gt;
var content = jQuery("&lt;div&gt;&lt;img src='myimage.jpg'&gt;&lt;/img&gt;&lt;/div&gt;");
CF.modal.show(content, null, {height:400});
&lt;/script&gt;
 *
 */
CF.modal = function ()
{
	var that ={};
	
	that.events = CF.EventPublisher();

	that.opts = {opacity:0.8,fromTop:50,height:300,width:300,fadeTime:600,allowEsc:true,modalElemClass:null};
	
	/**
	 * Starts showing the modal if not already shown.
	 * @param {Element, jQuery} content  The content to place into the modal.
	 * @param {Object} data The data to pass to the widget processor (only used if content is a cf_widgetLoader).
	 * @param {Object} opts The options for this modal defauls are:
	 * {opacity:0.8,fromTop:50,height:300,width:300,fadeTime:600,allowEsc:true}
	 * @return {Array} an array containing any widget objects that may have been loaded as a result of the modal being shown.
	 */
	that.show = function (content, data, opts)
	{
		/**
		 * @name CF.modal#modal_show_started
		 * @event
		 * @description
		 * Fired when the show function has been called. 
		 * @param {CF.modal} that The modal object.
		 */
		that.events.fire("modal_show_started", that);
		CF.extend(that.opts, opts);
		that.useFixed = !CF.isIE6();
		
		if(!that.built)
		{
			var elem = CF.build(".cf_modal_elem",
			[
			 	that.modalBg = CF.build(".cf_modal_bg").hide(),
			 	that.modalBody = CF.build(".cf_modal_body",
			 			[
			 			    that.modalCloser = CF.build(".cf_modal_closer", "x").click(that.hide),
			 			 	that.modalHeader = CF.build(".cf_modal_header"),
			 			 	that.modalLoad = CF.build(".cf_modal_load"),
			 			 	that.modalContent = CF.build(".cf_modal_content").hide(),
			 			]).hide(),
			 ]).hide();
			that.modalElem = elem;
			jQuery(document.body).append(that.modalElem);
			that.built=true;
		}
		else{
			that.modalElem.attr("class", "cf_modal_elem");
			that.modalContent.hide();
		}
		if(that.opts.modalElemClass)
			that.modalElem.addClass(that.opts.modalElemClass);
				
		that.content = jQuery(content).show();
		that.modalContent.html(that.content);
		var eng = CF.template.Engine();
		that.content = eng.render(that.content, data, true);
		var result = eng.startSubWidgets();
	
		if(!that.isShown)
		{
			that.isShown = true;
			that._startAppear(content);
		}
		else
		{
			that.modalContent.show();	
		}
		return result;
	};
	/**
	 * Hides a modal if one is shown, unbinds the listeners of esc presses and scrolling.
	 */
	that.hide = function ()
	{
		that.modalElem.hide();
		/**
		 * @name CF.modal#modal_hidden
		 * @event
		 * @description
		 * Fired when the hidden function has been called and the modal is no longer active. 
		 * @param {CF.modal} that The modal object.
		 */
		that.events.fire("modal_hidden", that);
		//that.modalElem.fadeOut(that.opts.fadeTime, that._ie6Show);
		that.isLoaded=false;
		that.isShown =false;
		jQuery(window).unbind("scroll resize", that._centerBox);	
		jQuery(document).unbind("keypress", that._handleEsc);
	};
	that._handleEsc = function (e)
	{
		if (e.keyCode == 27 && that.isShown)
			that.hide();		
	};
	that._startAppear = function (content)
	{
		that._ie6Hide();
		that.modalElem.show();
		var win = jQuery(window);
		var middle = (win.height() / 2) + win.scrollTop();
		var w = that.opts.width;
		var h = that.opts.height;
		var pos = that.useFixed? "fixed" : "absolute";
		that.modalBody.css({position:pos, "z-index":"1001", overflow:"hidden",  width:w, height:h});
		that.modalLoad.css({"margin-top":(h/3) - that.modalLoad.height()});
		that.modalBg.css({"opacity":that.opts.opacity,position:pos});
		that._centerBox();
		that.modalBody.show();
		that.modalBg.fadeIn(that.opts.fadeTime);
		that._startContentLoad();
		if(that.opts.allowEsc)
		{
			jQuery(document).keydown(that._handleEsc);
		}
		win.bind("scroll resize", that._centerBox);
	};
	that._startContentLoad = function()
	{
		var imgs = that.content.filter("img");
		if (imgs.length ==0 )
			imgs = that.content.find("img");
	
		if (imgs.length > 0)
		{
			CF.log("starting image load");
			that.img = new Image();
			that.img.onload = that._contentLoaded;
			that.img.src = imgs.attr("src");
			var imgSrc = that.img.src;
			//preloading failed if it took more than 5s.
			setTimeout(function (){
				if (that.img && (imgSrc == that.img.src) && !that.isLoaded)
				{
					that._contentLoaded();
				}
				}, 5000);
		}
		else
		{
			that._contentLoaded();
		}
	};
	that._completeLoad = function ()
	{
		that.modalLoad.hide();
		that.modalContent.slideDown(that.opts.fadeTime, function (){
			if(!that.opts.fixedHeight)
			{
				that.modalBody.height("auto");
			}
		});
		

		/**
		 * @name CF.modal#modal_show_complete
		 * @event
		 * @description
		 * Fired once the modal has finished loading and fully shown its content. 
		 * @param {CF.modal} that The modal object.
		 */
		that.events.fire("modal_show_complete", that);
	};
	that._centerBox   = function ()
	{
		var win = jQuery(window);		
		var nh = Math.max(that.modalContent.height() + that.modalHeader.height(), that.opts.height);
		var nw = Math.max(that.modalContent.width(), that.opts.width);
		var top = that.useFixed ? "0" : win.scrollTop();
		var btop = that.useFixed ? that.opts.fromTop : that.opts.fromTop + win.scrollTop();
		that.modalBg.css({top:top, height:win.height(), width:win.width()});
		that.modalBody.css({top:Math.max(0, btop), marginLeft:(win.width() - nw)/2});
	};
	that._contentLoaded = function ()
	{
		if (!that.isLoaded)
		{
			that.img = null;
			that.isLoaded =true;
			that.modalContent.html(that.content);
			var nw = Math.max(that.modalContent.width(), that.opts.width);
			var nh = Math.max(that.modalContent.height() + that.modalHeader.height(), that.opts.height);
			CF.log("width: "+nw + " height" + nh);
			var nleft = (jQuery(window).width() - nw) /2;
			that.modalBody.animate({width:nw, height:nh, marginLeft:nleft},{complete:that._completeLoad});
		}
	};	
	that._ie6Hide = function()
	{
		if (CF.isIE6())
		{
			jQuery("select").each(function (i, s){
				s = jQuery(s);
				if(s.css("visibility") !="hidden")
				{
					s.attr("cf_modal", "hidden");
					s.css("visibility", "hidden");
				}
			});
		}
	};
	that._ie6Show = function ()
	{
		if (CF.isIE6())
		{
			jQuery("select[cf_modal]" ).each(function (i, s){
				s = jQuery(s);
				if(s.attr("cf_modal") == "hidden")
				{
					s.attr("cf_modal", "");
					s.css("visibility", "");
				}
			});
		}
	};
	return that;
}();