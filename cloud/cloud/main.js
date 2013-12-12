
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
var _ = require('underscore');

Parse.Cloud.define("deleteUsers", function(request, response) {
  Parse.Cloud.useMasterKey();

  var query = new Parse.Query(Parse.User);
  query.find().done(function(results){
  	_.each(results, function(obj){
  		obj.destroy();		
  	});
  });

  response.success("complete");
});
