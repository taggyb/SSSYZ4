// Cactus.js, created on 2013
(function(){

  // Initial Setup
  // -------------

  // Save a reference to the global object (`window` in the browser, `exports`
  // on the server).
  var root = this;
  // Save the previous value of the `Cactus` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousCactus = root.Cactus;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // The top-level namespace. All public Cactus classes and modules will
  // be attached to this. Exported for both the browser and the server.
  var Cactus;
  if (typeof exports !== 'undefined') {
    Cactus = exports;
  } else {
    Cactus = root.Cactus = {};
  }

  // Current version of the library. Keep in sync with `package.json`.
  Cactus.VERSION = '1.1.0';

  // Require Underscore, if we're on the server, and it's not already present.
  var _ = root._;
  if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

  // For Cactus's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Cactus.$ = root.jQuery || root.Zepto || root.ender || root.$;

  // Runs Cactus.js in *noConflict* mode, returning the `Cactus` variable
  // to its previous owner. Returns a reference to this Cactus object.
  Cactus.noConflict = function() {
    root.Cactus = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Cactus.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Cactus.emulateJSON = false;

  var Events = Cactus.Events = {

	on: function(name, callback, context) {
      if (!callback){ 
      		return this;
      	}

      if(!name){
        return this;
      }

      if(!this._events){
      	this._events = {};
      	} 

      if(!(this._events[name])){
      	this._events[name] = [];
      }

      this._events[name].push({callback: callback, context: context || this});

      return this;
    },

    off: function(name, callback) {
      if (!this._events) {
      	return this;
      	}

      if (!this._events[name]){
      	return this;
      }

      if(name && !callback){
      	this._events[name] = [];
      	return this;
      }
      
      if (!name && !callback) {
        this._events = {};
        return this;
      }

      this._events[name] = _.reject(this._events[name] function(event){ 
      	event.callback == callback;
      })

      return this;
    },

    trigger: function(name) {
      if (!this._events){
		return this;
		}

	  if(!name){
	  	return this;
	 	 }

      var args = Array.prototype.slice.call(arguments, 1)

      var events = this._events[name];

      var allEvents = this._events['all'];

      if (events && events.length) {
      	_.each(events, function(event){
          event.callback.apply(event.context, args);
        });
      }

      if (allEvents && allevents.length) {
      	_.each(allEvents, function(event){
          event.callback.apply(event.context. arguments)
        });
      	};

      return this;
    },
};

  _.extend(Cactus, Events);


var Cactus = Cactus || {};

Cactus.Model = function(attributes, options) {
	var newAttributes = attributes || {};
	if (!options) {
		options = {};
	}
	this.clientId = _.uniqueId('cactusModel');
	this.attributes = {};
	
	if (options.collection) {
		this.collection = options.collection;
	}
	if (options.parse) {
		newAttributes = this.parse(newAttributes, options) || {};
	}
	var defaults = _.result(this, 'defaults');
	if (defaults) {
		newAttributes = _.defaults({}, newAttributes, defaults);
	}
	this.set(newAttributes, options);
	this.initialize.apply(this, arguments);
};

_.extend(Cactus.Model.prototype, Cactus.Events, {
	initialize: function() {},

	toJSON: function() {
		return _.clone(this.attributes);
	},

	sync: function() {
		return Cactus.sync.apply(this, arguments);
	},
	
	get: function(attribute) {
      return this.attributes[attribute];
    },
    
    has: function(attribute) {
      return this.get(attribute) != null;
    },

	set: function(key, value, options) {
		if (key === null) {
			return this;
		}
		
		var attributesToSet = {};
		if (typeof key === 'object') {
			attributesToSet = key;
			options = value;
		} else {
			attributesToSet[key] = value;
		}

		if (!options) {
			options = {};
		}

		var isSet = !options.unset;
		var changedAttributes = [];
		var newValue;
		
		for (var attribute in attributesToSet) {
			newValue = attributesToSet[attribute];

			var currentValue = this.attributes[attribute];
			if (!_.isEqual(currentValue, newValue)) {
				changedAttributes.push(attribute);
			}

			if (isSet) {
				this.attributes[attribute] = newValue;
			} else {
				delete this.attributes[attribute];
			}
		}

		if (!options.silent) {
			for (var i = changedAttributes.length - 1; i >= 0; i--) {
				newValue = this.attributes[changedAttributes[i]];
				this.trigger('change:' + changedAttributes[i], this, newValue, options);
			}
		}

		return this;
	},

	unset: function(attribute, options) {
		return this.set(attribute, undefined, _.extend({}, options, {unset: true}));
	},

	clear: function(options) {
		var emptyAttributes = {};
		for (var key in this.attributes) {
			emptyAttributes[key] = undefined;
		}
		return this.set(emptyAttributes, _.extend({}, options, {unset: true}));
	},
	
	fetch: function(options) {
		var fetchOptions = {};
		if (options) {
			fetchOptions = _.clone(options);
		}

		var model = this;
		
		var callback = fetchOptions.success;
		fetchOptions.success = function(response) {
			var parsedResponse = model.parse(response, fetchOptions);
			var setSuccess = model.set(parsedResponse, fetchOptions);
			if (!setSuccess) {
				return false;
			}

			if (callback) {
				callback(model, response, fetchOptions);
			}
			model.trigger('sync', model, response, fetchOptions);
		};
		wrapError(this, fetchOptions);

		return this.sync('read', this, fetchOptions);
	},

	destroy: function(options) {
		options = options ? _.clone(options) : {};
    	var model = this;
    	var callback = options.success;

     	var destroy = function() {
     		model.trigger('destroy', model, model.collection, options);
    	};

    	options.success = function(response) {
        	if (options.wait || model.isNew()) destroy();
        	if (callback) callback(model, response, options);
        	if (!model.isNew()) model.trigger('sync', model, response, options);
    	};

    	if (this.isNew()) {
        	options.success();
        	return false;
    	}
    	wrapError(this, options);

    	var xhr = this.sync('delete', this, options);
    	if (!options.wait) {
    		destroy();
    	}
    	return xhr;
	},

	url: function() {
		var urlRoot = _.result(this, 'urlRoot') || _.result(this.collection, 'url');
		if (!urlRoot) {
			throw new Error("A url property or function must be specified");
		}

		if (this.isNew()) return urlRoot;
    		return urlRoot + (urlRoot.charAt(urlRoot.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
	},
	
	parse: function(response, options) {
		return response;
	}
});

var Collection = Cactus.Collection = function(models, options) {
    if(!options)
     options = {};
     
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
	this.length = 0;
    this.models = [];
    this._byId  = {};
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));


};

var setOptions = {add: true, remove: true, merge: true};
var addOptions = {add: true, remove: false};
  
  //collections inheritable methods _.extend(dest, sources*)
  _.extend(Collection.prototype, Events, {
  
   model: Model, //default
   
   initialize: function(){}
   
   //same
   toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },
    
	//same
     sync: function() {
      return Cactus.sync.apply(this, arguments); //uses cactus's sync method.
    },
    
    //rearranged
    add: function(models, options) {
    var addOpt = { merge:false };
    	addOpt = _.extend(addOpt, options, addOptions);
    return this.set(models, addOpt); 
    },
    
    //rearranged. no choice. splice method is the best way to delete obj given an array
    remove: function(models, options) {
	if(!options)
	options = {};
    if( toString.call(models) == '[object Array]'){ 
    models = _.clone(models);
    var len = models.length;
    //splice method
    for(var i = 0; i < len; i++){
    model[i] = this.get(models[i]);
    model = model[i];
    if(!model) continue;
	delete this.byId(model.id); //not sure why must delete by id, but i just follow
	delete this.byId(mode.cid);
	index = this.indexOf(model);
	this.models.splice(index,1);
	len--;
	// if options is not used, i can remove this.
	// cannot find correct reference to model.trigger
		if(!options.silent){
		options.index = index;
    	model.trigger('remove', model, this, options);
		}
    }
    else{
    delete this._byId[models.id];
    delete this._byId[models.cid];
    if(!options.silent){
	options.index = index;
    models.trigger('remove', models, this, options);
    this._removeReference(models);
	}
    	}
    },
    
    //similar to model:set
    set: function(models, options) {
    	var singular = false;
      options = _.defaults({}, options, setOptions);
      if (options.parse) 
      models = this.parse(models, options); //?
      models = singular ? (models ? [models] : []) : _.clone(models);
      if(toString.call(models) == '[object Array]')
      	models = _.clone(models);
      else{
     singular = true;
      if(models) models = [models];
      else models = [];
      } 
      
      var sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;


//Turn bare objects into model references, and prevent invalid models from being added.
	  var attrs, id, model;
      for (var i = 0,len = models.length; i< len; i++) {
        attrs = models[i];
        if (attrs instanceof Model) { //is a model reference
          model = attrs;
          id = model;
        } else {
          id = attrs[targetModel.prototype.idAttribute];
        }

//If a duplicate is found, prevent it from being added and optionally merge it into the existing model.

 		var existing;
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
          	if (attrs===model) attrs = model.attributes;
            //if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

//If this is a new, valid model, push it to the toAdd list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);

//Listen to added models' events, and index models for lookup by id and by cid.
          model.on('all', this._onModelEvent, this);
          this._byId[model.cid] = model;
          if (model.id != null) this._byId[model.id] = model;
        }
        if (order) order.push(existing || model);
      }

//Remove nonexistent models if appropriate. 
      if (remove) {
        for (i = 0, len = this.length; i < len; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

//See if sorting is needed, update length and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, len = toAdd.length; i < len; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

//Silently sort the collection if appropriate.

      if (sort) this.sort({silent: true});

//Unless silenced, it's time to fire all appropriate add/sort events.

      if (!options.silent) {
        for (i = 0, len = toAdd.length; i < len; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

//Return the added (or merged) model (or models).
	if(singular) return models[0];
	else return models;

    },
    
    //same
    reset: function(models, options) {
    if(!options) options = {};
    var len = this.models.length;
      for (var i = 0; i < len; i++) {
        this._removeReference(this.models[i]);
      }
      options.previousModels = this.models; //is never used.
      this.length = 0;
      this.models = [];
      this._byId  = {};
      var resetOpt = {silent:true};
      	  resetOpt = _.extend(resetOpt,options); //may have problems
      models = this.add(models, resetOpt);
      if (!options.silent) 
      this.trigger('reset', this, options);
      return models;
    },
    
    //add model to end of collection
    push: function(model, options) {
        model = this._prepareModel(model, options);
        this.add(model, _.extend({at: this.length}, options));
        return model;
    },
    
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj.id] || this._byId[obj.cid] || this._byId[obj];
    },
    
    at: function(index) {
      return this.models[index];
    },
    
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) {
      	if(first)return void 0;
      	else return [];
      	} 
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },
    
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },
    
    
    fetch: function(options) {
    if(options) options = _.clone(options);
    else options = {}:

      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
      var method;
      if(options.reset) method = 'reset';
      else method = 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },
    
     create: function(model, options) {
    if(options) options = _.clone(options);
    else options = {}:
    	model = this._prepareModel(model, options);
      if (!model) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, options) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },
    
     parse: function(resp, options) {
      return resp;
    },
    
    //same:(
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) { //if attrs is already a model obj, just set its collection return
        if (!attrs.collection) 
        	attrs.collection = this;
        return attrs;
      }
      //if not object, we will have to create a new model
      if(options) options = _.clone(options);
      else options = {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },
    
    _removeReference: function(model) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },
    
    });//END EXTEND
    
    //all the underscore methods we need
    var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain'];

