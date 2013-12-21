
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("deleteUsers", function(request, response) {

	var query = new Parse.Query(Parse.User);
	query.find().done(function(results){
		for (var i=0; i < results.length; i++){
			console.log(i);
			Parse.Cloud.useMasterKey();
			results[i].destroy().done(function(){
				//console.log("destroied");
			});
		}
		response.success();
	}).fail(function(e){
		response.success();
	});
});
