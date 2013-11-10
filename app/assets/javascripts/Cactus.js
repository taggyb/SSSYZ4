//     Cactus.js 1.1.0
//     By Cactus CS3213
//     National University of Singapore
(function(){
 var root = this;

 var array = [];
 var push = array.push;
 var slice = array.slice;
 var splice = array.splice;

 var Cactus;
 Cactus = root.Cactus = {};

 var _ = root._;
 if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

 Cactus.$ = root.jQuery || root.Zepto || root.ender || root.$;

 // Cactus.Events
 // ---------------
 var Events = Cactus.Events = {

on: function(name, callback, context) {
	    if (!validateEvents(this, 'on', name, [callback, context]) || !callback) return this;
	    this._events || (this._events = {});
	    var events = this._events[name] || (this._events[name] = []);
	    events.push({callback: callback, context: context || this});
	    return this;
    },

off: function(name, callback, context) {
	     if (!this._events || !validateEvents(this, 'off', name, [callback, context])) return this;
	     if (!name && !callback && !context) {
		     this._events = {};
		     return this;
	     }
	     this._events[name] = _.filter(this._events[name], function(event){
			     return event.callback !== callback;
			     });
	     return this;
     },

trigger: function(name) {
		 if (!this._events) return this;
		 var args = slice.call(arguments, 1);
		 if (!validateEvents(this, 'trigger', name, args)) return this;
		 var events = this._events[name];
		 var allEvents = this._events.all;
		 if (events) triggerEvents(events, args);
		 if (allEvents) triggerEvents(allEvents, arguments);
		 return this;
	 },

stopListening: function(obj, name, callback) {
		       if (!this_listeningTo) return this;
		       var listeningTo = this._listeningTo;
		       var remove = !name && !callback;
		       if (!callback && typeof name === 'object') callback = this;
		       if (obj) (listeningTo = {})[obj._listenId] = obj;
		       for (var id in listeningTo) {
			       obj = listeningTo[id];
			       obj.off(name, callback, this);
			       if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
		       }
		       return this;
	       }

 };

 var triggerEvents = function(events, args) {
	 for(var i = 0; i < events.length; i++){
		 var ctx = events[i].context;
		 events[i].callback.apply(ctx, args)
	 }
 };

 var validateEvents = function(obj, action, name, rest) {
	 var eventSplitter = /\s+/;
	 if (!name) return true;
	 if (typeof name === 'object') {
		 for (var key in name) {
			 obj[action].apply(obj, [key, name[key]].concat(rest));
		 }
		 return false;
	 }

	 if (eventSplitter.test(name)) {
		 var names = name.split(eventSplitter);
		 for (var i = 0, l = names.length; i < l; i++) {
			 obj[action].apply(obj, [names[i]].concat(rest));
		 }
		 return false;
	 }
	 return true;
 };

 _.extend(Cactus, Events);
 // Cactus.Model
 // --------------
 var Model = Cactus.Model = function(attributes, options) {
	 var attrs = attributes || {};
	 if (!options) options = {};
	 this.attributes = {};
	 this.cid = _.uniqueId('cactus');
	 if (options.collection) this.collection = options.collection;
	 if (options.parse) attrs = this.parse(attrs, options) || {};
	 
	 var defaults = _.result(this, 'defaults');
	 if (defaults) attrs = _.defaults({}, attrs, defaults);
	 this.set(attrs, options);
	 this.initialize.apply(this, arguments);
 };

 // Attach all inheritable methods to the Model prototype.
 _.extend(Model.prototype, Events, {
		 //changed: null,
validationError: null,
idAttribute: 'id',
initialize: function(){},

// Return a copy of the model's `attributes` object.
toJSON: function(options) {
return _.clone(this.attributes);
},

// Proxy `Cactus.sync` by default -- but override this if you need
// custom syncing semantics for *this* particular model.
sync: function() {
return Cactus.sync.apply(this, arguments);
},

// Get the value of an attribute.
get: function(attribute) {
return this.attributes[attribute];
},

	// Set a hash of model attributes on the object, firing `"change"`. This is
	// the core primitive operation of a model, updating the data and notifying
	// anyone who needs to know about the change in state. The heart of the beast.
set: function(key, val, options) {
	     var attr, attrs, unset, changes, silent, changing, prev, current;
	     if (key == null) return this;
	     // Handle both `"key", value` and `{key: value}` -style arguments.
	     if (typeof key === 'object') {
		     attrs = key;
		     options = val;
	     } else (attrs = {})[key] = val;
	     

	     if (!options) options = {};
	     
	     // Extract attributes and options.
	     unset           = options.unset;
	     silent          = options.silent;
	     changes         = [];
	     changing        = this._changing;
	     this._changing  = true;

	     if (!changing) {
		     this._previousAttributes = _.clone(this.attributes);
		     this.changed = {};
	     }
	     current = this.attributes, prev = this._previousAttributes;

	     // Check for changes of `id`.
	     if (this.idAttribute in attrs) {
		     this.id = attrs[this.idAttribute];
	     }

	     // For each `set` attribute, update or delete the current value.
	     for (attr in attrs) {
		     val = attrs[attr];
		     if (!_.isEqual(current[attr], val)) {
			     changes.push(attr);
		     }
		     if (!_.isEqual(prev[attr], val)) {
			     this.changed[attr] = val;
		     } else {
			     delete this.changed[attr];
		     }
		     if (unset) {
			     delete current[attr];
		     } else {
			     current[attr] = val;
		     }
	     }

	     if (!silent) {
		     if (changes.length) {
			     this._pending = true;
		     }
		     for (var i = 0, l = changes.length; i < l; i++) {
			     this.trigger('change:' + changes[i], this, current[changes[i]], options);
		     }
	     }

	     if (changing) return this;
	     
	     if (!silent) 
		     while (this._pending) {
			     this._pending = false;
			     this.trigger('change', this, options);
		     }
	     this._pending = false;
	     this._changing = false;
	     return this;
     },

     // Fetch the model from the server. If the server's representation of the
     // model differs from its current attributes, they will be overridden,
     // triggering a `"change"` event.
fetch: function(options) {
	       var foptions = {};
	       if (options) foptions = _.clone(options);
	       options = _.clone(foptions);

	       if (options.parse === void 0) {
		       options.parse = true;
	       }

	       var model = this;
	       var success = options.success;
	       options.success = function(response) {
		       if (!model.set(model.parse(response, options), options)) return false;
		       if (success) success(model, response, options);
		       model.trigger('sync', model, response, options);
	       };
	       return this.sync('read', this, options);
       },

parse: function(response, options) {
	       return response;
       },

_validate: function(attrs, options) {
		   if (!options.validate || !this.validate) {
			   return true;
		   }
		   attrs = _.extend({}, this.attributes, attrs);
		   var error = this.validationError = this.validate(attrs, options) || null;
		   if (!error) {
			   return true;
		   }
		   this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
		   return false;
	   }

});

// Underscore methods that we want to implement on the Model.
var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

// Mix in each Underscore method as a proxy to `Model#attributes`.
_.each(modelMethods, function(method) {
		Model.prototype[method] = function() {
		var args = slice.call(arguments);
		args.unshift(this.attributes);
		return _[method].apply(_, args);
		};
		});

// Cactus.Collection
// -------------------
var Collection = Cactus.Collection = function(models, options) {
	if(!options) options = {};
	if (options.model) this.model = options.model;
	if (options.comparator !== void 0) this.comparator = options.comparator;
	this.length = 0;
	this.models = [];
	this._byId  = {};
	this.initialize.apply(this, arguments);
	if (models) this.reset(models, _.extend({silent: true}, options));
};

// Default options for `Collection#set`.
var setOptions = {add: true, remove: true, merge: true};
var addOptions = {add: true, remove: false};

_.extend(Collection.prototype, Events, {

model: Model,

initialize: function(){},

toJSON: function(options) {
return this.map(function(model){ return model.toJSON(options); });
},

sync: function() {
return Cactus.sync.apply(this, arguments);
},

add: function(models, options) {
var addOpt = { merge:false };
addOpt = _.extend(addOpt, options, addOptions);
return this.set(models, addOpt); 
},

remove: function(models, options) {
		var singular = !_.isArray(models);
		models = singular ? [models] : _.clone(models);
		options || (options = {});
		var i, l, index, model;
		for (i = 0, l = models.length; i < l; i++) {
			model = models[i] = this.get(models[i]);
			if (!model) continue;
			delete this._byId[model.id];
			delete this._byId[model.cid];
			index = this.indexOf(model);
			this.models.splice(index, 1);
			this.length--;
			if (!options.silent) {
				options.index = index;
				model.trigger('remove', model, this, options);
			}
			this._removeReference(model);
		}
		return singular ? models[0] : models;
	},

set: function(models, options) {
	     options = _.defaults({}, options, setOptions);
	     if (options.parse) models = this.parse(models, options);
	     var singular = !_.isArray(models);
	     if(singular){
		     if(models) models = [models];
		     else models = [];
	     }
	     else models = _.clone(models);

	     var i, l, id, model, attrs, sort, order;
	     var at = options.at;
	     var targetModel = this.model;
	     var sortable = this.comparator && at == null && options.sort !== false;
	     var sortAttr = _.isString(this.comparator)? this.comparator : null;
	     var toAdd = [], toRemove = [], modelMap = {};
	     var add = options.add, merge = options.merge, remove = options.remove;
	     if(!sortable && add && remove) order = [];
	     else order = false;

	     for (i = 0, l = models.length; i < l; i++) {
		     attrs = models[i];
		     if (attrs instanceof Model) {
			     model = attrs;
			     id = model;
		     } else 
			     id = attrs[targetModel.prototype.idAttribute];

		     if (existing = this.get(id)) {
			     if (options.remove) modelMap[existing.cid] = true;
			     if (options.merge) {
				     if(attrs === model) attrs = model.attributes;
				     if (options.parse) attrs = existing.parse(attrs, options);
				     existing.set(attrs, options);
				     if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
			     }
			     models[i] = existing;
		     }

		     else  if (options.add) {
			     models[i] = this._prepareModel(attrs, options);
			     model = models[i];
			     if (!model) continue;
			     toAdd.push(model);
			     model.on('all', this._onModelEvent, this);
			     this._byId[model.cid] = model;
			     if (model.id != null) this._byId[model.id] = model;
		     }
		     if (order) {
			     if(existing) order.push(existing);
			     else order.push(model);
		     }
	     }

	     if (options.remove) {
		     for (i = 0, l = this.length; i < l; ++i) {
			     if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
		     }
		     if (toRemove.length) this.remove(toRemove, options);
	     }

	     if (toAdd.length || (order && order.length)) {
		     this.length += toAdd.length;
		     if (at != null) {
			     for (i = 0, l = toAdd.length; i < l; i++) {
				     this.models.splice(at + i, 0, toAdd[i]);
			     }
		     } else {
			     if (order) this.models.length = 0;
			     var orderedModels = order || toAdd;
			     for (i = 0, l = orderedModels.length; i < l; i++) {
				     this.models.push(orderedModels[i]);
			     }
		     }
		     if (sortable) sort = true;
	     }

	     if (sort) this.sort({silent: true});

	     if (!options.silent) {
		     for (i = 0, l = toAdd.length; i < l; i++) {
			     (model = toAdd[i]).trigger('add', model, this, options);
		     }
		     if (sort || (order && order.length)) this.trigger('sort', this, options);
	     }

	     return singular ? models[0] : models;
     },

reset: function(models, options) {
	       if (!options) options = {};
	       for (var i = 0, l = this.models.length; i < l; i++) {
		       this._removeReference(this.models[i]);
	       }
	       options.previousModels = this.models;
	       this.length = 0;
	       this.models = [];
	       this._byId  = {};
	       models = this.add(models, _.extend({silent: true}, options));
	       if (!options.silent) this.trigger('reset', this, options);
	       return models;
       },

get: function(obj) {
	     if (obj == null) return void 0;
	     return this._byId[obj.id] || this._byId[obj.cid] || this._byId[obj];
     },

fetch: function(options) {
	       if(options) options = _.clone(options);
	       else options = {};
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
	       return this.sync('read', this, options);
       },

parse: function(resp, options) {
	       return resp;
       },

_prepareModel: function(attrs, options) {
		       if (attrs instanceof Model) { //if attrs is already a model obj, just set its collection return
			       if (!attrs.collection) 
				       attrs.collection = this;
			       return attrs;
		       }
		       if(options) options = _.clone(options);
		       else options = {};
		       options.collection = this;
		       var model = new this.model(attrs, options);
		       if (!model.validationError) return model;
		       this.trigger('invalid', this, model.validationError, options);
		       return false;
	       },

_onModelEvent: function(event, model, collection, options) {
		       if ((event === 'add' || event === 'remove') && collection !== this) return;
		       if (event === 'destroy') this.remove(model, options);
		       if (model && event === 'change:' + model.idAttribute) {
			       delete this._byId[model.previous(model.idAttribute)];
			       if (model.id != null) this._byId[model.id] = model;
		       }
		       this.trigger.apply(this, arguments);
	       },

_removeReference: function(model) {
			  if (this === model.collection) delete model.collection;
			  model.off('all', this._onModelEvent, this);
		  }

});

// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Cactus Collections is actually implemented
// right here:
var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain'];

// Mix in each Underscore method as a proxy to `Collection#models`.
_.each(methods, function(method) {
		Collection.prototype[method] = function() {
		var args = slice.call(arguments);
		args.unshift(this.models);
		return _[method].apply(_, args);
		};
		});

// Underscore methods that take a property name as an argument.
var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

// Use attributes instead of properties.
_.each(attributeMethods, function(method) {
		Collection.prototype[method] = function(value, context) {
		var iterator = _.isFunction(value) ? value : function(model) {
		return model.get(value);
		};
		return _[method](this.models, iterator, context);
		};
		});

// Cactus.View
// -------------
var View = Cactus.View = function(options) {
	this.cid = _.uniqueId('view');
	options || (options = {});
	_.extend(this, _.pick(options, viewOptions));

	if (!this.el) {
		var attrs = _.extend({}, _.result(this, 'attributes'));
		if (this.id) attrs.id = _.result(this, 'id');
		if (this.className) attrs['class'] = _.result(this, 'className');
		var $el = Cactus.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
		this.setElement($el, false);
	} else {
		this.setElement(_.result(this, 'el'), false);
	}

	this.binded = [];
	this.initialize.apply(this, arguments);
	this.delegateEvents();
};

var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

_.extend(View.prototype, Events, {

		// The default `tagName` of a View's element is `"div"`.
tagName: 'div',

$: function(selector) {
return this.$el.find(selector);
},

initialize: function(){
},

render: function() {
return this;
},

remove: function() {
		this.$el.remove();
		this.stopListening();
		return this;
	},

setElement: function(element, delegate) {
		    if (this.$el) this.undelegateEvents();
		    this.$el = element instanceof Cactus.$ ? element : Cactus.$(element);
		    this.el = this.$el[0];
		    if (delegate !== false) this.delegateEvents();
		    return this;
	    },

delegateEvents: function(events) {
			var delegateEventSplitter = /^(\S+)\s*(.*)$/;
			if (!(events || (events = _.result(this, 'events')))) return this;
			this.undelegateEvents();
			for (var key in events) {
				var method = events[key];
				if (!_.isFunction(method)) method = this[events[key]];
				if (!method) continue;

				var match = key.match(delegateEventSplitter);
				var eventName = match[1], selector = match[2];
				method = _.bind(method, this);
				eventName += '.delegateEvents' + this.cid;
				if (selector === '') {
					this.$el.on(eventName, method);
				} else {
					this.$el.on(eventName, selector, method);
				}
			}
			return this;
		},

undelegateEvents: function() {
			  this.$el.off('.delegateEvents' + this.cid);
			  return this;
		  },
		  });

// Cactus.sync
// -------------
Cactus.sync = function(method, model, options) {

	var type = methods[method];
	var params = { type: type, dataType: 'json'};
	if(!options){
		options = {};
	}

	if (!options.url) {
		if(_.result(model, 'url'))
			params.url = _.result(model, 'url'); 
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
				var reqData;
				if(options.attrs){
					reqData = options.attrs;
				}
				else if(model.ToJSON(options)){
					reqData = model.toJSON(options);
				}
				params.data = JSON.stringify(reqData);
			} 
		case 'delete':
			params.processData = false;
			break;
	}

	if(params.type !== 'GET') params.processData = false;
	options.xhr = Cactus.ajax(_.extend(params, options));
	model.trigger('request', model, options.xhr, options);
	return options.xhr;
};

Cactus.ajax = function() {
	return Cactus.$.ajax.apply(Cactus.$, arguments);
};

// Cactus.Router
var Router = Cactus.Router = function(options) {
	options || (options = {});
	if (options.routes) this.routes = options.routes;
	if(this.routes){
		this.routes = _.result(this, 'routes');
		var route, routes = _.keys(this.routes);
		while ((route = routes.pop()) != null) {
			this.route(route, this.routes[route]);
		}
	}
	this.initialize.apply(this, arguments);
};

_.extend(Router.prototype, Events, {

initialize: function(){
},

route: function(route, name, callback) {
if (!_.isRegExp(route)) route = this._convertReg(route);
if (_.isFunction(name)) {
callback = name;
name = '';
}
if (!callback) callback = this[name];
var router = this;
Cactus.history.route(route, function(fragment) {
	var args = router._extrP(route, fragment);
	if(callback) callback.apply(router, args);
	router.trigger.apply(router, ['route:' + name].concat(args));
	router.trigger('route', name, args);
	Cactus.history.trigger('route', router, name, args);
	});
return this;
},

navigate: function(fragment, options) {
		  Cactus.history.navigate(fragment, options);
		  return this;
	  },

_convertReg: function(route) {
			route = route.replace(/[\-{}\[\]+?.,\\\^$|#\s]/g, '\\$&')
				.replace(/\((.*?)\)/g, '(?:$1)?')
				.replace(/(\(\?)?:\w+/g, function(match, optional) {
						return optional ? match : '([^\/]+)';
						})
			.replace(/\*\w+/g, '(.*?)');
			return new RegExp('^' + route + '$');
		},

_extrP: function(route, fragment) {
			    var params = route.exec(fragment).slice(1);
			    return _.map(params, function(param) {
					    return param ? decodeURIComponent(param) : null;
					    });
		    }

});

// Cactus.History
var History = Cactus.History = function() {
	this.handlers = [];
	_.bindAll(this, 'checkUrl');
	// Ensure that `History` can be used outside of the browser.
	if (typeof window !== 'undefined') {
		this.location = window.location;
		this.history = window.history;
	}
};

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
      var root = this.root.replace(/\/$/, '');
      if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
    } else fragment = this.getHash();
  }
return fragment.replace(/^[#\/]|\s+$/g, '');
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
	       this.root = ('/' + this.root + '/').replace(/^\/+|\/+$/g, '/');
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
			       this.fragment = this.getHash().replace(/^[#\/]|\s+$/g, '');
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
		  if (current === this.fragment && this.iframe) 
			  current = this.getFragment(this.getHash(this.iframe));
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
navigate: function(fragment, options) {
		  if (!History.started) return false;
		  if (!options || options === true) options = {trigger: !!options};

		  var url = this.root + (fragment = this.getFragment(fragment || ''));
		  // Strip the fragment of the query and hash for matching.
		  fragment = fragment.replace(/^[#\/]|\s+$/g, '');

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
			  this._hashUpdate(this.location, fragment, options.replace);
			  if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
				  // Opening and closing the iframe tricks IE7 and earlier to push a
				  // history entry on hash-tag change.  When replace is true, we don't
				  // want this.
				  if(!options.replace) this.iframe.document.open().close();
				  this._hashUpdate(this.iframe.location, fragment, options.replace);
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
_hashUpdate: function(location, fragment, replace) {
		     if (replace) {
			     var href = location.href.replace(/(javascript:|#).*$/, '');
			     location.replace(href + '#' + fragment);
		     } else 
			     location.hash = '#' + fragment;
	     }
});

// Create the default Cactus.history.
Cactus.history = new History;

var extend = function(proto) {
	var parent = this;
	var child;
	if (proto && _.has(proto, 'constructor')) {
		child = proto.constructor;
	} else {
		child = function(){ return parent.apply(this, arguments); };
	}

	var Surrogate = function(){ this.constructor = child; };
	Surrogate.prototype = parent.prototype;
	child.prototype = new Surrogate;
	if (proto) _.extend(child.prototype, proto);
	child.__super__ = parent.prototype;
	return child;
};

Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;
}).call(this);
