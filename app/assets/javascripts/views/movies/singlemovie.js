Cactus2.Views.SingleMovie = Cactus.View.extend({
        template: JST['movies/singlemovie'],

        initialize: function() {
                this.model = this.options.model;

                this.model.on('change', this.render, this);
                this.model.fetch();
                this.mid = this.options.mid;
                this.router = this.options.router

                this.reviews = new Cactus2.Collections.Reviews([],{id:this.mid});
                this.reviews.on('reset change', this.render, this);
                this.reviews.fetch({reset:true});
        },

        render: function() {
                console.log(this.model.attributes);
                this.$el.html(this.template({movie: this.model.attributes, mid: this.mid, reviews: this.reviews.models}));
                //this.delegateEvents();
                return this;
        },

        events: {
                "click .main"           : "backToIndex",
                "click #update_movie"   : "updateMovie",
                "click #delete_movie"   : "deleteMovie",
                "click #submit_review"  : "submitReview",
                "click #delete_review"  : "deleteReview"
        },

        updateMovie: function() {
                routerHome.navigate("/movies/"+this.mid+"/edit", { trigger: true });
                return false;
        },

        deleteMovie: function(e) {
                e.preventDefault();
                if (typeof gon == 'undefined'){
                        alert('Please login to delete this movie!');
                        return false;
                }

                $.ajax({
                        url: 'http://cs3213.herokuapp.com/movies/'+this.mid+'.json',
                        dataType:'json',
                        data: {        
                                access_token: gon.token
                        },
                        method: "DELETE",
                        error: function(e){
                                alert("You are not authorised to delete this movie");
                        },
                        success: function(e){
                                alert("Movie deleted successfully."); 
                                routerHome.navigate("", { trigger: true });
                        },
                });
        },

        deleteReview: function(e) {
                e.preventDefault();
                var current = this;
                var review_id = $(e.target).parent().attr('id');

                if (typeof gon == 'undefined'){
                        alert('Please login to delete this review!');
                        return false;
                }
                
                $.ajax({
                        url: 'http://cs3213.herokuapp.com/movies/'+this.mid+'/reviews/'+review_id+'.json',
                        dataType:'json',
                        data: {        
                                access_token: gon.token
                        },
                        method: "DELETE",
                        error: function(e){
                                alert("Something wrong happened when delete this review");
                        },
                        success: function(e){
                                alert("review deleted successfully.");
                                //current.destroyReview();
                                review_model = current.reviews.get(review_id);
                                current.reviews.remove(review_model);

                                //routerHome.navigate("movies/" + current.mid, { trigger: true });
                                //current.destroyReview(); 
                                routerHome.navigate("", { trigger: true });
                        },
                });
        },

        submitReview: function(e) {
                e.preventDefault();
                if (typeof gon == 'undefined'){
                        alert('You are not authorised to add a review. Please sign in.');
                        return false;
                }
                var current = this;
                $(e.target).closest('form').ajaxSubmit({
                        url: 'http://cs3213.herokuapp.com/movies/'+this.mid+'/reviews.json',
                        dataType:'json',
                        data: {        
                                access_token: gon.token
                        },
                        method: "POST",
                        error: function(e){
                                alert("Something wrong happened. Try again :-(");
                                return false;
                        },
                        success: function(e){
                                 alert("review added successfully.");
                                current.destroyReview();
                                routerHome.navigate("", { trigger: true });      
                        }                  
                });
        },


        backToIndex: function() {
                routerHome.navigate("", { trigger: true });
        },

        destroyReview: function() {
                //COMPLETELY UNBIND THE VIEW
                this.undelegateEvents();

                this.$el.removeData().unbind(); 

                //Remove view from DOM
                this.remove();  
                Backbone.View.prototype.remove.call(this);

        }
})
