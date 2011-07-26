//= require <CF.widget.BaseInsightEntityWidget.js>

CF.widget.BookRenterVote = function(targetElem, template, templateEngine, data, opts) {
  opts.maxRating = opts.maxRating || 30;
  opts.rating = opts.rating || "Default";
  opts.noSuccessProfile = true;
  opts.whenRatedFx = CF.coerce(opts.whenRatedFx, "function");

  var that = CF.widget.BaseInsightEntityWidget(targetElem, template, templateEngine, data, opts);
  var synchronizer = CF.widget.BookRenterVote.synchronizer;
  that.fetchEntity = function(entityId) {
    synchronizer.fetchEntity(entityId, opts, that.verifyEntity);
  };
  that.getRating = function(entity) {
    if (entity && entity.entity_ratings) {
      return CF.arrayFind(entity.entity_ratings, function(i, r) {
        if (r.category == opts.rating) {
          r.actionCount = Math.round(r.count * r.average_rating);
          return r;
        }
      });
    }
    return { count : 0, actionCount : 0 };
  };

  that.render = function() {
    that.rating = that.getRating(that.entity);
    var isRated = synchronizer.hasRated[opts.entityId];
    var wrapClass = ".cf_countBubbleWrap";
    if(that.entity && isRated){
      wrapClass += ".cf_active";
    }
    var countElem = CF.build(wrapClass, CF.build(".cf_countBubble", "" + that.rating.actionCount));
    if(isRated && opts.whenRatedFx){
      setTimeout(opts.whenRatedFx, 10);
    }
    var imageUrl = CF.url.protocolize((that.rating.user_rating ? opts.imageurl_on : opts.imageurl) || "");
    var elem = CF.build(".cf_bookRenterVote", [ countElem,
        that.actionElem = CF.build(".cf_actionElem", CF.build("img", { src : imageUrl })).click(that.startFlow),
        that.loginHolder = CF.build(".cf_login_holder") ]);
    that.loginController.setElems(that.loginHolder, that.actionElem);
    return elem;
  };

  that.entityFetched = function (entity){
    that.draw();
  }
  
  that.startFlow = function() {
    if(!synchronizer.hasRated[opts.entityId]){
      that.loginController.registerStageFx("syndicationFx", that.performSyndication);
      that.loginController.registerStageFx("actionFx",CF.curry(that.beforeAction, that.vote));
      that.loginController.manualStartFlow({}, CF.extend({}, opts));
      that.loginController.addStage("reloadFx", that.refresh);
      that.loginController.addStage("BookRenterEmail");
      that.loginController.addStage("ShareResolver");
      that.loginController.addStage("RPXLogin");
      that.loginController.addStage("SignIn");
      that.loginController.nextStage();
    }
  };
  
  that.refresh = function (state, controller){
    that.events.listen("widget_drawn", function (){
      if(state.skippedEmail){
        controller.addStage("SuccessProfile");
      }
      controller.nextStage();
    });
    that.reload();
  }

  that.performSyndication = function (state){
    var params = state.syndParams || {};
    params.cflog_widgetname = opts.widgetName;
    that.syndicate(state.provider, opts.widgetName, opts.entityId, opts.syndicationUrl || location.href, params);
    that.loginController.nextStage();
  };
  
  
  that.vote = function() {
    var newRating = 1;
    if (that.rating.user_rating && that.rating.user_rating < opts.maxRating) {
      newRating = that.rating.user_rating++;
    }
    CF.context.api_v1.rating_entity_create(that.voteComplete, opts.entityId, opts.rating, newRating, {
      cflog_widgetname : opts.widgetName, increment : true });
  }
  that.voteComplete = function() {
    that.loginController.nextStage();
  };
  that.onReload = that.onStart
  return that;
};

