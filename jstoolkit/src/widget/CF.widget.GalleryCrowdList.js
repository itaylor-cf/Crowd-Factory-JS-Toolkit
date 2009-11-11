//= require <CF.widget.SimpleWidget.js>
//= require <CF.context.js>
//= require <CF.modal.js>

/**
 * @class
 * Extends the normal CrowdList to add some graphical flourishes for a "gallery" view.
 * Listens for nested CF.widget.Entity widget entity_activated events to trigger a modal
 * "lightbox" style effect to display the nested entity.
 * 
 * @extends CF.widget.CrowdList
 * @description 
 * You can pass options to the CF.modal object by setting a modalOpts Object property of the opts parameter.
 * Otherwise, the opts parameter behaves as in the {@link CF.widget.CrowdList}.
 * 
 * @behavior {hover} .cf_prev_page Fades in and fades out any .cf_prev_page_hover elements when hovered.
 * @behavior {hover} .cf_next_page Fades in and fades out any .cf_next_page_hover elements when hovered.
 * 
 * @usage
 * This class is heavily stylesheet reliant.  Here is an example stylesheet.
 * 
 * .cf_widgetLoader {display:none;}
	.cf_modal_bg {background-color:#FFF}
	.cf_modal_closer {float:right; font-size:25px; color:#666; cursor:pointer; margin-top:10px;}
	.cf_modal_header {text-align:center; height:40px;}
	.cf_modal_body {padding:0 10px 10px; background-color:#000; color:#666;}
	.cf_modal_load {margin:auto; width:31px; height:31px; background-image:url(../../images/greyspinner.gif);}
		
	.cf_gallerypane {background-color:#000; color:#888; height:420px; width:502px;}
	.cf_gallerypane .cf_gallerypage { text-align:right; line-height:30px; height:30px; border-bottom:1px solid #444;}
	.cf_gallerypane .cf_gallerybody{ width:390px; margin-left:56px;}
	.cf_gallerypane .cf_gallerybody .cf_galleryitem { margin:10px;float:left;}
	
	.cf_gallerypane .cf_imageborder {border:1px solid #444; width:100px; height:100px; padding:4px;}
	.cf_gallerypane .cf_entity_hover {width:100px; height:100px;}
	.cf_gallerypane .cf_entity_hover_target {color:#666; font-weight:bold;}
	.cf_gallerypane .cf_prev_page{float:left; height:420px; width:50px;}
	.cf_gallerypane .cf_prev_page .cf_prev_page_btn   {position:absolute; height:420px; width:50px; background:url(../../images/arrows-dk-left.gif) center center no-repeat;}
	.cf_gallerypane .cf_prev_page .cf_prev_page_hover {cursor:pointer; position:absolute; height:420px; width:50px; background:url(../../images/arrows-lt-left.gif) center center no-repeat;}
	.cf_gallerypane .cf_disabled_page .cf_prev_page_hover {height:0; visibility:hidden;}
	.cf_gallerypane .cf_next_page{float:right; height:420px; width:50px;}
	.cf_gallerypane .cf_next_page .cf_next_page_btn   {position:absolute; height:420px; width:50px; background:url(../../images/arrows-dk-right.gif) center center no-repeat;}
	.cf_gallerypane .cf_next_page .cf_next_page_hover {cursor:pointer; position:absolute; height:420px; width:50px; background:url(../../images/arrows-lt-right.gif) center center no-repeat;}
	.cf_gallerypane .cf_disabled_page .cf_next_page_hover {height:0; visibility:hidden;}
	.cf_gallerypane .cf_entity_hover_target { background:url(../../images/80transblack.png); text-align:center; min-height:50px; padding:2px; width:96px;border-bottom: 1px solid #444; position:absolute;}
	.cf_gallerypane .cf_entity_hover_target p{font-weight:bold; font-size:90%; color:#DDD;}
	.cf_gallerypane .cf_entity_activate{cursor:pointer;}
	
	.cf_loading_spinner {margin:0 auto; width:31px; height:31px; padding-top:195px; background:url(../../images/greyspinner.gif) no-repeat bottom;}

	//IE 6 Double margin on floats bug 
	*html .cf_gallerypane .cf_gallerybody .cf_galleryitem {display:inline;}			 

 */

