/** @class */
CF.template = {};

//TODO: refactor all cf_tag processing to a plugin architecture to enable 
//dynamic adding of tags.
CF.template.Engine = function ()
{
	var that = {};
	
	that.getDefaultLoading = function ()
	{
		return CF.build(".cf_loading", "Loading...");
	};
	
	that.showLoadingMessage = function (targetElem, template, widgetLoadingMsg)
	{
		var loadingMsg = template.find(".cf_loading:first").remove();
		if(!loadingMsg || loadingMsg.length == 0)
	    {
	    	if (widgetLoadingMsg)
	    	{
	    		loadingMsg = widgetLoadingMsg;
	    	}
	    	else
	    	{
	    		loadingMsg = that.getDefaultLoading();
	    	}
		}
		targetElem.html(loadingMsg);
	};
	
	that._applyData = function (str, data)
	{
		if (str.indexOf("[%") == -1)
		{
			return str;
		}
		
		var len = str.length;
		var startExprPos = -1;
		var newStr = "";
		for (var i = 0; i < len; i++) 
        {
            var c = str.charAt(i);
            var peek = "";
            if ((i + 1) < len)
            {
            	peek = str.charAt(i+1);
            }
            
            var reset= false;
            
            if (c == '[' && peek == "%" )
            {
             	if (startExprPos !=  -1)
             		CF.error("Template: Cannot nest [% statements ");
                startExprPos = i;             	
            }
            else if (c == '%' && peek == "]")
         	{
         		var evalStr = str.substring(startExprPos+2, i);
         		var evaled = CF.evalFx(evalStr, data);
         		if(evaled !== null && evaled !== undefined)
         		{
         			newStr += evaled;             		
         		}
         		reset = true;
         		i++;
         	}    
	        if (startExprPos == -1)
	        {
	            newStr += c;
	        }
	        if (reset)
	        {
	        	startExprPos = -1;	
	        }
        }
        return newStr;
	};
	
	
    /**
    * Returns a jQuery wrapped node that has the rendered template DOM tree.
    * A possible speed enhancement... Stop using CF.build in walkDom and do the jQuery wrapping here instead of at 
    * each step in the walkDom rendering process.  Anything that uses the template engine wouldn't be able to tell the difference
    * 
    */
    
	that.render = function (template, data, isNotWidget)
	{
		that._idOffset = 0;
		that.subWidgets = [];
		var toRen = template;
		if (!isNotWidget)
		{
			if(template.jquery)
				template = template.get(0);
			toRen = template.childNodes;
		}
		return that._walkDom(data, toRen, true, false, true);
	};
	
	that.startSubWidgets = function ()
	{
		jQuery.each(that.subWidgets, 
		function(i, obj)
		{
			obj.widget.start();
		});
		return that.subWidgets;
	};
	
	that._processIf = function (ifNode, nodeType, nAttrs, data, inLoop)
	{
		var binding = nAttrs.binding;
		if (binding)
		{
			var val = CF.evalFx(binding, data, true);
			if(val)
			{
				var assign = nAttrs.assign === 'true';
				if (assign)
				{
					data = val;
				}				
				var nonElse = ifNode.clone();
				nonElse.children().remove(".cf_else");
				return that._walkDom(data, nonElse, false, inLoop, false, true);
			}
			else
			{
				var elseNode = CF.arrayFind(ifNode.get(0).childNodes, function (i, n){
					return CF.hasClass(n, "cf_else");
				});
				if (elseNode)
				{
					return that._walkDom(data, elseNode, false, inLoop, false);
				}
			}
		}
		else
		{
			CF.error("No binding attribute on cf_if node");
		}
		return null;
	};
	
	that._processChoice = function (choiceNode, nodeType, nAttrs, data, inLoop)
	{
		var binding = nAttrs.binding;
		if (binding)
		{
			var val = CF.evalFx(binding, data, true);
			var res = CF.first(choiceNode.find(".cf_condition"), function (i, node) 
			{
					var jqn = jQuery(node);
					var walknode = false;
					var hitone = false;
					
					var eq = jqn.attr("eq");
					var eq_s = jqn.attr("eq_s");
					var lt = jqn.attr("lt");
					var gt = jqn.attr("gt");
					if(eq !== undefined)
					{
						hitone = true;
						eq = CF.evalFx(eq, data, true);
						if(eq === val)
							walknode = true;							
					}
					if(eq_s !== undefined)
					{
						hitone = true;
						if(eq_s === val)
							walknode = true;							
					}	
					if(lt !== undefined)
					{
						hitone = true;
						lt = CF.evalFx(lt, data, true);
						if(val < lt)
							walknode = true;							
					}
					if(gt !== undefined)
					{
						hitone = true;
						gt = CF.evalFx(gt, data, true);
						if(val > gt)
							walknode = true;							
					}
					if(!hitone)
					{
						CF.error("No eq, eq_s, lt, or gt attribute specified for cf_condition node");
					}
					if (walknode)
						return that._walkDom(data, node, false, inLoop, false);
					return undefined;
				});
			if (res) return res;
			
			var otherwise = choiceNode.find(".cf_otherwise");
			if(otherwise && otherwise.length > 0)
			{
				return that._walkDom(data, otherwise.get(0), false, inLoop, false);
			}			
		}
		else
		{
			CF.error("No binding attribute on choice ");
		}
		return null;
	};
	
	that._processLoop = function (forNode, nodeType, nAttrs, data, inLoop)
	{
		var items = [];
		var binding = nAttrs.binding;
		if(binding)
		{
			var list = CF.evalFx(binding, data, true);
			if(!list)
			{
				CF.log("For loop binding failed or was undefined. Using empty array instead.", binding);
				list = [];
			}
			//Convenience binding to list when singular item bound.
			if (!jQuery.isArray(list))
			{
				list = [list];
			}
			
			var listNode = forNode.children(".cf_item");
			if(listNode.length == 0)
			{
				CF.error("For loop has no child node cf_item");
			}
			else
			{
				//Handle empty list
				if(list.length == 0)
				{
					var emptyItem = forNode.children(".cf_item_empty");
					if (emptyItem.length > 0)
					{
						items.push(that._walkDom(data, emptyItem, false, true, true));
					}	
				}
				else
				{
					var sep = forNode.children(".cf_item_sep");
					var last = forNode.children(".cf_item_last");
					var alt = forNode.children(".cf_item_alt");
					listNode = listNode.get(0);
					sep = sep.length == 0 ? null : sep.get(0);
					last = last.length == 0 ? null : last.get(0);
					alt = alt.length == 0 ? null : alt.get(0);
					var l = list.length;
					for(var i =0; i < l ; i++)
					{
						var d = {index:i, length: l, item:list[i], parent:data, idOffset:that._idOffset};
						if (alt && i % 2 == 1)
						{
							items.push(that._walkDom(d, alt.cloneNode(true), false, true, true));
						}
						else
						{
							items.push(that._walkDom(d, listNode.cloneNode(true), false, true, true));
						}
						//process separator node
						if(sep && i < l-1)
						{
							items.push(that._walkDom(d, sep.cloneNode(true), false, true, true));
						}
						//Process last node only on last 
						if(last && i == l-1)
						{
							items.push(that._walkDom(d, last.cloneNode(true), false, true, true));
						}
					}
				}
			}		
		}
		else
		{
			CF.error("No binding attribute on for loop");
		}
		//For loops render tags by default.
	   var tagRen = nAttrs.rendertag === undefined ? true : nAttrs.rendertag === 'true';  		
	   return that._makeNode(forNode, nodeType, nAttrs, items, inLoop, tagRen); 

	};
	
	/**
	 * IE 6, 7, and IE 8 when in IE 7 mode are stupid and don't have a real way to get node attributes, 
	 * and they stuff a bunch of crap into the attributes array.
	 * This method uses the IE proprietary outerHTML property to and then parses the attributes out of the outerHTML string.
	 * Using this instead of iterating through all the IE junk in the attributes array to determine what was a real attribute
	 * cut 1/3 of the time off rendering in IE 7.
	 * Amazing.
	 */
	that._ieOuterHTMLAttribParse = function (node, data)
	{
		
		var firstPart = node.outerHTML.split(">")[0].replace("<", "");
		//CF.log("OuterHTML: ", node.outerHTML);
		var len = firstPart.length;
		var nameStart = 0;
		var valStart = 0;
		var sep= "";
		var name = "";
		var result = {};
		var afterEq = false;
		for (var i = 0; i <= len; i++) 
        {
		    var c = firstPart.charAt(i);
            if (!afterEq)
            {
            	if(c == "=")
            	{
	            	afterEq = true;
	            	name = firstPart.substring(nameStart, i).replace(/\s/g, "");
            	}
            	else if(c == " ")
            	{
            	   nameStart = i;
            	}
            }
            else 
            {
            	if(!sep)
            	{
	            	if(c == "'" || c == '"')
	            	{
	            		sep = c;
	            		valStart = i+1;
	            	}
            		else
	            	{
            			sep = " ";
            			valStart = i;
	            	}
            	}
            	else if(c == sep || i == len)
            	{
            		append = false;
            		val = firstPart.substring(valStart, i);
            		nameStart = i + 1;
            		if (name.indexOf("cf_") == 0)
        			{
        				name = name.replace("cf_", "");
        			}
            		//CF.log("outerhtml attrib found", name, val);
            		result[name] = that._applyData(val, data);
            		sep = "";
            		afterEq = false;
            	}
            }
        }
		//HACK.  The outerhtml code above replaces & with &amp; which causes things to evaluate improperly.
		//Binding is especially prone to this.  TODO: figure out a way to solve this problem generically.
		if (result.binding)
		{
			result.binding = node['binding'];
		}
		return result;
    };
	
	
	that._getAttributes = function (node, data)
	{
		if(CF.isIE6() || CF.isIE7())
		{
			return that._ieOuterHTMLAttribParse(node, data);
		}
		var result= {};
		jQuery.each(node.attributes, function (i, attrib) {
			var name = attrib.name;
			if (name.indexOf("cf_") == 0)
			{
				name = name.replace("cf_", "");
			}
			var val = attrib.value;
			if(val && typeof val == "string")
			{
			  val = that._applyData(val, data);
	          result[name] = val;
			}
		});
		return result;
		
	};
	
	/**
	 * Returns either a document fragment or a jQuery wrapped element node
	 */
	that._makeNode = function (node, nodeType, nAttrs, nodeChildren, inLoop, tagRen)
	{
	   //rationalize the id node if in a loop.
	   if(tagRen && nodeType && nAttrs)
	   {
		   if (inLoop && nAttrs.id)
		   {
			   that._idOffset++;
			   nAttrs.id += "_" + that._idOffset;
		   }
		   //TODO: at this point, it might be possible clone the template node and then set the attrs 
		   //and append the nodeChildren as a document fragment. Instead of creating 
		   //a new node with CF.build.  Would this perhaps be faster, less prone to IE errors?
		   //Needs thorough investigation.
//		   if (node && node.cloneNode)
//			   return jQuery(node.cloneNode(false)).attr(nAttrs).append(CF.docFrag(nodeChildren));
		   return CF.build(nodeType, nAttrs, nodeChildren);	
	   }
	   return nodeChildren;	
	};
	
/**
 * The main recursive method of the template rendering engine.  This looks at an individual dom node in the template
 * applys any data expansions then calls itself for all child nodes, once all children have been processed, it rendered object.  
 * 
 * It may return a jQuery wrapped element node, a DocumentFragment node, or a string, depending on what is passed in.
 * The topNode passed in needs to always be an Element node, and because of this, the completed output will always be a jQuery wrapped Element node.
 * 
 */
	that._walkDom = function (data, node, isTop, inLoop, tagRen, ignoreTag)
	{
		var jqNode = null;
		var childNodes = [];
		var tagName = null;
		var hasAttributes = false;
		var nAttrs = {};
				
		//The valid inputs for node are :
		//DocumentFragment, TextNode, Element, jQuery wrapped element, array of nodes, NodeList?
		if(node.nodeType == 3)
		{	//Text node.  just run replace on the value and return the string representation.
			return that._applyData(node.data, data); 		
		}
		else if(node.jquery)
		{
			jqNode = node;
			node = jqNode.get(0);
		 	childNodes = node.childNodes;
			hasAttributes = true;
		}
		else if (node.nodeType == 11)
		{
			childNodes = node.childNodes;
		}
		else if (node.tagName)
		{//Element node.
			childNodes = node.childNodes;
			hasAttributes = true;
		}
		else if (jQuery.isArray(node))
		{
			childNodes = node;
		}
		//NodeList is hard to detect so it's the last in the list.
		else if(node.item)
		{
			childNodes = node;
		}
		
		if (hasAttributes)
		{
			if (!jqNode)
			{
				jqNode = jQuery(node);
			}
			if (CF.hasClass(node, "cf_noprocess"))
			{
				//The noprocess directive tells us that the code is meant to be passed through with 
				//no expansions or evaluation of the template.  This is useful when you want to write part of your widget
				//to be hidden and evaluated later on (IE: to keep in in the dom).
				//Basically, we can just return this node and be done.
				return jqNode.clone();
			}
			var nodeType = node.tagName.toLowerCase();
			//This sets up all of the attributes with any expansions that they need
			nAttrs = that._getAttributes(node, data);    
			
			//We want to allow the individual node's rendertag attribute to override whatever was passed in as the tagRen value.
			if (nAttrs.rendertag != undefined)
			{
				tagRen = nAttrs.rendertag === 'true'; 
			}
			
			if(!ignoreTag)
			{
				//This handles the case where there is a subwidget
				if (CF.hasClass(node, "cf_widgetLoader"))
				{
					CF.log("Found nested widget: " + jqNode.attr("widgettype"), node.className);
					var engineRes = CF.widget.process(jqNode, data, nAttrs.id);
					if (engineRes)
					{
						that.subWidgets.push(CF.extend({}, engineRes));
						return engineRes.targetElem;
					}
				}
				else if (CF.hasClass(node,"cf_for"))
				{
					return that._processLoop(jqNode,nodeType, nAttrs, data, inLoop); 
				}
				else if (CF.hasClass(node, "cf_choice"))
				{
					return that._processChoice(jqNode, nodeType, nAttrs, data, inLoop);
				}
				else if (CF.hasClass(node, "cf_if"))
				{
					return that._processIf(jqNode, nodeType, nAttrs, data, inLoop);
				}
			}
		}
		
	   //This is the case of standard node children
		var len = childNodes.length;
		var resArr= [];
		for(var i=0; i< len; i++)
		{
			var n = childNodes[i];
			resArr.push(that._walkDom(data, n, false, inLoop, true));
		}
	   return that._makeNode(node, nodeType, nAttrs, CF.docFrag(resArr), inLoop, tagRen); 
	};
	
	return that;
};