CF.widget.BookRenterVote.synchronizer = function() {
  var that = {};
  that.ratings = [ "Default", "Vote" ];
  that.fetchInProgress = {};
  that.callbacks = {};
  that.reloadables = [];
  that.hasRated = {};
  that.fetchEntity = function (entityId, opts, callback)
  {
    if (!that.callbacks[entityId]) {
      that.callbacks[entityId] = [];
    }
    that.callbacks[entityId].push(callback);
    if (!that.fetchInProgress[entityId]) {
      that.fetchInProgress[entityId] = true;
      var userId = null;
      if (CF.context.auth_user) {
        userId = CF.context.auth_user.external_id;
      }
      CF.context.api_v1.entity_get(CF.curry(that.entityFetched, entityId), entityId, { rating : that.ratings,
        user : userId, cflog_widgetname : opts.widgetName });
    }
  };
  that.entityFetched = function(entityId, entity, error) {
    that.fetchInProgress[entityId] = false;
    if (!error && entity && entity.entity_ratings) {
      cf_jq.each(entity.entity_ratings, function(i, r) {
        if (that.ratings.indexOf(r.category) != -1 && r.user_rating) {
          that.hasRated[entityId] = true;
        }
      });
    }
    cf_jq.each((that.callbacks[entityId] || []), function(i, c) {
      c(entity, error);
    });
  }
  that.registerReloadable = function(brVoteInstance) {
    that.reloadables.push(brVoteInstance);
  }
  that.reloadAll = function() {
    cf_jq.each(that.reloadables, function(i, brVote) {
      brVote.reload();
    });
  }
  return that;
}();

//= require <CF.insight.StageBuilder.js>
//= require <CF.insight.BaseStage.js>
/**
 * The syndication success message and profile capture form.
 */

CF.insight.StageBuilder("BookRenterEmail", function(state, controller, opts) {

  var that = CF.insight.BaseStage(state, controller, opts);
  opts.offerEmailTxt = opts.offerEmailTxt || "Enter your email to receive the offer.";
  opts.commOptInMsg = CF.config.current.messagingText;

  that.getClassName = function() {
    return "cf_profile_collect";
  };

  that.fetchData = function(dataFetchedFx) {
    that.prov = that.syndProvs[state.provider];
    if (!state.needsProfile && state.user.email) {
      //The user has already entered their email
      state.skippedEmail = true;
      controller.nextStage(state);
    } else {
      dataFetchedFx();
    }
  };

  that.getTitle = function() {
    return CF.build(".cf_offer_email_msg", CF.build('.cf_title_label.cf_synd_icon_' + that.prov.abbr, CF.build(
        "span.cf_title_text_no_arrow", CF.context.auth_user.display_name)));
  };

  that.getBody = function() {

    var commOptInRow = (CF.config.current.messagingEnable) ? CF.build(".cf_regform_row", [
        CF.build("label", "&nbsp;"),
        CF.build("label.cf_wide", { "for" : "cf_comm_opt_in" }, [
            that.commOptIn = CF.build("input[type=checkbox][name=comm_opt_in][id=cf_comm_opt_in]"),
            CF.build("span.cf_comm_msg", opts.commOptInMsg) ]),

    ]) : "";

    body = CF.build(".cf_offer_email_form", [ CF.build(".cf_offeremail_msg", opts.offerEmailTxt),
        CF.build("form", that.makeEmail(state.user)), commOptInRow ]);
    that.needsSaveBtn = true;
    controller.track("Profile");
    return body;
  };
  
  that.getFooter = function() {
      return CF.build(".cf_offer_email_footer", [ CF.insight.privacyTerms(opts),
          CF.build("button.cf_btn_small.cf_button_small_gray", "Submit").click(that.save) ]);
  };
  
  that.ns = function(val) {
    return val || "";
  };
  
  that.makeEmail = function(extProfile) {
    that.emailLabel = CF.build("label", { "for" : "cf_email" }, "Your Email");
    that.emailObj = { validator : "email", className : "cf_validate cf_required", value : that.ns(extProfile.email),
      validator_msg : 'Please enter a valid email address' };
    that.elethatmail = CF.build("input[type=text]#cf_email", that.emailObj).keydown(CF.enterPressed(that.save));
    var elem = CF.build(".cf_regform_row", [ that.emailLabel, that.elethatmail ]);;
    return elem;
  };
  
  that.save = function() {
    if (CF.validate.run(that.elethatmail)) {
      CF.context.api_v1.user_create(that.saveComplete, state.user.external_id, {email: that.elethatmail.val()});
      CF.context.auth_user.email = that.elethatmail.val();
      if (that.commOptIn && that.commOptIn.val()) { 
        CF.context.api_v1.attribute_user_add(null, "MESSAGING_ENABLED", true);
      }
    }
    opts.noSuccessProfile = true;
    controller.nextStage();
  };
  that.saveComplete = function(result, error) {
    if (!error) {
      controller.track("ProfileSaved");
      controller.nextStage(state);
    }
  };
  that.dismissed = function() {
    controller.track("ProfileDismissed");
    controller.nextStage(state);
  };
  return that;
});
