/** 
 * @class
 * A class that adds in basic cursor support.  This is intended to be either used as a Mixin, or as an instance variable inside of a widget class.
 * You need to override the pageChanged method and wire it to the logic that fetches your data.
 * 
* @behavior {click} .cf_next_page Increments the offset by one page, and calls pageChanged
* @behavior {click} .cf_prev_page Decrements the offest by one page, and calls pageChanged
* @behavior {click} .cf_first_page Sets the offset to zero and calls pageChanged
* @behavior .cf_num_page The number of the current page will be placed in these elements
* @behavior .cf_num_items The number of items on the current page will be placed in to this element
* 
*/
CF.widget.Pageable = function (opts, that)
{
	var defOpts = { max_return:20, offset:0};
	opts = CF.extend(defOpts, (opts || {}));
	
	var p = {}; //private methods and vars
	p.maxReturn = opts.max_return;
	p.offset = opts.offset;
	p.lastReturnedLen = 0;

	that = that || {};
	
	that.getOffset = function ()
	{
		return p.offset;	
	};
	that.getMaxReturn = function ()
	{
		return p.maxReturn;
	};
	that.nextPage = function()
	{
		if (!that.isLastPage())
		{
			p.offset += Math.min(p.maxReturn, p.lastReturnedLen);
			that.pageChanged();

		}
	};
	that.toParams = function ()
	{
		return {max_return:p.maxReturn, offset:p.offset};
	};
	that.firstPage = function ()
	{
		p.offset = 0;	
		that.pageChanged();
	};
	that.prevPage = function ()
	{
		p.offset = Math.max(0, p.offset - p.maxReturn);
		that.pageChanged();
	};
	that.updateParams = function (params)
	{
		params = params || {};
		return CF.extend(params, that.toParams());	
	};
	that.getPageNum = function ()
	{
		if(that.isFirstPage())
		{
			return 1;
		}
		return 1 + Math.ceil(p.offset/p.maxReturn);
	};
	that.updatePager = function(itemList)
	{
		if (jQuery.isArray(itemList))
		{
			p.lastReturnedLen = itemList.length;
			that.updatePageNum(p.countElems);
			that.updateItemNum(p.countItemElems);
		}
	};
	that.updatePageNum = function (elems)
	{
		if (elems)
		{
			elems.html(that.getPageNum());
		}
	};
	that.updateItemNum = function (elems)
	{
		if(elems)
		{
			elems.html(p.lastReturnedLen);
		}
	};
	that.isLastPage = function ()
	{
		return  p.lastReturnedLen && (p.lastReturnedLen < p.maxReturn);	
	};
	that.isFirstPage = function ()
	{
		return p.offset == 0;
	};
	that.pageChanged = function ()
	{
		throw ("Pageable: pageChanged implementation required");
	};
	that.bindPagerEvents = function (elem)
	{
		p.nextElems = elem.find(".cf_next_page");
		p.prevElems = elem.find(".cf_prev_page");
		p.firstElems = elem.find(".cf_first_page");
		p.countElems = elem.find(".cf_num_page");
		p.countItemElems = elem.find(".cf_num_items");
		
		if (!that.isLastPage())
		{
			p.nextElems.click(CF.once(that.nextPage));
		}
		else
		{
			p.nextElems.addClass("cf_disabled_page");
		}
		if (!that.isFirstPage())
		{
			p.firstElems.click(CF.once(that.firstPage));
			p.prevElems.click(CF.once(that.prevPage));
		}
		else
		{
			p.firstElems.addClass("cf_disabled_page");
			p.prevElems.addClass("cf_disabled_page");
		}		
		that.updatePageNum(p.countElems);
		that.updateItemNum(p.countItemElems);
	};
	return that;	
};
