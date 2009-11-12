CF.session = {};

/**
* An object that holds all of the currently registered persistence providers
*/

/**
 * The session provider for the HTML 5 localStorage, FF2+ Safari 4+, and IE 8+
 */
CF.session.localStorageProvider = function ()
{
	var store;
	var that = {};
	that.supported = function()
	{
		if (window.localStorage || window.globalStorage)
		{
			return true;
		}
		return false;
	};
	that.start = function (fx)
	{
		var locnoport = window.location.host.split(":")[0];
		store = window.localStorage || window.globalStorage[locnoport];
		var res= store["CF_store"];
		if(res)
			fx(res);
		else
			fx(null);
	};
	that.persist = function (val)
	{
		store["CF_store"]=val;
	};
	return that;
};

/**
 * A Session provider that uses Microsoft's userData behavior to store session data.
 * Should be used with IE 6 and 7.
 */
CF.session.msUserDataProvider = function ()
{
	var that = {};
	that.start = function (fx)
	{
		//start this after document.ready.
		jQuery(function (){
			jQuery("body").get(0).style.behavior = "url('#default#userData')";
			var elem = jQuery("body").get(0);
			var ok = false;
			if (elem)
			{
				elem.load("CF_Store");
				var res = elem.getAttribute("sPersist");
				if(res)
				{
					fx(res);
					ok = true;
				}
			}
			if (!ok)
				fx(null);
		});
	};
	that.supported = function ()
	{
		return jQuery.browser.msie && !window.localStorage;
	};	
	that.persist = function (val)
	{
		var elem = jQuery("body").get(0);
		if (elem)
		{
			elem.setAttribute("sPersist", val);
			elem.save("CF_Store");
		}
	};
	return that;
};
/**
 * The session providers for browsers that have a loaded copy of google gears (All versions of chrome do by default).
 */
CF.session.gearsProvider = function ()
{
	var that = {};
	var conn;
	that.start = function (fx)
	{
		conn = google.gears.factory.create('beta.database');
		conn.open('CF_Store');
		conn.execute( 'CREATE TABLE IF NOT EXISTS CF_Store (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)' );
		var result = conn.execute( 'SELECT v FROM CF_Store where k = ?', ['CF_Store']);
		if (result && result.isValidRow())
		{
			fx(result.field(0));			
		}else
		{
			fx(null);
		}
		result.close();
	};
	that.supported = function ()
	{
		if(window.google && google.gears)
		{
			return true;
		}
		return false;
	};	
	that.persist = function (val)
	{
		conn.execute( 'BEGIN' );
		conn.execute( 'INSERT OR REPLACE INTO CF_Store(k, v) VALUES (?, ?)', ['CF_Store',val] );
		conn.execute( 'COMMIT' );
	};
	return that;
};


/**
 * The session provider for browsers that support sqlLite (Safari 3.1+,  FF 3.1+)
 */
CF.session.sqlLiteHtml5Provider = function ()
{
	var conn;
	var that = {};
	that.supported = function()
	{
		if (window.openDatabase)
		{
			return true;
		}
		return false;
	};
	that.start = function (fx)
	{
		conn = window.openDatabase("CF_store", "1.0", "CF_Store", 1024 * 200);
		if (conn)
		{
			conn.transaction(function(conn){
				conn.executeSql( 'CREATE TABLE IF NOT EXISTS CF_Store (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)');
				conn.executeSql( 'SELECT k,v FROM CF_Store where k=?', ["CF_store"], function (conn, result)
						{
							if (result.rows && result.rows.length > 0)
							{
								fx(result.rows.item(0).v);
							}
							else
								fx(null);						
						});
			});
		}
	};
	that.persist = function (val)
	{
		conn.transaction(function(db){
			db.executeSql( 'INSERT OR REPLACE INTO CF_Store(k, v) VALUES (?, ?)', ["CF_store",val]);
		});
	};
	that.forceAtomic = true;
	return that;
};

CF.session.providers = [CF.session.localStorageProvider(), CF.session.gearsProvider(), CF.session.sqlLiteHtml5Provider(), CF.session.msUserDataProvider()];
CF.session.currentProvider = function ()
{
	return CF.arrayFind(CF.session.providers, function (i, prov){
				return prov.supported();
	});
}();

