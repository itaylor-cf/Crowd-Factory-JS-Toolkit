/*   
Copyright (c) 2009 Crowd Factory, Ian Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */
   


/** @namespace 
 * The top-level CF namespace.  This contains many helper functions for 
 * common JS tasks, most of which are used by the template engine and the 
 * widget frameworks. 
 * */
var CF = {};
CF.version = "@CF.version@";
CF.buildNum = "@CF.buildNum@";
CF.buildDate = "@CF.buildDate@";

/**
 * @description 
 * Turns an iterable object into an array.
 * The classic use of this is turning the arguments variable into an actual array.
 */
CF.toArray= function (iterable) 
{
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length || 0, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
};

/**
 * Creates a shallow clone of an array.
 */
CF.arrayClone = function (arr)
{
	var a = [];
	jQuery.each(arr, function (i, o){a.push(o);});
	return a;
};

/**
 * @description 
 * Add the properties of one object to another object.  This can be used to make objects "inherit" from each other. 
 * @return {object} the destination object
 */
CF.extend = function(destination, source) 
{
	if(source)
	  for (var property in source)
	    destination[property] = source[property];
  return destination;
};

/**
 * @function
 * An alias for CF.extend
 * @see CF.extend
 */
CF.mixin = CF.extend; 


/**
 * Returns the keys (property names) of an object.
 */
CF.keys = function(object) 
{
    var keys = [];
    for (var property in object)
      keys.push(property);
    return keys;
};

/**
 * Returns only the values of all properties of an object.
 */
CF.vals = function (object)
{
	var keys = CF.keys(object);
	return CF.collect(keys, function (i,k){return object[k];});
};

/**
 * Removes any keys from the object that have a value equal (===) 
 * to any objects in the toClean Array
 */

CF.clean = function (obj, toClean)
{
	if (!jQuery.isArray(toClean))
	{
		toClean = [toClean];
	}
	var keys =CF.keys(obj);
	jQuery.each(keys, function (i,k){
		var val= obj[k];
		var len= toClean.length;
		for(var j=0; j< len; j++){
			if(toClean[j] === val){
				delete obj[k];
				break;
			}
		}
	});
};

/**
 * Returns the first object to match an iterator function 
 * @param {array} arr
 * @param {function} iterator function with two parameters index, and value
 * @param {object} context the scope to execute the iterator in.  Default of null will execute the iterator in the global scope.
 * @return {object} the object found or null if nothing found. 
 */
CF.arrayFind = function (arr, iterator, context)
{
	 var result = null;
    jQuery.each(arr, function(index, value) {
      if (iterator.call(context, index, value))
      {
        	result = value;
        	return false;
      }
    });
    return result;
};
/**
 * Returns all values for a certain property of all objects in an array. 
 * @param {array} arr an array of objects.
 * @param {string} key function with two parameters index, and value
 * @param {object} context the scope to execute the iterator in.  Default of null will execute the iterator in the global scope.
 * @return {array} an array containing the value of each property in the input array.
 */
CF.pluck = function (arr, key)
{
	return CF.collect(arr, function (i,o){return o[key];});
};

/**
 * Like CF.arrayFind, but returns all objects that were found instead of just the first one.
 * @param {array} arr
 * @param {function} iterator function with two parameters index, and value
 * @param {object} context the scope to execute the iterator in.  Default of null will execute the iterator in the global scope.
 * @return {array} An array of objects found. 
 */
CF.arrayFindAll = function(arr, iterator, context) 
{
    var results = [];
    jQuery.each(arr, function(index, value) {
      if (iterator.call(context, index, value))
        results.push(value);
    });
    return results;
};
/**
 * Like CF.arrayFindAll, but returns an array containing only objects not found.
 * @param {array} arr
 * @param {function} iterator function with two parameters index, and value
 * @param {object} context the scope to execute the iterator in.  Default of null will execute the iterator in the global scope.
 * @return {array} An array of objects for which the iterator function returned falsey. 
 */
