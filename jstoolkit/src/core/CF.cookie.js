/**
 * @class
 * Utilities functions for manipulating cookies
 * @static
 */

CF.cookie = function ()
{
	var that = {};
	/**
	 *  Creates a cookie
	 *  @param {string} name the cookie's name 
	 *  @param {string} value the cookies's value
	 *  @param {number} days  (optional) specifies the number of days to set the cookie for. If both this and hours are unset or null, a session cookie will be created.
	 *  @param {number} hours (optional) specifies the number of hours to set the cookie for.  If both this and days are unset or null, a session cookie will be created.
	 *  @param {string} path (optional) specifies the path for the cookie.  if unset it defaults to "/"
	 *  @return {string} the text of the cookie that was added to document.cookie. 
	 */
	that.createCookie = function (name,value,days,hours,path) 
	{
	  var expires = "";
	  var time = 0;
	  if (days) {
		time += days*24*60*60*1000;
	  }
	  if(hours) {
		  time += hours*60*60*1000;
	  }
	  if (time > 0)
	  {
	    var date = new Date();
	    date.setTime(date.getTime()+time);
	    expires = "; expires="+date.toGMTString();
	  }
	  if(!path)
	  {
		  path = "/";
	  }
	  var cook =name+"="+value+expires+"; path="+path;
	  document.cookie = cook;
	  return cook;
	};

	/**
	 * Fetches the value of a cookie.
	 * @param {string} name The name of the cookie to fetch.
	 * @return {string} value The value of the cookie or null if no cookie was set. 
	 */
	that.readCookie = function (name) {
	  var nameEQ = name + "=";
	  var ca = document.cookie.split(';');
	  for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	  }
	  return null;
	};
	/**
	 * "erases" a cookie.  This sets the cookie's value to the empty string and set it to expire yesterday.
	 * @param name
	 */
	that.eraseCookie = function (name) 
	{
	  that.createCookie(name,"",-1);
	};
	
	return that;
}();
