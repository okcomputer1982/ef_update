(function($, window, document, undefined){
	var TEST = {
		areEqual: function(a, b, msg) {
			return this._output(a === b, msg);
		},

		areNotEqual: function(a, b, msg) {
			return this._output(a !== b, msg);
		},

		isTruthy: function(c, msg) {
			return this._output(c, msg);
		},
		
		isFalsey: function(c, msg) {
			return this._output(!c, msg);	
		},

		_output: function(result, msg) {
			console[result ? "log" : "warn"]((result ? "PASS: " : "FAIL: ") + msg);
			return result;
		}
	};
	
	//need to delete and create a custom database for this to work truly the way I want it to
	//can just use the creation methods to do that
	//once it's created we can test everything else

	var error = ef_database.error;
	var helpers = ef_database.helpers;
	var models =  ef_database.models;
	var validation = ef_database.validation;
	var CRUD = ef_database.CRUD;
	
	window.ef_testing = {
		clearDatabase:function() {
			var tb = ['event', 'venue', 'tag', 'discipline', 'eventOccurences'];
			var removeAll = true;
			var removeOnly = ['event', 'eventOccurences'];
			var promises = [];
			_.each(tb, function(key){
				if (removeAll || (!removeAll && _.contains(removeOnly, key))) {
					console.log("removing: " + key);

					promises.push(CRUD.read(key));
				}
			});

			$.when.apply(null, promises).then(function() {
				var results = arguments;
				var promises = [];

				_.each(results, function(arr, idx){
					_.each(arr.results, function(obj){

						promises.push(obj.parseObj.destroy());
					});
				});

				Parse.Cloud.run("deleteUsers", {}).done(function(e){
					console.log(e);
				});

				$.when.apply(null, promises).then(function(){
					console.log("database clear complete.");
				});
			});
		},

		buildDatabase:function() {
			var db = {'tag':[
							{title:'tag1', description:'this'},
							{title:'tag2', description:'that'}, 
							{title:'tag3', description:'other'},
							{title:'tag4', description:'also'},
							{title:'tag5', description:'this other'},
							{title:'tag6', description:'also that'},
							{title:'tag7', description:'this'},
							{title:'tag8', description:'that'},
							{title:'tag9', description:'other'}
						],
						'discipline':[
							{title:'root'},
							{title:'dis1', description:'this', 					parent:{relation:true, table:'discipline', 	col:'title',	data:'root'}},
							{title:'dis2', description:'that', 					parent:{relation:true, table:'discipline', 	col:'title',	data:'root'}},
							{title:'dis3', description:'this and that', 		parent:{relation:true, table:'discipline', 	col:'title',	data:'dis2'}},
							{title:'dis4', description:'other', 		 		parent:{relation:true, table:'discipline', 	col:'title',	data:'dis2'}},
							{title:'dis5', description:'this other', 			parent:{relation:true, table:'discipline', 	col:'title',	data:'dis4'}},
							{title:'dis6', description:'that', 					parent:{relation:true, table:'discipline', 	col:'title',	data:'root'}},
							{title:'dis7', description:'that', 					parent:{relation:true, table:'discipline', 	col:'title',	data:'dis3'}},
							{title:'dis8', description:'also', 					parent:{relation:true, table:'discipline', 	col:'title',	data:'dis3'}},
 							{title:'dis9', description:'also this and that', 	parent:{relation:true, table:'discipline', 	col:'title',	data:'root'}}
						],
						
						'user':[
							{username: 'person1', email: 'p1@gmail.com', password:'1111', is_organization:false, 	first_name:'person', last_name:'one', 	telephone:'(234) 023-1232', public_user:true, description:'this', 				disciplines:{relation:true, table:'discipline', col:'title', data:['dis1', 'dis2']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag8']}},
							{username: 'person2', email: 'p2@gmail.com', password:'1111', is_organization:false, 	first_name:'person', last_name:'two', 	telephone:'(234) 023-3423', public_user:true, description:'that', 				disciplines:{relation:true, table:'discipline', col:'title', data:['dis4', 'dis3', 'dis5']}, 	tags:[]},
							{username: 'person3', email: 'p3@gmail.com', password:'1111', is_organization:true, 	first_name:'person', last_name:'three', telephone:'(234) 023-4444', public_user:true, description:'this that', 			disciplines:{relation:true, table:'discipline', col:'title', data:['dis1']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag2']}},
							{username: 'person4', email: 'p4@gmail.com', password:'1111', is_organization:false, 	first_name:'person', last_name:'four', 	telephone:'(234) 023-1265', public_user:true, description:'other', 				disciplines:{relation:true, table:'discipline', col:'title', data:['dis4', 'dis2']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag3']}},
							{username: 'person5', email: 'p5@gmail.com', password:'1111', is_organization:true, 	first_name:'person', last_name:'five', 	telephone:'(234) 023-6643', public_user:true, description:'other also', 		disciplines:[], 																				tags:{relation:true, table:'tag', col:'title', data:['tag4']}},
							{username: 'person6', email: 'p6@gmail.com', password:'1111', is_organization:false, 	first_name:'person', last_name:'six', 	telephone:'(234) 023-7644', public_user:true, description:'also other this', 	disciplines:{relation:true, table:'discipline', col:'title', data:['dis1', 'dis2']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag1']}}
						],

						'venue':[
							{title: 'venue1', description:'this', 			address:'1533 Ridge Ave', 		city:'Philadelphia', state:'PA', zipcode:'19130', 	disciplines:{relation:true, table:'discipline', col:'title', data:['dis1', 'dis3']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag3']}, 					admins:{relation:true, table:'user', col:'username', data:['person1']}, 				phone:'215 020-2341', createdBy:{relation:true, table:'user', col:'username', data:'person1'}},
							{title: 'venue2', description:'that', 			address:'1925 Fairmount Ave', 	city:'Philadelphia', state:'PA', zipcode:'19130',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis2']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag2', 'tag4', 'tag5']}, 	admins:{relation:true, table:'user', col:'username', data:['person2', 'person4']}, 		phone:'215 020-2312', createdBy:{relation:true, table:'user', col:'username', data:'person2'}},
							{title: 'venue3', description:'other', 			address:'1200 Callowhill st.', 	city:'Philadelphia', state:'PA', zipcode:'19107',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis4']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag4']}, 					admins:{relation:true, table:'user', col:'username', data:['person1', 'person5']}, 		phone:'215 020-4323', createdBy:{relation:true, table:'user', col:'username', data:'person1'}},
							{title: 'venue4', description:'other also', 	address:'300 S Broad St.', 		city:'Philadelphia', state:'PA', zipcode:'19102',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis4', 'dis8', 'dis1']}, 	tags:{relation:true, table:'tag', col:'title', data:['tag5']}, 					admins:{relation:true, table:'user', col:'username', data:['person3', 'person2']}, 		phone:'215 020-1241', createdBy:{relation:true, table:'user', col:'username', data:'person2'}},
							{title: 'venue5', description:'this also that', address:'4522 Baltimore Ave.', 	city:'Philadelphia', state:'PA', zipcode:'19143',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis5']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag3']}, 					admins:{relation:true, table:'user', col:'username', data:['person1']}, 				phone:'215 020-5435', createdBy:{relation:true, table:'user', col:'username', data:'person1'}},
							{title: 'venue6', description:'this', 			address:'417 N 8th St.', 		city:'Philadelphia', state:'PA', zipcode:'19123',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis2']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag3']}, 					admins:{relation:true, table:'user', col:'username', data:['person3', 'person2']}, 		phone:'215 020-2222', createdBy:{relation:true, table:'user', col:'username', data:'person3'}},
							{title: 'venue7', description:'this', 			address:'1201 Frankford Ave.', 	city:'Philadelphia', state:'PA', zipcode:'19125',	disciplines:{relation:true, table:'discipline', col:'title', data:['dis4']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag2', 'tag4', 'tag5']}, 	admins:{relation:true, table:'user', col:'username', data:['person5', 'person6']},		phone:'215 020-4444', createdBy:{relation:true, table:'user', col:'username', data:'person6'}}
						],

						'event':[
							{title: 'event1', 	description: 'same', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis1']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag6']}, 							venue: {relation:true, table:'venue', col:'title', data:'venue1'}, 	min_cost:null, 	max_cost: null, 	cost: 0, 	admins:{relation:true, table:'user', col:'username', data:['person1', 'person2']}, 				created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2013, 11, 1), 	end_date:new Date(2013, 11, 1), 	start_time:new Date(2000, 0, 0, 20, 0), 	end_time:new Date(2000, 0, 0, 21, 0)},
																																																																						   																																																																																	{time_mode:'fixed', 	start_date:new Date(2013, 11, 2), 	end_date:new Date(2013, 11, 2), 	start_time:new Date(2000, 0, 0, 20, 0), 	end_time:new Date(2000, 0, 0, 21, 0)}]},
							{title: 'event2', 	description: 'same', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis1', 'dis2']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag6', 'tag9']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:null, 	max_cost: null, 	cost: 0, 	admins:{relation:true, table:'user', col:'username', data:['person1']},							created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 0, 7), 	end_date:new Date(2014, 0,  7), 	start_time:null, 							end_time:null}]},
							{title: 'event3', 	description: 'same', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis1', 'dis8']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag6', 'tag2']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue1'}, 	min_cost:null, 	max_cost: null, 	cost: 0, 	admins:{relation:true, table:'user', col:'username', data:['person1', 'person2']}, 				created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2013, 11, 30), 	end_date:new Date(2013, 11, 30), 	start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 22, 0), 	start_recurance:new Date(2013, 11, 30), end_recurance:new Date(2014, 0, 3), 	recurance_data:{'type':'everyday'}}]},
							{title: 'event4', 	description: 'same', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis1', 'dis2', 'dis7']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag6', 'tag1']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:null, 	max_cost: null, 	cost: 10, 	admins:{relation:true, table:'user', col:'username', data:['person1', 'person5']},				created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 1, 4), 	end_date:new Date(2013, 1,  4), 	start_time:null, 							end_time:null, 							start_recurance:new Date(2014, 1, 4), 	end_recurance:new Date(2014, 5, 6), 	recurance_data:{'type':'day_of_month', 	day:4}}]},
							{title: 'event5', 	description: 'same', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis1']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag6', 'tag2']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue1'}, 	min_cost:null, 	max_cost: null, 	cost: 10, 	admins:{relation:true, table:'user', col:'username', data:['person1', 'person3']}, 				created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 10), 	end_date:new Date(2013, 1,  10), 	start_time:new Date(2000, 0, 0, 15, 0), 	end_time:new Date(2000, 0, 0, 17, 0), 	start_recurance:new Date(2014, 1, 10), 	end_recurance:new Date(2014, 3, 13), 	recurance_data:{'type':'day_of_week', 	day:1}}]},
							{title: 'event6', 	description: 'lipsum', 		 	disciplines: {relation:true, table:'discipline', col:'title', data:['dis2', 'dis4', 'dis5', 'dis6']}, 	tags:{relation:true, table:'tag', col:'title', data:['tag2', 'tag3']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue3'}, 	min_cost:null, 	max_cost: null, 	cost: 20, 	admins:{relation:true, table:'user', col:'username', data:['person2', 'person3', 'person4']},	created_by: {relation:true, table:'user', col:'username', data:'person2'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 11), 	end_date:new Date(2013, 1,  11), 	start_time:new Date(2000, 0, 0, 18, 0), 	end_time:new Date(2000, 0, 0, 19, 0), 	start_recurance:new Date(2014, 1, 13), 	end_recurance:new Date(2014, 7, 28), 	recurance_data:{'type':'day_of_week',		day:4,	week:[0, 999]}}]},
							{title: 'event7', 	description: 'this stuff', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis2', 'dis5']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag2', 'tag4']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue1'}, 	min_cost:null, 	max_cost: null, 	cost: 20, 	admins:{relation:true, table:'user', col:'username', data:['person2']}, 						created_by: {relation:true, table:'user', col:'username', data:'person2'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 13), 	end_date:new Date(2014, 1,  13), 	start_time:new Date(2000, 0, 0, 20, 0), 	end_time:new Date(2000, 0, 0, 22, 0)},
							 																																																																																																																												   																				{time_mode:'fixed', 	start_date:new Date(2013, 11, 4), 	end_date:new Date(2013, 11, 4), 	start_time:new Date(2000, 0, 0, 13, 0), 	end_time:new Date(2000, 0, 0, 21, 0)}]},
							{title: 'event8', 	description: 'other', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis2']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag2', 'tag5', 'tag6']}, 			venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:10, 	max_cost: 20, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person3', 'person4']}, 				created_by: {relation:true, table:'user', col:'username', data:'person3'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2013, 11, 19), 	end_date:new Date(2013, 11, 19), 	start_time:new Date(2000, 0, 0, 10, 0), 	end_time:new Date(2000, 0, 0, 14, 0)}]},
							{title: 'event9', 	description: 'other', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis3', 'dis4', 'dis7']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag4', 'tag6']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue3'}, 	min_cost:10, 	max_cost: 30, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person4', 'person5']}, 				created_by: {relation:true, table:'user', col:'username', data:'person4'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 0, 22), 	end_date:new Date(2014, 0,  24), 	start_time:new Date(2000, 0, 0, 9, 0), 		end_time:new Date(2000, 0, 0, 14, 0)}]},
							{title: 'event10', 	description: 'this same', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis3', 'dis8', 'dis7']}, 			tags:{relation:true, table:'tag', col:'title', data:['tag5', 'tag7']}, 					venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:30, 	max_cost: 100, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person5', 'person6']}, 				created_by: {relation:true, table:'user', col:'username', data:'person5'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 0, 23), 	end_date:new Date(2014, 0,  23), 	start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 23, 0), 	start_recurance:new Date(2014, 0, 23), 	end_recurance:new Date(2014, 0, 27), 	recurance_data:{'type':'everyday'}}]},
							{title: 'event11', 	description: 'this', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis4']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag6']},		 					venue: {relation:true, table:'venue', col:'title', data:'venue4'}, 	min_cost:20, 	max_cost: 20, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person4', 'person5']}, 				created_by: {relation:true, table:'user', col:'username', data:'person4'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 1, 12), 	end_date:new Date(2014, 1,  12), 	start_time:null, 							end_time:null, 							start_recurance:new Date(2014, 1, 12), 	end_recurance:new Date(2014, 5, 18), 	recurance_data:{'type':'day_of_month', 	day:12}}]},
							{title: 'event12', 	description: 'strange', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis8']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag2']},		 					venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:null, 	max_cost: null, 	cost: 15, 	admins:{relation:true, table:'user', col:'username', data:['person3', 'person1']}, 				created_by: {relation:true, table:'user', col:'username', data:'person3'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 25), 	end_date:new Date(2014, 1,  25), 	start_time:new Date(2000, 0, 0, 15, 0), 	end_time:new Date(2000, 0, 0, 17, 0), 	start_recurance:new Date(2014, 1, 25), 	end_recurance:new Date(2014, 3, 29), 	recurance_data:{'type':'day_of_week', 	day:2}}]},
							{title: 'event13', 	description: 'yes', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis5', 'dis7']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag8', 'tag9']},		 			venue: {relation:true, table:'venue', col:'title', data:'venue5'}, 	min_cost:null, 	max_cost: null, 	cost: 40, 	admins:{relation:true, table:'user', col:'username', data:['person5', 'person6']}, 				created_by: {relation:true, table:'user', col:'username', data:'person6'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 11), 	end_date:new Date(2014, 1, 11), 	start_time:new Date(2000, 0, 0, 18, 0), 	end_time:new Date(2000, 0, 0, 19, 0), 	start_recurance:new Date(2014, 1, 11), 	end_recurance:new Date(2014, 7, 25), 	recurance_data:{'type':'day_of_week', 	day:2, 	week:[1, 3]}}]},
							{title: 'event14', 	description: 'no', 				disciplines: {relation:true, table:'discipline', col:'title', data:['dis6']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag5']},		 					venue: {relation:true, table:'venue', col:'title', data:'venue5'}, 	min_cost:null, 	max_cost: null, 	cost: 100, 	admins:{relation:true, table:'user', col:'username', data:['person1']}, 						created_by: {relation:true, table:'user', col:'username', data:'person1'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 0, 15), 	end_date:new Date(2014, 0, 15), 	start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 22, 0)}]},
							{title: 'event15', 	description: 'this same no', 	disciplines: {relation:true, table:'discipline', col:'title', data:['dis8']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag1', 'tag3']},					venue: {relation:true, table:'venue', col:'title', data:'venue6'}, 	min_cost:10, 	max_cost: 200, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person2']}, 						created_by: {relation:true, table:'user', col:'username', data:'person2'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 0, 22), 	end_date:new Date(2014, 0, 22), 	start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 22, 0)}]},
							{title: 'event16', 	description: 'strange no', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis9']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag9', 'tag7', 'tag5', 'tag2']},	venue: {relation:true, table:'venue', col:'title', data:'venue7'}, 	min_cost:3, 	max_cost: 5, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person3', 'person1']}, 				created_by: {relation:true, table:'user', col:'username', data:'person3'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 1, 2), 	end_date:new Date(2014, 1, 2), 		start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 22, 0)}]},
							{title: 'event17', 	description: 'this yes', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis9']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag4', 'tag1']},					venue: {relation:true, table:'venue', col:'title', data:'venue7'}, 	min_cost:3, 	max_cost: 5, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person3']}, 						created_by: {relation:true, table:'user', col:'username', data:'person3'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 0, 25), 	end_date:new Date(2014, 0, 25), 	start_time:new Date(2000, 0, 0, 19, 0), 	end_time:new Date(2000, 0, 0, 22, 0)}]},
							{title: 'event18', 	description: 'yes', 			disciplines: {relation:true, table:'discipline', col:'title', data:['dis8', 'dis4']}, 					tags:{relation:true, table:'tag', col:'title', data:['tag3']},							venue: {relation:true, table:'venue', col:'title', data:'venue7'}, 	min_cost:10, 	max_cost: 15, 		cost: null, admins:null, 																					created_by: {relation:true, table:'user', col:'username', data:'person5'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 1, 14), 	end_date:new Date(2014, 1, 14), 	start_time:null, 							end_time:null}]},
							{title: 'event19', 	description: 'strange', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis4']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag6']},							venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:10, 	max_cost: 20, 		cost: null, admins:{relation:true, table:'user', col:'username', data:['person5', 'person6']}, 				created_by: {relation:true, table:'user', col:'username', data:'person4'}, 		timing_mode:'recur_mode', occurences: [	{time_mode:'fixed', 	start_date:new Date(2014, 2, 7), 	end_date:new Date(2014, 2, 8), 		start_time:new Date(2000, 0, 0, 22, 0), 	end_time:new Date(2000, 0, 0, 2, 0), 	start_recurance:new Date(2014, 2, 7), 	end_recurance:new Date(2014, 7, 1), 	recurance_data:{'type':'day_of_week', 	day:[0]}}]},
							{title: 'event20', 	description: 'strange no', 		disciplines: {relation:true, table:'discipline', col:'title', data:['dis9']}, 							tags:{relation:true, table:'tag', col:'title', data:['tag9', 'tag7', 'tag5', 'tag2']},	venue: {relation:true, table:'venue', col:'title', data:'venue2'}, 	min_cost:null, 	max_cost: null, 	cost: 5, 	admins:{relation:true, table:'user', col:'username', data:['person3']}, 						created_by: {relation:true, table:'user', col:'username', data:'person3'}, 		timing_mode:'occur_mode', occurences: [	{time_mode:'all_day', 	start_date:new Date(2014, 1, 22), 	end_date:new Date(2014, 1, 22), 	start_time:null, 							end_time:null}]}
						]
			};

			var query = [{"column":"title", "type":"equal", "value":["tag1", "tag2"]}];

			var createAll = false;
			var createOnly = ['event'];

			var promises = [];
			var promise = $.Deferred();
			
			var getFunc = function(f, args) {
				return(function(e) {
					return(f.apply(null, args));
				});
			};

			var getPrintFunc = function(msg) {
				return(function(e) {
					console.log(msg);
				});
			};

			promise.resolve();
			_.each(db, function(table, key){

				if (createAll || (!createAll && _.contains(createOnly, key))) {
					
					promise = promise.then(getPrintFunc("building " + key  + " table"));					
					_.each(table, function(obj, idx) {
						promise = promise.then(getFunc( ef_database.CRUD.create, [key, obj]));
						promise = promise.then(getPrintFunc("	completed entry " + idx));
					});

					promise = promise.then(getPrintFunc("completed " + key  + " table"));
				}
			});
			

			promise.then(function(e){
				console.log("testing database complete.");
			});

		},

		testHelperFunctions:function() {
			console.log("testing helper Methods************************");

			//****codeAddress****
			helpers.codeAddress("").done(function(obj){
				TEST.areEqual(obj.code, error.address_empty.code, "codeAddress: Throws correct error when address is empty.");
			});

			helpers.codeAddress("123423432332#$@").done(function(obj){
				TEST.areEqual(obj.code, error.address_not_found.code, "codeAddress: Throws correct error when address not found.");
			});

			helpers.codeAddress("1618 Brown Street Philadelphia, PA").done(function(obj){
				TEST.isTruthy((obj.latitude === 39.96821) && (obj.longitude === -75.16422399999999), "codeAddress: Returns correct long/lat when passed.");
			});

			//****getTable****
			var t = helpers.getTable();
			TEST.areEqual(t.code, error.no_type.code, "getTable: Throws correct error when address is empty.");

			var t = helpers.getTable("User");
			TEST.areEqual(t, Parse.User, "getTable: returns Parse.User Object when given 'user' as type");

			//****getTableCol
			helpers.getTableCols("").done(function(obj){
				TEST.areEqual(obj.code, error.no_type.code, "getTableCols: returns no_type error if type is empty");
			});

			helpers.getTableCols().done(function(obj){
				TEST.areEqual(obj.code, error.no_type.code, "getTableCols: returns no_type error if type is undefined");
			});
			
			helpers.getTableCols("event").done(function(obj){
				//var expected = ["username", "email", "is_organization", "first_name", "last_name", "telephone", "public_user", "description", "admin_status", "photos", "social_media", "disciplines", "tags", "admins", "member_of", "id", "createdAt", "updatedAt", "parseObj", "type"];
				//console.log(obj);
				//TEST.areEqual(obj, , "getTableCols: returns correct values type is defined.");
			});
			
			//****dataExists
			helpers.dataExists("").done(function(obj){
				TEST.areEqual(obj.code, error.no_type.code, "dataExists: returns no_type error if type is empty");
			});

			helpers.dataExists().done(function(obj){
				TEST.areEqual(obj.code, error.no_type.code, "dataExists: returns no_type error if type is undefined");
			});
		}		

	};

	// //retieve and remove all items from database
	// if (clearDatabase) {
	// 	$.when(CRUD.read("user"), CRUD.read("event"), CRUD.read("venue"), CRUD.read("tag"), CRUD.read("discipline")).then(function(){
	// 		var results = arguments;
	// 		var promises = [];

	// 		_.each(results, function(arr, idx){
	// 			_.each(arr, function(obj){
	// 				promises.push(obj.parseObj.destroy());
	// 			});
	// 		});

	// 		$.when.apply(null, promises).then(function(){
	// 			console.log("complete");
	// 		});
	// 	});	
	// }

	// var testingNS = {helpers:true, validation:false, CRUD:false};

	// //Helper Methods
	// if (testingNS.helpers) {
	// 	console.log("testing helper Methods************************");

	// 	//****codeAddress****
	// 	helpers.codeAddress("").done(function(obj){
	// 		TEST.areEqual(obj.code, error.address_empty.code, "codeAddress: Throws correct error when address is empty.");
	// 	});

	// 	helpers.codeAddress("123423432332#$@").done(function(obj){
	// 		TEST.areEqual(obj.code, error.address_not_found.code, "codeAddress: Throws correct error when address not found.");
	// 	});

	// 	helpers.codeAddress("1618 Brown Street Philadelphia, PA").done(function(obj){
	// 		TEST.isTruthy((obj.latitude === 39.96821) && (obj.longitude === -75.16422399999999), "codeAddress: Returns correct long/lat when passed.");
	// 	});

	// 	//****getTable****
	// 	var t = helpers.getTable();
	// 	TEST.areEqual(t.code, error.no_type.code, "getTable: Throws correct error when address is empty.");

	// 	var t = helpers.getTable("User");
	// 	TEST.areEqual(t, Parse.User, "getTable: returns Parse.User Object when given 'user' as type");

	// 	//****getTableCol
	// 	helpers.getTableCols("").done(function(obj){
	// 		TEST.areEqual(obj.code, error.no_type.code, "getTableCols: returns no_type error if type is empty");
	// 	});

	// 	helpers.getTableCols().done(function(obj){
	// 		TEST.areEqual(obj.code, error.no_type.code, "getTableCols: returns no_type error if type is undefined");
	// 	});
		
	// 	helpers.getTableCols("event").done(function(obj){
	// 		//var expected = ["username", "email", "is_organization", "first_name", "last_name", "telephone", "public_user", "description", "admin_status", "photos", "social_media", "disciplines", "tags", "admins", "member_of", "id", "createdAt", "updatedAt", "parseObj", "type"];
	// 		console.log(obj);
	// 		//TEST.areEqual(obj, , "getTableCols: returns correct values type is defined.");
	// 	});
		
	// 	//****dataExists
	// 	helpers.dataExists("").done(function(obj){
	// 		TEST.areEqual(obj.code, error.no_type.code, "dataExists: returns no_type error if type is empty");
	// 	});

	// 	helpers.dataExists().done(function(obj){
	// 		TEST.areEqual(obj.code, error.no_type.code, "dataExists: returns no_type error if type is undefined");
	// 	});
	// }

	// if (testingNS.validation) {
	// 	console.log("testing validation Methods************************");
	// }

	// if (testingNS.CRUD) {
	// 	console.log("testing CRUD Methods************************");
	// }
}(jQuery, window, document));