CF.arrayReject  = function (arr, iterator, context)
{
	var results = [];
    jQuery.each(arr, function(index, value) {
      if (!iterator.call(context, index, value))
        results.push(value);
    });
    return results;
};

/**
 * Removes all falsey values from an array.  Usually used to remove nulls and undefineds from an array
 * @param {array} arr
 * @return {array} An array with only truthy values. 
 */
CF.arrayCompact = function (arr)
{
	var l = arr.length;
	var i, v;
	var newArr = [];
	for(i=0; i < l; i++)
	{
		v = arr[i];
		if(v)
		{
			newArr.push(v);
		}
	}
	return newArr;
};
/**
 * Takes an element or jQuery extended element and checks if it has the className provided.
 * Jquery 1.3 has an insanely slow implementation of hasClass.  This is radically faster.
 * On rendering a template that took ~1000ms to render, switching jQuery's hasClass to this 
 * cut the render time to ~700ms.  The time spent in this method dropped from ~330ms to ~40ms.
 */
CF.hasClass = function (node, className)
{
	if(node.jquery)
	{
		node = node.get(0);
	}
	if(!node.className)
		return false;
	var s = " "+ node.className+" ";
	return (s.indexOf(" " + className + " ") != -1);
};

/**
 * Gets the result of a function being called with that function being passed the index and value for each item in the array "list"
 * nulls and undefined values are excluded from the list.
 */
CF.collect = function (list, fx)
{
	var arr = [];
	jQuery.each(list, function (i, item){
		arr.push(fx(i, item));
	});
	return CF.arrayCompact(arr);
};

CF.first = function (list, fx)
{
	var l = list.length;
	for(var i =0; i < l; i++)
	{
		var v = fx(i, list[i]);
		if (v != null && v != undefined)
		{
			return v;
		}
	}
	return null;
};
/**
 * Returns true if the browser is IE
 */
CF.isIE = function ()
{
	return jQuery.browser.msie;
};

/** Returns true if the browser is MSIE 6 */
CF.isIE6 = function ()
{
	return CF.isIE() && parseInt(jQuery.browser.version) == 6;
};
/** Returns true if the browser is MSIE7 or IE 8 pretending to be IE 7 */
CF.isIE7 = function ()
{
	return CF.isIE() && parseInt(jQuery.browser.version) == 7;
};
/** Returns true if the browser is IE 8 */
CF.isIE8 = function ()
{
	return CF.isIE() && parseInt(jQuery.browser.version) == 8;
};
/**
 * Returns true if the browser is IE and the browser is running in IE 7 compatibility mode.
 */
CF.isIE8Compat = function ()
{
	//postMessage was added in IE8.  
	//If the browser claims to be IE7 but has postmessage, it is almost assuredly IE 8 in Compatibility mode.
	return CF.isIE7() && window.postMessage;
};
/**
 * Returns true if the browser is Safari (not Chrome).
 */
CF.isSafari = function ()
{
	var nav = navigator.userAgent.toLowerCase();
	return (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1);
};

CF.isUndefined = function(object) {
    return typeof object == "undefined";
};

CF.isNumber = function(object) {
    return typeof object == "number";
};

CF.inList = function (thing, list)
{
	var l = list.length;
	for(var i=0; i< l; i++)
	{
		if (thing === list[i])
			return true;
	}
	return false;
};

/**
 * Logs a statement to the console at ERROR: level
 */
CF.error = function (msg, info)
{
	if(window.console)
	{
		console.log("ERROR: "+ CF._logBuilder(CF.toArray(arguments)));
	}
};
CF._logBuilder = function(args, sep)
{
	sep = sep || " arg";
	var s = "";
	s += args.shift();
	jQuery.each(args, function (i, o) 
	{
		if (typeof o == "string")
			s += " " + o;
		else 
			s += sep + i+1 + " " + CF.toJSON(o);
	});
 	return s;
};
/** Logs a statement to the console at INFO: level */
CF.log = function ()
{
	if(window.console)
	{
		console.log("INFO: "+ CF._logBuilder(CF.toArray(arguments)));
	}	
};
/** A convenience method for checking if an event was keycode 13 (the enter key). 
 * @return {function} A function that wraps the onEnterFx parameter with a check for keyCode 13.
 * */
