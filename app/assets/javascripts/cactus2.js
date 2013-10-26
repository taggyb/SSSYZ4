window.Cactus2 = {
	Models: {},
	Collections: {},
	Views: {},
	Routers: {},

	initialize: function() {
		window.routerHome = new Cactus2.Routers.Index();
		Backbone.history.start();
	}
};

$(document).ready(function() {
	Cactus2.initialize();
});