var View = Cactus.View = function(options) {
    if(!options){
    	options = {};
    }
    this.el = options.el;
    this.events = options.events;
    this.model = options.model || {};
    this.initialize.apply(this, arguments);
  }

   _.extend(Cactus.View.prototype, Cactus.Events, {

   	initialize: function(){},

      // Default render, overwrite this with own implementation
   	 render: function() {
      return this;
    },

    setElement: function(element, delegate) {
      this.$el = element;
      this.el = this.$el[0];
      if (delegate !== false) {
        this.delegateEvents();
      }
      return this;
    },

     delegateEvents: function(events) {
      var delegateEventSplitter = /^(\S+)\s*(.*)$/;
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) {
          method = this[events[key]];
        }
        var match = key.match(delegateEventSplitter);
        var eventName = match[1];
        var select = match[2];
        method = _.bind(method, this);
        if (select === '') {
          this.$el.bind(eventName, method);
        } else {
          this.$el.bind(eventName, select, method);
        }
      }
      return this;
    }
});

   Cactus.sync = function(method, model, options){
var methods = {
    'create': 'POST',
    'update': 'PUT',
    'delete': 'DELETE',
    'read':   'GET'
  };
var type = methods[method];
var params = { type: type, dataType: 'json'};
if(!options){
	options = {};
}

 if (!options.url) {
 		if(_.result(model, 'url'))
      params.url = _.result(model, 'url') 
        else
        params.url = function(){
        throw new Error("Sync Error: url property not specified")
        }
    }
    
  switch(method){
  case 'create':
  case 'update':
  if(options.data == null && model){
	params.contentType = 'application/json';
	var dataSync;
	if(options.attrs){
	dataSync = options.attrs;
	}
	else if(model.ToJSON(options)){
	dataSync = model.toJSON(options);
	}
	params.data = JSON.stringify(dataSync);
}	
  case 'delete':
  	params.processData = false;
  	break;
  }

options.xhr = Cactus.ajax(_.extend(params, options));
var xhr = options.xhr;
model.trigger('request', model, xhr, options);
return xhr;
};

