
/*
Date Format 1.1
(c) 2007 Steven Levithan <stevenlevithan.com>
MIT license
With code by Scott Trenda (Z and o flags, and enhanced brevity)

http://blog.stevenlevithan.com/archives/date-time-format
*/

/*** dateFormat
Accepts a date, a mask, or a date and a mask.
Returns a formatted version of the given date.
The date defaults to the current date/time.
The mask defaults ``"ddd mmm d yyyy HH:MM:ss"``.

*/

/**
 * @function
 */
CF.dateFormat = function () {
	var	token        = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloZ]|"[^"]*"|'[^']*'/g;
	var timezone     = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
	var timezoneClip = /[^-+\dA-Z]/g;
	var pad = function (value, length) {
		value = String(value);
		length = parseInt(length) || 2;
		while (value.length < length)
			value = "0" + value;
		return value;
	};

// Regexes and supporting functions are cached through closure
return function (date, mask) {
	// Treat the first argument as a mask if it doesn't contain any numbers
	if (
		arguments.length == 1 &&
		(typeof date == "string" || date instanceof String) &&
		!/\d/.test(date)
	) {
		mask = date;
		date = undefined;
	}

	date = date ? new Date(date) : new Date();
	if (isNaN(date))
		throw "invalid date";

	var dF = CF.dateFormat;
	mask   = String(dF.masks[mask] || mask || dF.masks["default"]);

	var	d = date.getDate(),
		D = date.getDay(),
		m = date.getMonth(),
		y = date.getFullYear(),
		H = date.getHours(),
		M = date.getMinutes(),
		s = date.getSeconds(),
		L = date.getMilliseconds(),
		o = date.getTimezoneOffset(),
		flags = {
			d:    d,
			dd:   pad(d),
			ddd:  dF.i18n.dayNames[D],
			dddd: dF.i18n.dayNames[D + 7],
			m:    m + 1,
			mm:   pad(m + 1),
			mmm:  dF.i18n.monthNames[m],
			mmmm: dF.i18n.monthNames[m + 12],
			yy:   String(y).slice(2),
			yyyy: y,
			h:    H % 12 || 12,
			hh:   pad(H % 12 || 12),
			H:    H,
			HH:   pad(H),
			M:    M,
			MM:   pad(M),
			s:    s,
			ss:   pad(s),
			l:    pad(L, 3),
			L:    pad(L > 99 ? Math.round(L / 10) : L),
			t:    H < 12 ? "a"  : "p",
			tt:   H < 12 ? "am" : "pm",
			T:    H < 12 ? "A"  : "P",
			TT:   H < 12 ? "AM" : "PM",
			Z:    (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
			o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4)
		};

	return mask.replace(token, function ($0) {
		return ($0 in flags) ? flags[$0] : $0.slice(1, $0.length - 1);
	});
};
}();

//Some common format strings
CF.dateFormat.masks = {
"default":       "ddd mmm d yyyy HH:MM:ss",
shortDate:       "m/d/yy",
mediumDate:      "mmm d, yyyy",
longDate:        "mmmm d, yyyy",
fullDate:        "dddd, mmmm d, yyyy",
shortTime:       "h:MM TT",
mediumTime:      "h:MM:ss TT",
longTime:        "h:MM:ss TT Z",
isoDate:         "yyyy-mm-dd",
isoTime:         "HH:MM:ss",
isoDateTime:     "yyyy-mm-dd'T'HH:MM:ss",
isoFullDateTime: "yyyy-mm-dd'T'HH:MM:ss.lo"
};

//Internationalization strings
CF.dateFormat.i18n = {
dayNames: [
	"Sun", "Mon", "Tue", "Wed", "Thr", "Fri", "Sat",
	"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
],
monthNames: [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
	"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
]
};


/**
 * Creates a "friendly" date 
 * If the date was less than a moment ago it displays "Moments ago"
 * If the date was less than an hour ago it displays "n minuntes ago"
 * If the date was today it displays "Today @ h:MM TT"
 * If the date was yesterday it displays "Yesterday @ h:MM TT"
 * Otherwise it displays "mmm d, yyyy @ h:MM TT"
 * 
 * This relies on the date format code above to format the dates. 
 * 
 * @param date a javascript date object.  Easily created from a Crowd Factory REST date by using new Date() 
 * Eg for an external entity ent:
 * 
 * var txtDate = CF.friendlyDate(new Date(ent.created));
 */
CF.friendlyDate = function(date)
{
	if(typeof date != 'date')
	{
		date = new Date(date);
	}
	var now = new Date();
	var hourAgo = new Date(now.getTime() - (60*60*1000));
	if (date.getTime() > hourAgo.getTime())
	{
	  var n = (now.getTime() - date.getTime()) / (60 * 1000);
	  if (n <= 1)
	  {
	    return "Moments ago";
	  }
	  return "" + Math.ceil(n) + " minutes ago"; 
	}
	if (date.toDateString() == now.toDateString())
	{
		return "Today @ " + CF.dateFormat(date, "h:MM TT"); 
	}
	var yesterday = new Date();
	yesterday.setDate(now.getDate()-1);
	if (yesterday.toDateString() == date.toDateString())
	{
		return "Yesterday @ " + CF.dateFormat(date, "h:MM TT");
	}
	return CF.dateFormat(date, "mmm d, yyyy @ h:MM TT");	
};
