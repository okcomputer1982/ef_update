window.ef_database = {
	error:{
		address_not_found:{code:"address_not_found" , message:"Error: Address not found."},
		address_empty:{code:"address_empty", message:"Error: Google Maps Network error."},
		no_type:{code:"no_type", message:"Error: Null value provided."},
		bad_type:{code:"bad_type", message:"Error: Incorrect value provided."},

		build:function(code) {
			return(code);
		}
	},

	warning:{
		no_entries_found:{code:"no_entries_found" , message:"Warning: Address not found."},
		
		build:function(code) {
			return(code);
		}
	},

	models:{
		getNextDay:function(day, d){
			var date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
			
			while(date.getDay() !== day){
				date.setDate(date.getDate()+1);
			}

			return(date);
		},

		getNthWeek:function(day) {
			var nth = Math.floor(day/7);
			if (day%7 === 0)
				nth = nth - 1;

			return(nth);
		},

		isLastWeek:function(date) {
			var m = date.getMonth();
			var numDays = XDate.getDaysInMonth(date.getFullYear(), date.getMonth());
			
			//find last day of the date's month
			//move back until we get to current day
			for(var d = new Date(date.getFullYear(), date.getMonth(), numDays); d.getDay() !== date.getDay(); d.setDate(d.getDate() - 1));

			//getNthWeek and see if it is each to the days getNthWeek
			return(this.getNthWeek(d.getDate()) === this.getNthWeek(date.getDate()));
		},

		recuranceSearch:function(rData, queryRange, eventRange){
			var root = this;
			var recurData = rData.recurance_data;
			var recurType = recurData.type;
			var recurRange = {start_date: rData.start_recurance, end_date:rData.end_recurance};
			//get the smallest possible range of the recurance
			var finalRange = {start_date:(queryRange.start_date > recurRange.start_date)?queryRange.start_date:recurRange.start_date,
							  end_date:(queryRange.end_date < recurRange.end_date)?queryRange.end_date:recurRange.end_date};
			var rtn = [];

			switch(recurType){
				case("everyday"):
					//for each day in finalRange, create an event
					var e = eventRange.end_date;

					for(var s = finalRange.start_date; s <= finalRange.end_date; s.setDate(s.getDate() + 1)) {
						var r = {start_date:new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0), end_date:new Date(e.getFullYear(), e.getMonth(), e.getDate(), 0, 0)};
						rtn.push(r);
						e.setDate(e.getDate() + 1);
					}
					break;

				case("day_of_week"):
					//if we have a by_week limiter, get it:
					var by_week = (recurData.hasOwnProperty("week"))?recurData.week:[];

					//so first, find the first days of the week that exist within the range
					var day_of_week = [];
					_.each(recurData.day, function(day){
						day_of_week.push(root.getNextDay(day, finalRange.start_date));
					});

					//get the days between the actual event length
					var days_between = XDate(eventRange.start_date).diffDays(XDate(eventRange.end_date));

					//then increment through each day and add seven days throughout the range
					for(var s = finalRange.start_date; s <= finalRange.end_date; s.setDate(s.getDate() + 7)) {
						_.each(day_of_week, function(d, idx){

							//check if the week is within our week range
							if (d <= finalRange.end_date && (_.isEmpty(by_week) || _.contains(by_week, root.getNthWeek(d.getDate())) || ( _.contains(by_week, 999) && root.isLastWeek(d) ) ) ) {
								var r = {start_date:new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0), end_date:new Date(d.getFullYear(), d.getMonth(), d.getDate() + days_between, 0, 0)};
								rtn.push(r);
							}

							d.setDate(d.getDate() + 7);
						});
					}

					break;
					
				case("day_of_month"):

					break;	
			}

			return(rtn);
		},

		createObject:function(type, obj){
			var e = $.extend({}, obj.attributes);

			e.id = obj.id;
			e.createdAt  = obj.createdAt;
			e.updatedAt  = obj.updatedAt;
			e.parseObj = obj;
			e.type = type;

			return(e);
		},

		createEvent:function(obj){
			//gets the parse object and creates an event object
			return(this.createObject("Event", obj));
		},

		createOccurEvent:function(eData, oData){
			//gets the parse object and creates an event object
			var rtn = this.createObject("Event", eData.parseObj);
			$.extend(rtn, oData.attributes);
			rtn.occurParseObj = oData;

			return(rtn);
		},

		createRecurEvent:function(eData, rData, dateRange){
			//gets the parse object and creates an event object
			var rtn = [];
			var root = this;
			var eventRange = {start_date:rData.attributes.start_date, end_date:rData.attributes.end_date};
			var dates = this.recuranceSearch(rData.attributes, dateRange, eventRange);

			_.each(dates, function(d, idx){
				var e = root.createObject("Event", eData.parseObj);

				e.start_date = new Date(d.start_date.getFullYear(), d.start_date.getMonth(), d.start_date.getDate());
				e.end_date = new Date(d.end_date.getFullYear(), d.end_date.getMonth(), d.end_date.getDate());
				e.occurParseObj = rData;

				rtn.push(e);
			});

			return(rtn);
		},

		createVenue:function(obj){
			//gets the parse object and creates an venue object
			return(this.createObject("Venue", obj));
		},

		createUser:function(obj){
			//gets the parse object and creates an user object
			return(this.createObject("User", obj));
		},

		createDiscipline:function(obj){
			//gets the parse object and creates an user object
			return(this.createObject("Discipline", obj));
		},
		
		createTag:function(obj){
			//gets the parse object and creates an user object
			return(this.createObject("Tag", obj));
		}
	},

	//Helper functions
	helpers:{
		codeAddress: function(address) {
		//returns the long/lat of a given address string
			var def = $.Deferred();
			var root = window.ef_database;
			var error = root.error;

			if (_.isEmpty(address)){
				def.resolve(error.build(error.address_empty));
			}

	      	geocoder = new google.maps.Geocoder();
	      	geocoder.geocode( { 'address': address}, function(results, status) {
	        	if (status == google.maps.GeocoderStatus.OK) {
	        		def.resolve({latitude:results[0].geometry.location.lat(), longitude:results[0].geometry.location.lng()});
	        	} else {
	          		def.resolve(error.build(error.address_not_found));
	        	}
	      	});

	      	return(def.promise());
	   	},

		getTable:function(type) {
		//returns the "class" defintion" related to a given table
			var Table;
			var root = window.ef_database;
			var error = root.error;

			if (_.isEmpty(type)) {
				return(error.build(error.no_type));
			}

			type = type.capitalize();
			if (type === "User") {
				Table = Parse.User;
			} else {
				Table = Parse.Object.extend(type);
			}

			return(Table);
		},

		getTableCols:function(type) {
			var root = window.ef_database;
			var error = root.error;
			var def = $.Deferred();

			if (_.isEmpty(type)) {
				def.resolve(error.build(error.no_type));
				return(def.promise());
			}

			root.CRUD.read(type, {}, {}, {limit:1, page:0}).done(function(results){
				var r = _.map(results[0], function(obj, key){return(key);});
				def.resolve(r);
			});

			return(def.promise());
		},

		dataExists:function(type, col, data) {
		//checks to see if a particular item exists within
		//within a table[type] in column[col] and containing data[data]
		//returns a promise, with exists = true if exists
			var def = $.Deferred();
			var root = window.ef_database;
			var error = root.error;

			if (_.isEmpty(type) || type === "") {
				def.resolve(error.build(error.no_type));
				return(def.promise());
			}

			if (data === undefined) {
				rtn = {type:type, column:col, data:data, exists:false};
			}

			
			var Table = root.helpers.getTable(type);
			
			var query = new Parse.Query(Table);
			query.equalTo(col, data);
			query.find().done(function(results){
				var rtn = {type:type, column:col, data:data, exists:results.length !== 0};
				def.resolve(rtn);
			});

			return(def.promise());
		},

		listExists:function(type, col, list) {
		//finds out if items[list] in a table[type] with
		//a col[col] all exist within the database
		//if some do not, returns false and a list 
		//of the non-unique items
			var root = this;
			type = type.capitalize();

			var Table = root.getTable(type);
			var def = $.Deferred();

			var unique_promises = [];

			$.map(list, function(title, val){
			//adds all promises to the an array
				unique_promises.push(
				root.dataExists(type, col, title));
			});

			$.when.apply(null, unique_promises).then(function(){
				var results = arguments;
				var rtn = {type:type, col:col};


				rtn.allExist = _.every(results, function(r){return(r.exists === true)});
				//checks if all results are true
				//if one does not, returns falses

				
				//if one of these items is false,
				//find all items in the results items that are false
				//add add a list of those items to our return obj
			 	var non_uniq_items = _.filter(results, function(obj){
			 		return(obj.exists === false);
			 	});
			 	var uniq_items = _.difference(results, non_uniq_items);

			 	rtn.uniq_items = _.map(non_uniq_items, function(obj){return(obj.data)});

			 	rtn.exist_items = _.map(uniq_items, function(obj){return(obj.data)});

				def.resolve(rtn);
			});

			return(def.promise());
		},

		getRelationPromises:function(data) {
			//finds all data entries that contain a relation, does a search for that related data and puts the result into an array of promises.
			var rPromises = [];
			var root = window.ef_database;
			var CRUD = root.CRUD;

			_.each(data, function(obj, key){

				if (_.isObject(obj)) {
					var rel = (obj.hasOwnProperty('relation'))?obj.relation:false;

					if (rel) {
					//if this object is a relation, we want to do a search under the table, within the col column for value data
					//get the first response and add to the relation (if array) or pointer (if obj)	
						if (_.isArray(obj.data)) {
							_.each(obj.data, function(d) {
								rPromises.push(CRUD.read(obj.table, [{column:obj.col, type:'equal', value:d}],{}, {}, key, "relation"));
							});
						} else {
							rPromises.push(CRUD.read(obj.table, [{column:obj.col, type:'equal', value:obj.data}],{}, {}, key, "pointer"));
						}
					}
				}
			});

			return(rPromises);
		},

		processRelationPromises:function(data, results) {
			//reseaves the results of a relation promise array replaces relation data with, in this case, the id of that item
			//can be modified for direct object based relationships or index tables

			var rel = {};		
			
			_.each(results, function(r){
				if (r.results.length > 0) {
					var relationCol = r.args[r.args.length-2];
					var relationType = r.args[r.args.length-1];
					var relationItem = r.results[0].parseObj;

					if (relationType === "pointer") {
						data[relationCol] = relationItem.id;
					} else {
						if (!_.isArray(data[relationCol])) {
							data[relationCol] = [];
						}

						data[relationCol].push(relationItem.id);
					}
				}
			});

			return(data);
		}
	},

	validation:{
		validate:function(type, data) {
			var def = $.Deferred();
			var root = window.ef_database;
			switch(type) {
				case("Venue"):
					root.helpers.codeAddress(data.address + " " + data.city + " " + data.state).done(function(r){
						data.geoPoint = new Parse.GeoPoint(r);
						def.resolve();	
					});
					break;
				default:
					def.resolve();
					break;
			}

			
			return(def.promise());
		}
	},

	CRUD: {
		relationCols:["disciplines", "tags", "venue", "created_by", "admins", "occurences", "event_data", "admins", "parent", "member_of"],

		//CRUD functions
		creation:{
			Event:function(data){
				var def = $.Deferred(),
					root = window.ef_database,
					helpers = root.helpers,
					eventOccurData = data.occurences,
					eventData = data,
					promises = [],
					occurObjs = [];

				var EventOccurTable = helpers.getTable("EventOccurences"),
					EventTable = helpers.getTable("Event"),
					eventRow = new EventTable(),
					occurObj = [];


				//save occurence data
				_.each(eventOccurData, function(obj){
					var ecRow = new EventOccurTable();
					
					obj.recurs = (eventData.timing_mode === "recur_mode");
					
					occurObj.push(ecRow);
					promises.push(ecRow.save(obj));
				});

				///find all other instances of relations withn (createdBy, tags, disciplines, etc.)
				var relationObjs = helpers.getRelationPromises(eventData);

				//get all the occurance data
				Parse.Promise.when(promises).then(function() {

					//get all their relations promises
					$.when.apply(null, relationObjs).done(function() {
						var results = arguments;

						//collect the results of the relations(ids from their related objects) and add to the eventData
						eventData = helpers.processRelationPromises(eventData, results);

						//for each of the occurences, push it's id into the current event object
						eventData['occurences']  = [];
						_.each(occurObj, function(obj) {
							eventData['occurences'].push(obj.id);
						});
						
						eventRow.save(eventData).then(function(obj){
							var id = obj.id;
							var p = [];

							_.each(occurObj, function(o){
								o.set("event_data", id);
								p.push(o.save());
							});

							Parse.Promise.when(p).then(function(e){
								def.resolve(obj);
							});
						});
					});
				});
				
				return(def.promise());
			},

			default: function(type, data) {
				var def = $.Deferred();
				
				var root = window.ef_database;
				var CRUD = root.CRUD;
				var helpers = root.helpers;
				var Table = helpers.getTable(type);
				var obj = new Table();
				
				var func = (type === "user")? "signUp":"save";
				
				var rPromises = helpers.getRelationPromises(data);


				if (!_.isEmpty(rPromises)){
					//if we have pending queries for relation items

					$.when.apply(null, rPromises).done(function() {
						var results = arguments;
						data = helpers.processRelationPromises(data, results);
						
						obj[func](data).done(function(results) {
							def.resolve(results);
						}).fail(function(error) {
							def.reject(error);
						});
					});

				} else {
					obj[func](data).done(function(results) {
						def.resolve(results);
					}).fail(function(error) {
						def.reject(error);
					});
				}

				return(def.promise());
			}
		},

		create:function (type, data) {
		//given type and data, performs validation, puts data into the database and returns object of in plugin data form
			var def = $.Deferred();
			var root = window.ef_database;
			var CRUD = root.CRUD;
			var validation = root.validation;
			var helpers = root.helpers;

			type = type.capitalize();

			validation.validate(type, data)
				.done(function() {

					if (type in CRUD.creation) {
						root.CRUD.creation['Event'](data).done(function(results){
							def.resolve(results, arguments);
						});
					} else {
						root.CRUD.creation['default'](type, data).done(function(results){
							def.resolve(results);
						});
					}

				})
				.fail(function(){

				});

			return(def.promise());
		},

		reading:{
			runQuery:function(query, type, args) {
				var def = $.Deferred();
				var root = window.ef_database;
				var warning =  root.warning;
				var models = root.models;

				query.find().done(function(results){
					var r = _.map(results, function(obj){return(models.createObject(type, obj));});
					def.resolve({results:r, args:args});
				});

				return(def.promise());
			},

			getQuery:function(query_params, query) {
				if (query_params === undefined)
					return(query);

				_.each(query_params, function(obj){
					obj.type = obj.type.trim();

					switch(obj.type) {
						case("range"):
							query.greaterThanOrEqualTo(obj.column, obj.value.min);
							query.lessThanOrEqualTo(obj.column, obj.value.max);
							break;
						case("full_text"):
							query.contains(obj.column, obj.value);
							break;
						case("in_array"):
						case("equal"):
							if (_.isArray(obj.value))
								query.containedIn(obj.column, obj.value);
							else {
								query.equalTo(obj.column, obj.value);
							}
							break;
						case("lessThen"):
							query.lessThanOrEqualTo(obj.column, obj.value);
							break;
						case("greaterThen"):
							query.greaterThanOrEqualTo(obj.column, obj.value);
							break;
						case("near"):
							query.near(obj.column, obj.value);
							break;
						case("withinMiles"):
							query.withinMiles(obj.column, obj.value.point, obj.value.distance)
							break;
						default:
							def.resolve(error.build(error.bad_type));
					}
				});

				return(query);
			},

			getPagination:function(pagination, query) {
				var def = $.Deferred();

				query.count().done(function(count) {
						
					if (count < pagination.page*pagination.limit) {
						pagination.page = Math.floor(count/pagination.limit);
					}

					query.limit(pagination.limit);
					query.skip(pagination.page*pagination.limit);
					
					def.resolve(query);
				});

				return(def.promise());
			},

			getOrdering:function(ordering, query) {
				if (ordering !== undefined) {
					
					if (ordering.direction === "up") {
						query.ascending(ordering.column);
					} else {
						query.descending(ordering.column);
					}
				}

				return(query);
			},

			setParams:function(query_params, ordering, pagination) {
				if(_.isEmpty(query_params)){
					query_params = undefined;
				}

				if(_.isEmpty(ordering)){
					ordering = undefined;
				}

				if(_.isEmpty(pagination)){
					pagination = undefined;
				}

				return({query:query_params, ordering:ordering, pagination:pagination});
			},

			Event:function(type, query_params, ordering, pagination) {
				var def = $.Deferred(),
					root = window.ef_database,
					read =  root.CRUD.reading,
					helpers = root.helpers;
					models = root.models;

					eventTable = helpers.getTable("event"),
					eventOccurTable = helpers.getTable("eventOccurences"),
					dataQuery = new Parse.Query(eventTable),

					args = arguments,
					events = [];

				//we we have two types of queries
				var dataQueriesCol = ["title", "description", "disciplines", "tags", "venue", "min_cost", "max_cost", "cost", "timing_mode", "created_by", "admins"],
					timeQueriesCol = ["start_date", "end_date", "time_mode", "start_time", "end_time", "recurs"];

				//we need seperate queries based on data from queries based on time
				var dataQueries = [],
					timeOccurQueries = [],
					timeRecurQueries = [];

				//add default attributes if not present
				var date_range = {};
				_.each(query_params, function(obj){
					if (obj.column === "start_date" && obj.type === "greaterThen") {
						date_range.start_date = obj.value;
					}

					if (obj.column === "start_date" && obj.type === "lessThen") {
						date_range.end_date = obj.value;
					}
				});

				if (!date_range.hasOwnProperty("start_date")) {
					date_range.start_date = new Date();
					query_params.push({column:"start_date", type:"greaterThen", value:date_range.start_date});
				}

				if (!date_range.hasOwnProperty("end_date")) {
					var d = new Date();
					d.setDate(d.getDate() + 7);
					date_range.end_date = d;
					query_params.push({column:"start_date", type:"lessThen", value:date_range.end_date});
				}

				//loop through each query_param and create seperate parameters for recur and occur items
				_.each(query_params, function(obj){
					if (_.contains(dataQueriesCol, obj.column)) {
						dataQueries.push(obj);
					} else {

						//add in recurance level query searches if nessisary
						if (obj.column === "start_date") {
							timeRecurQueries.push({column:"start_recurance", type:obj.type, value:obj.value});
							timeOccurQueries.push(obj);
						}
						
						if (obj.column === "end_date") {
							timeRecurQueries.push({column:"end_recurance", type:obj.type, value:obj.value});
							timeOccurQueries.push(obj);
						}
					}
				})

				//now, lets just do a search using the usual methods for dataQueuies
				dataQuery = read.getQuery(dataQueries, dataQuery);
				
				//now that we have these, we will need to collect all of the occurances related to them
				read.runQuery(dataQuery, type, args).done(function(eventDataArr){
					var occurance_id = [];
					
					_.each(eventDataArr.results, function(obj){
						occurance_id = occurance_id.concat(obj.occurences);
					});
					
					//got it. Now we will need to eventOccur for all these items
					//ideally filtering out those outside our current selected range

					var rQuery = new Parse.Query(eventOccurTable),
						oQuery = new Parse.Query(eventOccurTable);

					rQuery.equalTo('recurs', true);
					rQuery.containedIn('objectId', occurance_id);
					read.getQuery(timeRecurQueries, rQuery);

					oQuery.equalTo('recurs', false);
					oQuery.containedIn('objectId', occurance_id);
					read.getQuery(timeOccurQueries, oQuery);

					Parse.Promise.when(oQuery.find(), rQuery.find()).then(function(oResults, rResults){
						var results = [];
						
						//loop through each of occurance items
						_.each(oResults, function(oData){
							var eventDataItem = _.findWhere(eventDataArr.results, {id:oData.attributes.event_data}),
								eModel = models.createOccurEvent(eventDataItem, oData);
							events.push(eModel);
						});

						//loop through each of recurance items
						_.each(rResults, function(rData){
							var eventDataItem = _.findWhere(eventDataArr.results, {id:rData.attributes.event_data}),
								eModel = models.createRecurEvent(eventDataItem, rData, date_range);

							//retrieve the events generated by the recurances and concats them
							events = events.concat(eModel);
						});

						def.resolve(events);
					});
				});


				return(def.promise());
			},

			default:function(type, query_params, ordering, pagination) {
				var def = $.Deferred();
				var root = window.ef_database;
				var read =  root.CRUD.reading;
				var helpers = root.helpers;

				var Table = helpers.getTable(type);
				var query = new Parse.Query(Table);

				var args = arguments;
				
				query = read.getQuery(query_params, query);
				query = read.getOrdering(ordering, query);
				
				if (pagination !== undefined) {
					read.getPagination(pagination, query).done(function(q){
						read.runQuery(query, type, args).done(function(results){
							def.resolve(results);
						});
					});
				} else {
					read.runQuery(query, type, args).done(function(results){
						def.resolve(results);
					});
				}

				return(def.promise());
			}
		},

		read:function(type, query_params, ordering, pagination) {
			var def = $.Deferred();
			var root = window.ef_database;
			var helpers = root.helpers;
			var CRUD = root.CRUD;

			type = type.capitalize();

			var params = CRUD.reading.setParams(query_params, ordering, pagination);
			ordering = params.ordering;
			pagination = params.pagination;

			if (type in CRUD.reading) {
				CRUD.reading[type](type, query_params, ordering, pagination).done(function(results){
					def.resolve(results);
				});
			} else {
				CRUD.reading['default'](type, query_params, ordering, pagination).done(function(results){
					def.resolve(results);
				});
			}

			return(def.promise());
		}
	},

	//General functions
	init:function(){
		Parse.initialize("Qlbg8roXaC5pJZsFmxBgnxUzBcmNShAXNNbkhWuh", "WjaCUmBtcQC05RUJXhN0KkrEAssgkVCb1KtwqQrR");
	}
};