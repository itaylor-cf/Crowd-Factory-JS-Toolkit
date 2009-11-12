//= require <CF.widget.SimpleWidget.js>
/**
 * @class
 * A widget used upload images to the Image CMS
 * @extends CF.widget.SimpleWidget
 * @description 
 * @behavior .cf_upload_form_template Elements to place inside the iframe's upload form.
 * @behavior {click} .cf_change_image Once an image has already been uploaded, this allows you to upload a different image with the same form.
 * @behavior .cf_upload_error_msg The element that will be displayed with the error message when an uploading error has occurred.
 * @behavior .cf_upload_iframe The actual iframe element that will be used for the iframe upload.
 * @behavior .cf_iframe_holder The container that wraps the iframe.  It will be hidden when the upload has began.
 * @behavior .cf_iframe_upload_progress The elements to show when the upload is in progress (after submit but before the finish).
 */
CF.widget.ImageUpload = function (targetElem, template, templateEngine, data, opts)
{
	var defaultOpts = {
		iframeUrl:null,
		params:	{},
		errorFadeTimeMs:10000
	};	
	opts = CF.extend(defaultOpts, opts);
	CF.extend(opts.params, CF.context.api_v1.opts); //Copy in all API opts as params
	
	if (!opts.iframeUrl)
	{
		CF.error("iframeUrl option is not set.  It is required and must point to the iframe that will perform the upload.");
		return null;
	}
	var that = CF.widget.SimpleWidget(targetElem, template, templateEngine, data, opts);
	that.imageUrl = null;
	that.imageId = null;
	
	that.onStart = function ()
	{
		that.onReload();
	};	
	that.onReload = function ()
	{
		that.iframeId = "iframe_" + CF.iframe.frameCount++;
		that.draw();
	};
	that.getData = function()
	{
		var src = CF.url.addParam("iframeId", that.iframeId, opts.iframeUrl);
		return {iframeSrc:src, iframeId:that.iframeId, 
			image:that.image, authUser:CF.context.auth_user, errorMsg:that.errorMsg};
	};
	that.getDefaultTemplateBody = function ()
	{
		var templ = 
	"<div class='cf_if' binding='authUser'>\
		<div class='cf_if' binding='errorMsg'>\
			<div class='cf_upload_error_msg'>[%errorMsg%]</div> \
		</div>\
		<div class='cf_if' binding='image'> \
			<div class='cf_uploaded_image'>\
				<img cf_src='[%image.thumb_nail_url%]' id='[%image.external_id%]'></img>\
				<button class='cf_change_image'>Change</button>\
			</div>\
			<div class='cf_else'>\
				<div class='cf_iframe_holder'>\
					<iframe class='cf_upload_iframe' cf_src='[%iframeSrc%]' frameborder=0 ></iframe>\
				</div>\
				<div class='cf_iframe_upload_progress' style='display:none'>Uploading...</div>\
			</div>\
		</div>\
		<div class='cf_noprocess cf_upload_form_template' style='display:none'>\
			<input type='file' class='cf_upload_input' name='uploadFile'>\
			<button type='submit' class='cf_upload_submit'>Upload</button>\
		</div>\
		<div class='cf_else'>\
			You must be logged in to upload an image.\
		</div>\
	</div>\
	";
		return templ;
	};
	that.iframeReady = function (evt, iframeComm)
	{
		that.iframeComm = iframeComm;
		opts.params.image_file = 'uploadFile';
		var api = CF.context.api_v1;
		iframeComm.run(opts.params, that.uploadFormTemplate.clone().show(), api.hostname + api.path + "v1/image/create");
	};
	that.iframeSuccess = function(evt, iframeComm, id, url)
	{
		that.iframeComm = iframeComm;
		CF.context.api_v1.entity_get(that.fetchedImage, id);
	};
	that.fetchedImage = function (image, error)
	{
		if(error)
		{
			that.errorMsg = error.error_str;
			that.events.fire("imageupload_fail", that, error.error_str, error.error_code);
		}
		else{
			that.imageUrl = image.url;
			that.imageId = image.external_id;	
			that.image = image;
			that.events.fire("imageupload_success", that, that.imageId, that.imageUrl);
		}
		/**
		 * @name CF.widget.ImageUpload#imageupload_success
		 * @event
		 * @description
		 * Fired when an image upload has failed. 
		 * @param {CF.widget.ImageUpload} The current widget object.
		 * @param {String} id The entity id of the uploaded image.
		 * @param {Number} url The url of the thumbnail size of the uploaded image.
		 */
		that.reload();
	};
	that.iframeFail = function (evt, iframeComm, errStr, errCode)
	{
		that.iframeComm = iframeComm;
		that.errorMsg = errStr;
		/**
		 * @name CF.widget.ImageUpload#imageupload_fail
		 * @event
		 * @description
		 * Fired when an image upload has failed. 
		 * @param {CF.widget.ImageUpload} The current widget object.
		 * @param {String} errStr The error message.
		 * @param {Number} errStr The error code.
		 */
		that.events.fire("imageupload_fail", that, errStr, errCode);
		that.reload();		
	};
	/**
	 * Override this and return false to prevent the submit from firing.  Useful for validation.
	 */
	that.iframeUploadStart = function (evt)
	{
		/**
		 * @name CF.widget.ImageUpload#imageupload_started
		 * @event
		 * @description
		 * Fired when the user has started the upload by submitting the upload form in the iframe.
		 * @param {CF.widget.ImageUpload} The current widget object.
		 */
		var results = that.events.fire("imageupload_started", that);
		var ok = true;
		jQuery.each(results, function (i, r)
		{
			if (r === false)
				ok = false;
		});
		if (!ok)
			return false;
		that.errorMsg = null;
		that.uploadErrorMsg.hide();
		//The set timeout is here for Safari, which will not allow a file upload to start in a hidden element, this gives it time to start before hiding.
		setTimeout(function (){that.iframeHolder.hide(), that.iframeUploadProgress.fadeIn();}, 100);
		return true;
	};
	that.updateParams = function (params)
	{
		CF.extend(opts.params, params);
		if(that.iframeComm)
		{
			that.iframeComm.updateParams(opts.params);
		}
	};	
	that.newImage = function ()
	{
		that.imageUrl = null;
		that.imageId = null;
		that.image = null;
		that.reload();
		that.errorMsg = null;
	};
	that.bindEvents = function (elem, subWidgets)
	{
		that.uploadFormTemplate = elem.find(".cf_upload_form_template");
		that.uploadErrorMsg = elem.find(".cf_upload_error_msg");
		that.iframeElem = elem.find(".cf_upload_iframe");
		that.iframeHolder = elem.find(".cf_iframe_holder");
		that.iframeUploadProgress = elem.find(".cf_iframe_upload_progress");
		that.changeImage = elem.find(".cf_change_image").click(that.newImage);
		var evts = CF.iframe.events;
		evts.listen(that.iframeId + "_ready", that.iframeReady);
		evts.listen(that.iframeId + "_success", that.iframeSuccess);
		evts.listen(that.iframeId + "_fail", that.iframeFail);
		evts.listen(that.iframeId + "_uploadStart", that.iframeUploadStart);
		var ifId = that.iframeId;
		if (that.uploadErrorMsg.length > 0)
		{
			setTimeout(function (){if (ifId == that.iframeId) that.uploadErrorMsg.fadeOut();}, opts.errorFadeTimeMs);
		}
	};
	return that;
};