Cactus.ajax = function() {
    return Cactus.$.ajax.apply(Cactus.$, arguments);
  };

//Router function

//intialize
//route
//navigate

var Router = Cactus.Router = function(options) {
    if(!options){
      options = {};
    }
    this.routes = options["routes"];
    if(this.routes){          // bind routes
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    }
    this.initialize.apply(this, arguments);
};


//Cached regular expressions for matching named param parts and splatted parts of route strings.

var optionalParam = /\((.*?)\)/g;
var namedParam    = /(\(\?)?:\w+/g;
var splatParam    = /\*\w+/g;
var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;


//Set up all inheritable Backbone.Router properties and methods.

_.extend(Router.prototype, Events, {


//Initialize is an empty function by default. Override it with your own initialization logic.

initialize: function(){},


//Manually bind a single named route to a callback. For example:this.route('search/:query/p:num', //'search', function(query, num) {
//  ...
//});

route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Cactus.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        callback && callback.apply(router, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Cactus.history.trigger('route', router, name, args);
      });
      return this;
},


//Simple proxy to Backbone.history to save a fragment into the history.

navigate: function(fragment, options) {
      Cactus.history.navigate(fragment, options);
      return this;
},



//Convert a route string into a regular expression, suitable for matching against the current //location hash.

_routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^\/]+)';
                   })
                   .replace(splatParam, '(.*?)');
      return new RegExp('^' + route + '$');
},


//Given a route, and a URL fragment that it matches, return the array of extracted decoded //parameters. Empty or unmatched parameters will be treated as null to normalize //cross-browser behavior.

_extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param) {
        return param ? decodeURIComponent(param) : null;
      });
    }

});

// Cactus.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Cactus.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash and query.
  var pathStripper = /[?#].*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Cactus.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = this.location.pathname;
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Cactus.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Cactus.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window)) {
        Cactus.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !atRoot) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + this.location.search + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && atRoot && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the fragment of the query and hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

}