CF.enterPressed = function(onEnterFx)
{
	var fx =  function (e)
	{
		if(e.keyCode == 13)
		{
			onEnterFx();
		}
	};
	return fx;
};
/**
 * the .focus() method from jQuery fails when the document is not yet appended to the DOM.  
 * This method allows you to specify that a field should be focused at some point in the future, and it will keep trying 
 * Until the focus() succeeds.
 */
CF.focusLater = function(jq, time)
{
	if (!time)
	{
		time = 200;
	}	
	var focusFx = function ()
	{
		try {jq.get(0).focus();
		}
		catch (e)
		{
			CF.focusLater(jq);
		}
	};
	setTimeout(focusFx, time);
	return jq;
};

CF.nl2br = function (str)
{
	return str.replace(/\n/g, '<br />');
};

/**
 * @deprecated
 * Will be removed in a future release
 * @param {Object} ns
 */
CF.makeNamespace = function(ns)
{
	var fx = function (obj, strArr, i)
	{
		if(i < (strArr.length - 1))
		{
			var str = strArr[i];
			if (!obj[str])
			{
				obj[str] = {};
			}
			i++;
			fx(obj[str], strArr, i);
		}
	};
	
	var parts = ns.split(".");
	fx(window, parts, 0);
};

/**
 * Evals a string as javascript using new Function().  This is much faster than eval(str) because 
 * new Function() optimizes for the eval'd javascript to not contain functions or other such structures.
 * The string passed in will be evaluated in a new function with the "with" operator set to the data passed in 
 * as the second parameter. 
 */
CF.evalFx = function(str, data, suppress, errTxt)
{
	if (!data)
	{
		data = {};
	}
	try{
		return new Function ('data', "with (arguments[0]) return " + str)(data);
	}
	catch (e){ 
		if(!suppress)
			CF.error((errTxt || "Error applying expression: ") +str, e.message);
	}
	return undefined;
};


/**
  * @function
  * @description
  * Quotes strings appropriately for their inclusion into JSON.
*/                     
CF.quoteString = function()
{
   var escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
   var meta = {    // table of character substitutions
       '\b': '\\b',
       '\t': '\\t',
       '\n': '\\n',
       '\f': '\\f',
       '\r': '\\r',
       '"' : '\\"',
       '\\': '\\\\'
       };

   // Places quotes around a string, inteligently.
   // If the string contains no control characters, no quote characters, and no
   // backslash characters, then we can safely slap some quotes around it.
   // Otherwise we must also replace the offending characters with safe escape
   // sequences.
   var fx = function (string)
   {
       if (escapeable.test(string))
       {
           return '"' + string.replace(escapeable, function (a) 
           {
	           var c = meta[a];
	           if (typeof c === 'string') {
	               return c;
	           }
	           c = a.charCodeAt();
	           return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
	       }) + '"';
       }
       return '"' + string + '"';
   };
   return fx;
//We call this fx to cache escapeable and meta via closure;
}();

/**
 * Converts an object o to a JSON String representing that object.
 */
CF.toJSON = function (o)
{
    var type = typeof(o);
    if (type == "undefined")
        return "undefined";
    else if (type == "number" || type == "boolean")
        return o + "";
    else if (o === null)
        return "null";
    else if (type == "function")
    	return CF.quoteString("function()");
    // Is it a string?
    else if (type == "string") 
    {
        return CF.quoteString(o);
    }
    else if (type == "date")
    {
    	return o.getTime();
    }
    // Does it have a .toJSON function?
    else if (type == "object" && typeof o.toJSON == "function") 
        return o.toJSON();
    
    // Is it an array?
    else if (jQuery.isArray(o)) 
    {
        var ret = [];
        for (var i = 0; i < o.length; i++) {
            ret.push( CF.toJSON(o[i]) );
        }
        return "[" + ret.join(",") + "]";
    }
    else
    {
    // It's probably an object, then.
        var objParts = [];
        for (var k in o) {
            var name = '"' + k + '"';
            var val = CF.toJSON(o[k]);
            if (typeof(val) != "string") {
                // skip non-serializable values
                continue;
            }	            
            objParts.push(name + ":" + val);
        }
        return "{" + objParts.join(", ") + "}";
    }
        
};


