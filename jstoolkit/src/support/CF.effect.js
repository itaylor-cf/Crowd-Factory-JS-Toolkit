CF.effect = {};

/**
 * A hover effect that has a "grace period" before outFx is called and cancels the outFx firing if you mouse back into the 
 * hoverElem.
 * This allows you to make a more forgiving hover that doesn't snap shut the moment you mouseout
 * Grace Period is specified in seconds.
 */
CF.effect.Hover = function (hoverElem, inFx, outFx, gracePeriod)
{
	var that = {};
	if (!gracePeriod)
		gracePeriod = 0;
	that.timer = null;
	that.stopped = false;
	that.handleIn = function ()
	{
		if (that.stopped)
			return;
		
		that.clear();		
		var ref = this;
		if (inFx)
			inFx.call(ref, CF.toArray(arguments));
	};
	that.handleOut = function ()
	{
		if (that.stopped)
			return;
		that.clear();
		
		var args = CF.toArray(arguments);
		var ref = this;
		that.startGracePeriod(ref, args);		
	};
	that.startGracePeriod = function (ref, args)
	{
		that.timer = setTimeout(function ()
				{
					if(outFx)
						outFx.call(ref, args);
				}, gracePeriod * 1000
		);		
	};
	that.clear = function ()
	{
		if (that.timer)
		{
			clearTimeout(that.timer);
			that.timer = null;
		}
	};
	that.stop = function (){
		that.stopped = true;
	};
	that.restart = function ()
	{
		that.stopped = false;
	};
	jQuery(hoverElem).hover(that.handleIn, that.handleOut);
	return that;
};