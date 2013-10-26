Cactus2.Models.Movie=Cactus.Model.extend({
	defaults:{
		avg_score: null,
		id: null,
		title: null,
		summary: null,
		updated_at: null,
		img_url: null,
		user: null,
	},
	url: function() {
        return 'http://cs3213.herokuapp.com/movies/'+this.id+'.json';
    }
})