/**
 * Creates a closure that wraps the function fx such that any other arguments passed in will 
 * be passed to fx when it is called.
 */
CF.curry = function (fx)
{ 
	var args = CF.toArray(arguments);
	args.shift();
	return function (){
		return fx.apply(null,args.concat(CF.toArray(arguments)));
	};	
};



/**
 * Creates a closure that allows the function fx to only be called once.  Subsequent calls will return undefined.
 * Good for stopping double bounce on click event handlers.
 */
CF.once = function (fx)
{
	var occur = false;
	
	var ret= function (){
		if(!occur)
		{
			occur = true;
			return fx.apply(null, CF.toArray(arguments));
		}
		return undefined;
	};
	return ret;
};

/***
 * @deprecated
 * This will be removed in a future release.
 * A dynamic script loader
 */
CF.require = function (str)
{
	CF.makeNamespace(str);
	if (!CF.evalFx(str))
	{
		if (!CF.requireUrl)
		{
			var scpts = jQuery("script");
			CF.requireUrl = CF.first(scpts, function (i, elem){
				var src = jQuery(elem).attr("src");
				if (src && src.indexOf("CF.js") != -1)
				{
					return src.split("CF.js")[0];
				}
			});
		}
		var fileUrl = (CF.requireUrl || "") + str.replace(/\./g, "/") + ".js";		
		CF.appendScript(fileUrl);		
	}
};

/**
 * Appends a script block to the head. Good for dynamic loading scripts.
 */
CF.appendScript = function (src)
{
	jQuery("head").append(CF.build("script", {type:"text/javascript", src: src}));
};

/**
* @function
* Allows you to create a new DocumentFragment node by passing in jQuery objects, Dom Nodes, or text strings, either inside of an array
* or as a single item.
*
* See: http://ejohn.org/blog/dom-documentfragments/  for more on why to use documentfragments.
*/

CF.docFrag = function (children)
{
    var addHtmlTextToFrag = function (f, text)
    {
    	//Fast case for no tags.
    	if (text.indexOf("<") == -1){
    		var t = text.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, "\"");
    		f.appendChild(document.createTextNode(t));
    		return;
    	}    		
    	var tempElem = document.createElement("div");
    	tempElem.innerHTML = text.toString();
    	var c = CF.arrayClone(tempElem.childNodes);
    	var len = c.length;
    	for(var i = 0; i < len; i++)
    	{
    	   f.appendChild(c[i]);
        }
    };
    var addFx =  function (f, item) 
    {
    	if (item.jquery)
    		f.appendChild(item.get(0));
    		//item.each(function (idx, node){f.appendChild(node)});
    	else if (item.nodeType == 1 || item.nodeType == 3 || item.nodeType == 11) //Element, Text, and DocumentFragment nodes get appended.
            f.appendChild(item);
        else 
            addHtmlTextToFrag(f, item);
    };
   
    var fx = function (children)
    {
    	var f = document.createDocumentFragment();
	    if (children) 
	    {
	        if (jQuery.isArray(children)) 
	        {
	        	var i =0;
	        	var l = children.length;
	        	for(i = 0; i < l; i++)
	        		addFx(f, fx(children[i]));
	        }
	        else 
	        {
	        	addFx(f,children);
	        }
	    }
	    return f;
    };
    return fx;
}();


