Cactus2.Views.MovieList = Cactus.View.extend({
        template: JST['movies/displayAllMovies'],
 
        events: {
                "click #new_movie"              : "newMovie",
                "click .moviedetail"            : "movieDetail"
        },
 
        initialize: function() {
        },
 
        newMovie: function() {
                routerHome.navigate("/new", { trigger: true });
        },
 
        movieDetail: function(event) {
                var name = $(event.target).data('name');
                routerHome.navigate("movies/" + name, { trigger: true });
        },

        render: function(data) {
                this.$el.html(this.template(data));
        }
});
