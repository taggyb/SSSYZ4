Cactus2.Views.NewMovie = Cactus.View.extend({
        template: JST["movies/newMovie"],
 
        render: function() {
                this.$el.html(this.template());
                this.delegateEvents();
                return this;
        },
 
        events: {
                "click #create" : "saveMovie",
                "click #cancel" : "cancelMovie"
        },
 
        saveMovie: function(e) {
                e.preventDefault();
                if (typeof gon == 'undefined'){
                        alert('You are not authorised to add a movie. Please sign in.');
 
                        return false;
                }
               
                $(e.target).closest('form').ajaxSubmit({
                        url: 'http://cs3213.herokuapp.com/movies.json',
                        dataType:'json',
                        data: {        
                                access_token: gon.token
                        },
                        method: "POST",
                        error: function(e){
                                alert("You are not authorised to add a movie. Please sign in.");
                        },
                        success: function(e){
                                alert("Movie has been successfully added."); 
                                routerHome.navigate("", { trigger: true });
                        },
                });
        },
 
        cancelMovie: function() {
                routerHome.navigate("", { trigger: true });
        }
});