/**
*  @function
*  @param {String} selector - A selector to create the node with. 
*  @param {Object} [attributes] - The attributes to add to this node
*  @param {Array|Element|String|jQuery} [children] - an object to add as a child node
*  @return {jQuery} - A single jQuery wrapped Element representing this node
*  
*  @description
*  A powerful and flexible node builder in the spirit of Scriptacuolus's Builder.node.
*  Allows you to chain together object node creation and event binding into arrays.
*  Supports CSS syntax for class, attributes, and id, in node declarations.
*  
*  Nodes created with CF.build are not part of the DOM until they are otherwise inserted, making 
*  the performance as good as possible. 
*  in the example below this is accomplished with the jQuery html function.
*  
*
*  @example
*  jQuery("#someElem").html(
*   CF.build(".hello", [
*	 CF.build("a#myLink", "Alert clicker").click(function (){alert('you clicked')}),
*	  CF.build("ol", {style:"padding:5px"}, [
*		CF.build("li.myItem", CF.build("input[type=text][value=hello]")),
*		CF.build("li.myItem", [
*		 "<a href='#'>Some inlined HTML</a>",
*		 " just text ",
*		 CF.build("span#cool", "A Span").mouseover(function (){alert("you touched the span")})
*       ])
*      ]);
* 	  ])
*	);
*	a#myLink element would alert "you clicked" when it is clicked, and the span with "A Span" would have a mouseover event.
*	This is the html that would be rendered:
*   <textarea>
*   <div class="hello">
*		<a id="myLink">Alert clicker</a>
*		<ol style="padding:5px">
*			<li class="myItem">
*				<input type="text" value="hello"></input>
*			</li>
*				<a href="#">Some inlined HTML</a> just text <span id="cool">A Span</span>
*			</li>
*		</ol>
*	</div>
*	</textarea>
*	</pre>
*/
CF.build = function ()
{
	//These selector expressions were ripped from the Sizzle code.
	//caching regEx via closure...
	var elemExpr = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/;
	var idExpr = /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/;
	var classExpr = /\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/g;
	var attrExpr = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/g;
	
	var build = function (selector, attributes, children)
	{
		if(arguments.length == 2 && attributes!=null && (typeof attributes == "string" || jQuery.isArray(attributes) || attributes.tagName || attributes.jquery))
	    {
	        children = attributes;
	        attributes = {};
	    }
		if (!attributes)
		{
			attributes = {};
		}
		if (!selector)
			selector = "";
		var elemTag;
		elemTag = selector.match(elemExpr);
		if(elemTag)
		{
			elemTag = elemTag[0];
		}
		var id = selector.match(idExpr);
	    var className = selector.match(classExpr);
	    var attrs = selector.match(attrExpr);
	    if (!elemTag)
	    {
	    	elemTag = "div";
	    }
	    if (id)
	    {
	    	attributes.id = id[1];
	    }
	    if (attrs)
	    {
	    	jQuery.each(attrs, function (i, attr)
	    	{
	    		var parts = attr.replace(/[\[\]]/g, "").split("=");
	    		if (parts && parts.length ==2)
	    		{
	    			attributes[parts[0]] = parts[1];
	    		}
	    	});
	    }
	    var elem;
	    if((elemTag === "input" || elemTag ==="button") && CF.isIE())
	    {
	    	//In IE, an input or button type can only be set once, at creation.  If you try to set it
	    	//after the fact, you get exceptions
	    	CF.log("Attribs", attributes);
	    	var type = attributes.type ? "type=\""+attributes.type+"\"" : ""; 
	    	//Name has to be set at creation time for radio buttons only, but doesn't hurt for any other input/buttons.
	    	var name = attributes.name ? "name=\""+attributes.name+"\"" : "";
	    	//var disabled = attributes.disabled ? "disabled=\""+attributes.disabled+"\"" : "";
	    	
	    	elem = jQuery(document.createElement("<"+elemTag+" " +type+" " +name+">"));
	    
	    	delete attributes["type"];
	    	delete attributes["name"];
	    }
	    else
	    	elem = jQuery(document.createElement(elemTag));
		elem.attr(attributes);	    	
	    
	    if (className)
	    {
	       	var cls ="";
	    	jQuery.each(className, function (i, str) { cls+= str.replace(".", "") + " ";});
	    	elem.addClass(jQuery.trim(cls));
	    }    
	
	    if (children)
	    {
	    	if(children.nodeType == 11)
	    		//Already a documentfragment.
	    		elem.append(children);
	    	else
	    		elem.append(CF.docFrag(children));
	    }
	    return elem;
	};
	return build;
}();


