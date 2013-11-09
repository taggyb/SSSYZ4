Cactus2.Views.MovieList = Cactus.View.extend({
        template: JST['movies/displayAllMovies'],
 
        events: {
                "click #new_movie"              : "newMovie",
                "click .moviedetail"            : "movieDetail",
		"click span#next"		: "nextPage",
                "click span#back"		: "backPage"
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

	nextPage: function() {
                var currPage = this.getCurrPage();
                var nextPage = currPage + 1;

		var moviesJsonUrl = "//cs3213.herokuapp.com/movies.json?page=";
		// check if there exists another movie page
		var nextCollection = $.get(moviesJsonUrl + (nextPage), function(moreMovies) {
			if (moreMovies.length) {	// Not the last page
				routerHome.navigate("/" + nextPage, { trigger: true });
			} else {			// In the last page
				alert("There are no more movies in the next page.");
			}
		});
        },

	backPage: function() {
                var currPage = this.getCurrPage();
                var backPage = currPage - 1;

                if (currPage !== 1) {	// Not the first page
 			routerHome.navigate("/" + backPage, { trigger: true });
                } else {		// In the first page
			alert("There are no more movies in the previous page.");
                }         
        },

	getCurrPage: function() {
                var curPage = window.location.hash;
                var curPage = curPage.slice(1);

                if (curPage === "") {
                        curPage = 1;
                } else {
                        curPage = parseInt(curPage, 10);
                }

                return curPage;
        },

        render: function(data) {
                this.$el.html(this.template(data));
        }
});
