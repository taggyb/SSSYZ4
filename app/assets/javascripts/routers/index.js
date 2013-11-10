Cactus2.Routers.Index=Cactus.Router.extend({
        routes: {
                ''                      : 'index',
                'movies'                : 'index',
                'new'                   : 'newMovie',
                ':page'                 : 'index',
                'movies/:id'            : 'displaySingleMovie',
                'movies/:id/edit'       : 'editSingleMovie'
        },
 
        initialize: function() {
        },
 
        index: function(page) {
                if (!page) {
                        page = 1;
                } else {
                        page = parseInt(page, 10);
                }
		this.movies = new Cactus2.Collections.aMovie([],{id: page});

                this.movies.fetch();
                this.movies.models;
                var view = new Cactus2.Views.MoviesIndex({
                        el:'#wrapper',
                        collection: this.movies,
                        router: this
                });
                view.render();
        },
 
        newMovie: function() {
                var view = new Cactus2.Views.NewMovie({
                        el:'#wrapper',
                        router: this
                });
 
                view.render();
        },
 
        displaySingleMovie: function(id) {
                var amovie = new Cactus2.Models.Movie({id:id});
              
                var view = new Cactus2.Views.SingleMovie({
                        model: amovie,
                        mid: id,
                        router: this
                });

                $("#wrapper").html(view.render().el);
        },
 
        editSingleMovie: function(movieId) {
                var movie = new Cactus2.Models.Movie({id: movieId});
                movie.fetch({
                    success: function() {
                        var editMovieView = new Cactus2.Views.EditSingleMovie({
                            model: movie,
                            el: $('#wrapper')
                        });
                        editMovieView.render();
                    }
                });
        }
});
