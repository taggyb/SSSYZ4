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
                this.amovie = new Cactus2.Collections.aMovie([],{id:id});
                this.amovie.fetch();
                this.amovie.models;
 
                this.reviews = new Cactus2.Collections.Reviews([],{id:id});
                this.reviews.fetch({reset: true});
                
                this.reviews.models;
                var view = new Cactus2.Views.SingleMovie({
                        el: '#wrapper',
                        collection: this.amovie,
                        mid: id,
                        reviews: this.reviews,
                        router: this
                });
                view.render();
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
