Cactus2.Views.EditSingleMovie = Cactus.View.extend({
	template: JST['movies/editSingleMovie'],


    render: function() {
        //console.log("hahaha");
        //console.log(this.model.toJSON());
        //console.log("hehehe");
        this.$el.html(this.template(this.model.toJSON()));
        //console.log("lololo");
        //this.$el.html(this.template());
        this.delegateEvents();
        return this;
    },

    initialize: function() {
        _.bindAll(this,"render");
        //alert("id is"+this.options.mid);
        console.log(this.model);
        //this.collection = this.options.collection;
        //this.id = this.options.mid;
        //this.router = this.options.router;
        //this.reviews = this.options.reviews;
    },



	events:{
                "click #update" : "updateMovie",
                "click #cancel" : "cancelMovie"
    },
 
    updateMovie: function(e) {
                e.preventDefault();
                if (typeof gon == 'undefined'){
                        alert('Please login to update this movie!');
                        return false;
                }
                var movie_id = this.model.get('id');
                console.log("in update movie");
                $(e.target).closest('form').ajaxSubmit({
                        url: 'http://cs3213.herokuapp.com/movies/'+movie_id+'.json',
                        dataType:'json',
                        data: {        
                                access_token: gon.token
                        },
                        method: "PUT",
                        error: function(e){
                                alert("You are not authorised to update this movie");
                        },
                        success: function(e){
                                alert("Update successful."); 
                                routerHome.navigate("", { trigger: true });
                        },
                        beforeSubmit: function(e) {
                            if ($('#movie_img').val() == "") {
                                $('#movie_img').remove();
                            }
                        }
                });
            },
    cancelMovie: function() {
        routerHome.navigate("", { trigger: true });
    }
})