//= require <CF.cookie.js>
/**
 * @static
 * @class
 * <p>
 *  The CF.session.instance object gives you access to client-side persisted storage.
 *  You can use this storage to store arbitrary data in order to avoid repeated fetching of the same data on every page.
 *  </p><p>
 *  Since some persistence providers require time to load, this function has an event that is called when the session has been 
 *  loaded completely.  You can either use .isLoaded and .events properties to listen for the "session_loaded" event, or just call the whenLoaded
 *  function passing your callback function, this will ensure that you didn't miss the "session_loaded" event.
 *  </p><p>
 *  The data in the session will be preserved for one session length, where a session is defined by the lifetime of a cookie set without an expiration date
 *  on the client browser.   This will usually map to one open browser window's lifespan.
 *  </p><p>
 *  In the case that the browser does not support any of the mechanisms for keeping client side persistence, the .noPersist property will be set to true.
 *  The session instance will still allow you to add and remove values, and use it as a current page memory cache, but they will not be available on subsequent pages.
 *  </p><p>
 *  This session persistence can be reset at any time by the client clearing their cookies or clearing private data.  Do not store anything in the 
 *  session that you cannot refetch later from the server.  This is meant to be used as a cache of JSON data between page loads to avoid redundant REST calls
 *  it is not a general persistence mechanism.
 *  </p><p>
 *  <em>NOTE:</em> the current maximum size of data that can be stored is 64kb.  This is the size AFTER the data has been JSON encoded.  Errors will be thrown 
 *  if more than 64kb is stored.
 *  </p>
 */

CF.session.instance = function ()
{
	var maxSize = 64 * 1024; //The IE userData's restricted zone only allows for 64kb storage.  We make that our worst case, and thus our max supported size.
	var that = {};
	var prov = CF.session.currentProvider;
	var sessObj = {};
	that.events = CF.EventPublisher();
	/**
	 * This is the function that is called when the initial load of session data is completed.
	 */
	that.loadComplete = function (obj)
	{
		if(obj)
			sessObj = CF.evalFx(obj) || {};
		else
			sessObj = {};
		
		that.isLoaded = true;
		that.events.fire("session_loaded");		
	};
	/**
	 * A convenience method that takes a callback function that will be called as soon as the session is fully loaded.
	 * If the session is already loaded the callback will be called immediately.
	 * 
	 * @param {function} fx the function that will be called once the session is configured and its data is loaded.
	 * @param {boolean} once If true, the fx will only be called on the first "context_loaded" event.
	 */
	that.whenLoaded = function (fx, once)
	{
		if(that.isLoaded)
		{
			fx();
			if (!once)
				that.events.listen("session_loaded", fx, once);
		}
		else
			that.events.listen("session_loaded", fx, once);
	};
	/**
	 * gets a value from the session by key.
	 * @param {string} key The key to fetch data from
	 */
	that.get = function (key)
	{
		return sessObj[key];		
	};

	/**
	 * adds a key value pair to the session.
	 * @param {string} key 
	 * @param {object} value A value.  Values may be any object that can be JSON Serialized.
	 */	
	that.put = function (key, value)
	{
		sessObj[key] = value;
		that.afterAction();
	};
	
	/**
	 * Some persistence providers have persistence that happens asynchronously and thus
	 * cannot be handled on the unload event.  If the provider specifies that its persists need to 
	 * be forced atomically, we will persist after every change that happens to the session object
	 * Otherwise we rely on the window unload event to persist when the page is left.
	 */
	that.afterAction = function ()
	{
		if(prov && prov.forceAtomic)
		{
			that.persist();
		}	
	};
	/**
	 * Removes a value from the session by key, returning the value.
	 * @param {string} key The object to remove from the session.
	 */
	that.remove= function (key)
	{
		var v = sessObj[key];
		sessObj[key] = null;
		that.afterAction();
		return v;
	};
	/**
	 * Removes all values from the session.
	 * Useful for logouts, etc.
	 */
	that.clear = function ()
	{
		sessObj = {};
		that.afterAction();
	};
	/**
	 * Performs the actual persistence operation.  Under normal conditions, this is called automatically 
	 * on the window object's unload event, but under certain conditions, you may want to to persist the data
	 * manually.
	 */
	that.persist = function ()
	{
		var str = CF.toJSON(sessObj);
		
		if(str.length > maxSize)
			CF.error("Error persisting session.  Too much data");
		else
		{
			if(prov)
			{
				prov.persist(str);
			}
		}					
	};
	/**
	 * Detects if there is an active client side session, by checking for the cookie.
	 */
	that.hasSession = function ()
	{
		return CF.cookie.readCookie("CF_cSess") == "a";
	};
	
	/**
	 * This function makes sure that the clientSession data is not preserved across multiple sessions.
	 * It does this by setting a small cookie. If the cookie does not exist, the client session is cleared. 
	 * This way, the session follows normal cookie-based rules for session, regardless of which Session provider is used.
	 */
	that.ensureSession = function ()
	{
		that.whenLoaded(function ()
			{
				if(prov && !that.hasSession())
				{
					that.clear();
					CF.cookie.createCookie("CF_cSess", "a");
				}
			}
		);
	};
	
	that.ensureSession();
	if(prov)
	{
		prov.start(that.loadComplete);
	}
	else
	{
		that.noPersist = true;
		CF.error("No persistence provider found.");
		that.loadComplete(null);
	}
	/**
	 * We actually persist the data to the persistence provider when the page is unloaded.  This prevents unnecessary 
	 * writes to the persistence provider.
	 */
	jQuery(window).unload(that.persist); 
	
	return that;
	
}();