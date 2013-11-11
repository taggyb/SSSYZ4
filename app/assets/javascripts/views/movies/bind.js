Backbone.BindingView = Backbone.View.extend({
        errorClass: 'model-validation-error',
        initialize: function() {
                this.model.bind('change', this.modelChange, this);
        },

        prepareBindings: function() {
                var bindings = [];
                var events = {};

                _.each(_.keys(this.bindings), function(key) {
                        //key format: 'selector' or 'attribute selector' or 'event attribute selector'
                        var as = key.split(' ').reverse();
                        var binding_selector = as[0];
                        var binding_attribute = as.length > 1 ? as[1] : null;
                        var binding_event = as.length > 2 ? as[2] : 'change';

                        //value format: 'property' or ['property', 'formatter']
                        if (_.isArray(this.bindings[key])) {
                                var binding_property = this.bindings[key][0];
                                var binding_formatter = this.bindings[key][1];
                        } else {
                                var binding_property = this.bindings[key];
                                var binding_formatter = null;
                        }

                        if (binding_formatter && !this[binding_formatter])
                                throw "Binding Formatter method '"+ binding_formatter +"' not found on view (did you implement it?)";

                        var binding_value = binding_formatter ? this[binding_formatter].apply(this, [this.model.get(binding_property)]) : this.model.get(binding_property);

                        bindings.push({property: binding_property,formatter: binding_formatter, value: binding_value, selector: binding_selector,attribute: binding_attribute});
                        events[binding_event +' '+ binding_selector] = 'updateModel';
                }, this);

                this.delegateEvents(_.extend(events, this.events));

                return bindings;
        },

        renderBindings: function() {
                var t = this.getTemplate();
                this.preparedBindings = this.prepareBindings();
                _.each(this.preparedBindings, function(binding) {
                        this.updateView(t, binding);
                }, this);
                this.$el.html(t.contents());
                return this;
        },

        modelChange: function() {
                var changedProps = _.keys(this.model.changed);
                var changedBindings = _.filter(this.preparedBindings, function(b){ return _.include(changedProps, b.property); });
                _.each(changedBindings, function(binding) {
                        binding.value = binding.formatter ? this[binding.formatter].apply(this, [this.model.get(binding.property)]) : this.model.get(binding.property);
                        this.updateView(this.$el, binding);
                }, this);
        },

        updateView: function(el, binding) {
                var binding_el = el.find(binding.selector);
                if (binding.attribute === 'text' || (binding.attribute || '').length === 0) {
                        // output is converted for html entities by default when no attr is specified in the binding
                        binding_el.text(binding.value);
                } else if (binding.attribute === 'html') {
                        binding_el.html(binding.value);
                } else {
                        binding_el.attr(binding.attribute, binding.value);
                }
                binding_el.data('binding-definition', binding);
        },
});