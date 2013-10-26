Cactus2.Collections.aMovie=Cactus.Collection.extend({
	url: function() {
		return 'http://cs3213.herokuapp.com/movies/' + this.movie_id + '.json';
	},
	model: Cactus2.Models.Movie,

	initialize: function(models, options) {
		this.movie_id = options.id || [];   
	}
})
