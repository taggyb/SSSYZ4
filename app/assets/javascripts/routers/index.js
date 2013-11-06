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
                this.movies = new Cactus2.Collections.Movies([],{
                        url: "//cs3213.herokuapp.com/movies.json?page=" + page
                });

                this.movies.fetch();
                this.movies.models;
                var view = new Cactus2.Views.MoviesIndex({
                        el:'#wrapper',
                        collection: this.movies,
                        mpage: page,
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
                this.amovie = new Cactus2.Models.Movie({id:id});
              
                var view = new Cactus2.Views.SingleMovie({
                        model: this.amovie,
                        mid: id,
                        router: this
                });

                $("#wrapper").html(view.render().el);
        },
 
        editSingleMovie: function(movieId) {
                var movie = new Cactus2.Models.Movie({id: movieId});
                //alert("In index.js, id is " + movieId);
                movie.fetch({
                    success: function() {
                        //alert("testing "+movie.title);
                        var editMovieView = new Cactus2.Views.EditSingleMovie({
                            model: movie,
                            el: $('#wrapper')
                        });
                        editMovieView.render();
                    }
                });
        }
});
