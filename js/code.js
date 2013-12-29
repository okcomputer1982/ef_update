(function($, window, document, undefined){

ef_database.init();

//test utilities
$('#clear_database_btn').on('click', function(e){
	ef_testing.clearDatabase();
});

$('#build_test_database_btn').on('click', function(e){
	ef_testing.buildDatabase();
});

//test Scripts
$('#test_helpers_btn').on('click', function(e){
	ef_testing.testHelperFunctions();
});

//Create Button Functions
$('#event_create_btn').on('click', function(e){
	
	var data = {
		'title':"tag test", 
		'photos':['picture.png'], 
		'profile_list':[''], 
		'social_media':{facebook:"facebook", website:"website", twitter:"twitter"}, 
		'cost':0, 
		'description':"ipsum",
		'disciplines': [],
		'tags':[],
		'venue':'home',
		'date_mode':'recur_mode',//occur_mode',
		'occurence': [{'time_mode':'fixed', 'date_start':new Date(2013, 4, 10, 13, 0), 'date_end':new Date(2013, 4, 10, 15, 0)},
					  {'time_mode':'fixed', 'date_start':new Date(2013, 4, 11, 13, 0), 'date_end':new Date(2013, 4, 11, 15, 0)}]
		//'occurence': [{'time_mode':'all_day', 'start_recurance':new Date(2013, 4, 1, 0, 0), 'end_recurance':new Date(2013, 11, 1, 0, 0), 'unit':"x_days", "amount1":"3"}]
	};

	data['tags'] = _.uniq(data['tags']);
	data['disciplines'] = _.uniq(data['disciplines']);

	var tagCheck = ef_database.helpers.listExists('tag', "title", data['tags']);
	var disciplineCheck = ef_database.helpers.listExists('discipline', 'title', data['disciplines']);

	$.when(disciplineCheck, tagCheck).done(function(){
		var results = arguments;
		var existanceError = false;
		var existanceTitle, existanceTable;

		_.each(results, function(obj){
			if (!obj.allExist && !existanceError) {
				existanceError = true;
				existanceTable = obj.type;
				existanceTitle = obj.uniq_items[0];
			}
		});
		
		if (existanceError) {
			console.log("Event Creation Error: " +  existanceTable + " does not contain an item titled " + existanceTitle);
		} else {
			//also, let's do a check for venue uniquiness
			ef_database.helpers.dataExists("venue", "title", data['venue']).done(function(obj) {
				if (obj.exists) {
					ef_database.CRUD.create("event", data).done(function(obj){
						console.log("Event Creation Successful");
						console.log(obj);
					});
				} else {
					console.log("Event Creation Error: Venue " + data['venue'] + " does not exist.")
				}
			});
		}
	});				
});

$('#venue_create_btn').on('click', function(e) {
	var data = {'title':"home",
		'description':"lipsum",
		'photos':['picture.png'],
		'social_media': {facebook:"facebook", website:"website", twitter:"twitter"},
		'address':"1618 Brown Street",
		'city':"Philadelphia",
		'state':"PA",
		'zipcode':"19130",
		'admin_users':[],
	};
	
	data['tags'] = _.uniq(data['tags']);
	data['disciplines'] = _.uniq(data['disciplines']);

	var tagCheck = ef_database.helpers.listExists('tag', "title", data['tags']);
	var disciplineCheck = ef_database.helpers.listExists('discipline', 'title', data['disciplines']);

	$.when(disciplineCheck, tagCheck).done(function(){


		var results = arguments;
		var existanceError = false;
		var existanceTitle, existanceTable;

		_.each(results, function(obj){
			if (!obj.allExist && !existanceError) {
				existanceError = true;
				existanceTable = obj.type;
				existanceTitle = obj.uniq_items[0];
			}
		});

		if (existanceError) {
			console.log("Venue Create Error: " +  existanceTable + " does not contain an item titled " + existanceTitle);
		} else {
			ef_database.CRUD.create("venue", data).done(function(obj){
				console.log("Venue Creation Successful");
				console.log(obj);
			});
		}
	});	
});


$('#user_create_btn').on('click', function(e) {
	var data = {"username":"u_name",
				"email": "warrenlongmire@gmail.com",
				"password":"111",
				"is_organization":false,
				'first_name':"test",
				'last_name':"test",
				'telephone':"215 333-3333",
				'public_user':true,
				'photos':null,
				'social_media':{facebook:"facebook", website:"website", twitter:"twitter"},
				"description":'ipsum',
				"disciplines":[],
				"tags":[],
				'admins':[]};
	data['tags'] = _.uniq(data['tags']);
	data['disciplines'] = _.uniq(data['disciplines']);

	var tagCheck = ef_database.helpers.listExists('tag', "title", data['tags']);
	var disciplineCheck = ef_database.helpers.listExists('discipline', 'title', data['disciplines']);

	$.when(disciplineCheck, tagCheck).done(function(){
		var results = arguments;
		var existanceError = false;
		var existanceTitle, existanceTable;

		_.each(results, function(obj){
			if (!obj.allExist && !existanceError) {
				existanceError = true;
				existanceTable = obj.type;
				existanceTitle = obj.uniq_items[0];
			}
		});
		
		if (existanceError) {
			console.log("Venue Creation Error: " +  existanceTable + " does not contain an item titled " + existanceTitle);
		} else {
			ef_database.CRUD.create("user", data).done(function(obj){
				console.log("User Creation Successful");
				console.log(obj);
			});
		}
	});
});

$('#discipline_create_btn').on('click', function(e) {
	var data = {"title":"dance",
				"description": "lipsum"
				};

	if (!data.parent)
		$.extend(data, {"parent":"root"});

	
	ef_database.helpers.dataExists("discipline", "title", data["title"]).done(function(obj){
			if (!obj.exists) {
				//create the discipline
				ef_database.CRUD.create("discipline", data, true, "title").done(function(obj){
					console.log("Discipline Creation Successful");
					console.log(obj);
				});
			} else {
				console.log("Discipline Creation Error: " + obj.data + " already exists.");	
			}
		
	});
});

$('#tag_create_btn').on('click', function(e) {
	var data = {"title":"good for kids",
				"description": "lipsum"
				};


	ef_database.helpers.dataExists("tag", "title", data["title"])
		.done(function(obj) {
			if (!obj.exists) {
				ef_database.CRUD.create("tag", data, true, "title").done(function(obj){
					console.log("Tag Creation Successful");
					console.log(obj);
				});
			} else {
				console.log("Tag Creation Error:" + "Tag title " + data["title"] + " is not unique.")
			}
		});
});


////Read Button Functions
$('#event_read_btn').on('click', function(e) {

	var query = [{column:"start_date", type:"greaterThen", value:new Date()}, {column:"start_date", type:"lessThen", value:new Date(2014, 2, 30)}];
	var ordering = {column:"start_date", direction:"down"};
	var pagination = {limit:30, page:1};

	ef_database.CRUD.read("event", query, ordering, pagination)
		.done(function(results) {
			if (_.isEmpty(results))
				console.log("No results retieved.");

			_.each(results, function(obj, idx){
				console.log(idx + " " + obj.id + " : " + obj[ordering.column]);
			});
		}
	);

});

$('#venue_read_btn').on('click', function(e) {
	//var home = new Parse.GeoPoint({latitude:39.96512, longitude:-75.16259});

	var query = [];//[{"column":"geoPoint", "type":"withinMiles", "value":{point:home, distance:0.56}}];
	var ordering = {};//{column:"title",direction:"down"};
	var pagination = {};//{limit:5, page:0};

	ef_database.CRUD.read("venue", query, ordering, pagination)
		.done(function(results){
			console.log(results);
		}
	);

});

$('#user_read_btn').on('click', function(e) {

	var query = [];//[{"column":"title", "type":"equal", "value":["acting", "poetry"]}];
	var ordering = {};//{column:"title",direction:"down"};
	var pagination = {};//{limit:5, page:0};

	ef_database.CRUD.read("user", query, ordering, pagination)
		.done(function(results){
			console.log(results);
		}
	);

});

$('#discipline_read_btn').on('click', function(e) {

	var query = [];//[{column:"description", type:"equal", value:"stuff"}];
	var ordering = {};//{column:"title",direction:"down"};
	var pagination = {};//{limit:5, page:0};

	ef_database.CRUD.read("discipline", query, ordering, pagination)
		.done(function(results){
			console.log(results);
		}
	);

});

$('#tag_read_btn').on('click', function(e) {
	
	var query = [{"column":"title", "type":"equal", "value":["tag1", "tag2"]}];
	var ordering = {};//{column:"title",direction:"up"};
	var pagination = {limit:5, page:0};

	ef_database.CRUD.read("tag", query, ordering, pagination)
		.done(function(results){
			console.log(results);
		}
	);

});

}(jQuery, window, document));