CF.widget.GalleryCrowdList = function (targetElem, template, templateEngine, data, opts)
{
	opts = opts || {};
	opts.modalOpts =  opts.modalOpts || {modalElemClass:"cf_gallerymodal"};
	var that = CF.widget.CrowdList(targetElem, template, templateEngine, data, opts);
	
	that._hoverInBtn = function (elem)
	{
		elem.fadeIn();
	};
	that._hoverOutBtn = function (elem)
	{
		elem.fadeOut();
	};
	that.hoverInPrevPage = function ()
	{
		that._hoverInBtn(that.hoverPrevPage);
	};
	that.hoverOutPrevPage = function ()
	{
		that._hoverOutBtn(that.hoverPrevPage);
	};
	that.hoverInNextPage = function ()
	{
		that._hoverInBtn(that.hoverNextPage);
	};
	that.hoverOutNextPage = function ()
	{
		that._hoverOutBtn(that.hoverNextPage);
	};
	that.superBindEvents = that.bindEvents;
	that.bindEvents = function (elem, subWidgets)
	{
		that.superBindEvents(elem, subWidgets);
		that.hoverPrevPage = elem.find(".cf_prev_page_hover");
		that.hoverNextPage = elem.find(".cf_next_page_hover");
		that.modalTemplateElem = elem.find(".cf_modal_template");
		elem.find(".cf_prev_page").hover(that.hoverInPrevPage, that.hoverOutPrevPage);
		elem.find(".cf_next_page").hover(that.hoverInNextPage, that.hoverOutNextPage);
		jQuery.each(subWidgets, function (i, w){ 
    		if (w.type === "CF.widget.Entity")
    		{
    			w.widget.events.listen("entity_activated", that.activateFullView);
    		}
    	});
	};
	that.getDefaultTemplateBody = function ()
	{
	return "\
	<div class='cf_loading'>\
		<div class='cf_loading_spinner'></div>\
	</div>\
	<div class='cf_prev_page'>\
		<div class='cf_prev_page_btn'></div>\
		<div class='cf_prev_page_hover' style='display:none;'></div>\
	</div>\
	<div class='cf_next_page'>\
		<div class='cf_next_page_btn'></div>\
		<div class='cf_next_page_hover' style='display:none;'></div>\
	</div>\
	<div class='cf_gallerybody'>\
		<div class='cf_gallerypage'>\
			Showing [% pager.offset + 1 %] to [% items.length + pager.offset %] of [% list.item_count %]\
		</div>\
		<div class='cf_for' binding = 'items'>\
			<div class='cf_item cf_galleryitem'>\
				<div class='cf_widgetLoader cf_imageborder' widgettype='CF.widget.Entity' data='item.ExternalEntity'>\
					<div class='cf_entity_hover cf_entity_activate'>\
						<div class='cf_entity_hover_target' style='display:none;'>\
							<p>[% entity.title %]</p>\
						</div> \
						<img cf_src='[% entity.image_urls.smll_s %]' />\
					</div>\
				</div>\
			</div>\
			<div class='cf_item_empty'>\
				No items on this page.\
			</div>\
		</div>\
	</div>\
	<div class='cf_widgetLoader cf_modal_template cf_noprocess' widgettype='CF.widget.Entity'>\
			<img cf_src='[% entity.image_urls.larg_r %]' />\
			<h4>[% entity.title %]</h4>\
			<h5>[% entity.description %]</h5> \
	</div>";
	};
	that.activateFullView = function (evt, entity, widget)
	{
		var elem = that.modalTemplateElem.clone().removeClass("cf_noprocess");
		that.events.fire("gallery_modal_activated", entity, elem, that);
		CF.modal.show(elem, entity, opts.modalOpts);
	};
	return that;
};