/** @class
 * 
 * A simple, instance based event publishing and subscription class.
* Create one of these to have a target to bind custom events to.  This allows for 
* loose and lightweight handling of events between objects.
*
* @example
* var Thing1 = function ()
  {
  	 var that = {};
  	 that.events = CF.EventPublisher();
  	 that.frob = function ()
  	 {
  	 	that.events.fire("frobbed", "frob activated");
  	 }
  	 return that;
  }  
  
  var thing1 = Thing1();
 
  var frob1Key = thing1.events.listen("frobbed", function (){alert('frob1')});
  var frob2Key = thing1.events.listen("frobbed", function (){alert('frob2')});
  
  thing1.frob(); // alerts "frob1", then "frob2"
  thing1.events.unlisten(frob1Key);
  thing1.frob(); // alerts "frob2"
 
  //Create a second object  
  var Thing2 = function (thing1)
  {
  	 var that = {};
  	 that.onFrob = function (event, frobText)
  	 {
  	 	alert(frobText);
  	 }
  	 thing1.events.listen("frobbed", that.onFrob);
  }  
 
  var thing2 = Thing2(thing1);
  
  thing1.frob();  //alerts "frob2" then "frob activated";
  
  thing1.unlisten("frobbed");
  thing1.frob();  //nothing happens  
 */
CF.EventPublisher = function ()
	{
		var instanceCount = 0;
		
		var that = {};
		that.events = [];
		
		/**
		 * @description
		 * Fires an event, passing all functions listening to the event the value of "data" as their first parameter
		 * Unlistens any events that were only meant to run once after they are fired.
		 * @return Returns an array of all results of the functions fired.
		 */
  		that.fire = function (eventName)
		{
  			var retVals = [];
  			var toUnlisten = [];
  			var args = CF.toArray(arguments);
  			jQuery.each(that.events, function(i, evt)
			{
				if (!evt.name || evt.name == eventName)
				{
					CF.log("Firing event", eventName);
					retVals.push(evt.fx.apply(null, args));
				}
				if (evt.once)
				{
					toUnlisten.push(evt.key);
				}
			});
			jQuery.each(toUnlisten, function (i, key){ that.unlisten(key);});
			return retVals;
		};
		/**
		 * @description
		* Takes an event names and a function to call when the event occurs.
		* Returns the key to this event instance, which can be passed into the unlisten function.
		* if eventName is null, the listenerFx will be called for all events. 
		* @return {Number} an event instance key that can be used to unlisten from this event
		*/
		that.listen = function (eventName, listenerFx, once)
		{
			if(!once)
				once = false;
			instanceCount++;
			CF.log("Listening for event", eventName);
			that.events.push({key:instanceCount, name:eventName, fx:listenerFx, once:once});
			return instanceCount;
		};	
		
		
		/**
		 * @description
		 * removes listeners from either a single instance or from all events with that name
		*/
		that.unlisten = function (keyOrName)
		{
			var targetProp = CF.isNumber(keyOrName)? "key":"name";
			that.events = CF.arrayReject(that.events, 
				function (i, evt)
				{
					var eq = evt[targetProp] == keyOrName;
					if(eq) 
						CF.log("Unlistening event", keyOrName);
					return eq;
				}
			);
		};
		/**
		 * @description
		 * Removes all listeners to this eventListener 
		 */
		that.unlistenAll = function ()
		{
			that.events = {};
		};
		
		return that;
};


