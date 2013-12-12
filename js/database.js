window.ef_database = {
	error:{
		address_not_found:{code:"address_not_found" , message:"Error: Address not found."},
		address_empty:{code:"address_empty", message:"Error: Google Maps Network error."},
		no_type:{code:"no_type", message:"Error: No Null value provided."},

		buildError:function(code) {
			return(code);
		}
	},

	models:{
		createObject:function(type, obj){
			var e = obj.attributes;

			$.extend(e, obj.attibutes);
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
				def.resolve(error.buildError(error.address_empty));
			}

	      	geocoder = new google.maps.Geocoder();
	      	geocoder.geocode( { 'address': address}, function(results, status) {
	        	if (status == google.maps.GeocoderStatus.OK) {
	        		def.resolve({latitude:results[0].geometry.location.lat(), longitude:results[0].geometry.location.lng()});
	        	} else {
	          		def.resolve(error.buildError(error.address_not_found));
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
				return(error.buildError(error.no_type));
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
				def.resolve(error.buildError(error.no_type));
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
				def.resolve(error.buildError(error.no_type));
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
		//CRUD functions
		creation:{
			Event:function(data){
				var def = $.Deferred(),
					root = window.ef_database,
					helpers = root.helpers,
					eventOccurData = data.occurence,
					eventData = data,
					promises = [],
					occurObjs = [];

				var EventOccurTable = helpers.getTable("EventOccurences"),
					EventTable = helpers.getTable("Event"),
					eventRow = new EventTable(),
					occurObj = [];

				delete eventData['occurence'];

				//save occurence data
				_.each(eventOccurData, function(obj){
					var ecRow = new EventOccurTable();
					
					obj.recurs = (eventData.timing_mode === "recur_mode");
					obj.event_data = eventRow;
					
					occurObj.push(ecRow);
					promises.push(ecRow.save(obj));
				});

				Parse.Promise.when(promises).then(function() {
					//create relation and then save the event data
					var occur = eventRow.relation("occurences");
					occur.add(occurObj);

					eventRow.save(eventData).then(function(obj){
						def.resolve(obj);
					});
					
				});
				
				return(def.promise());
			},

			default: function(type, data) {
				var def = $.Deferred();
				
				var root = window.ef_database;
				var helpers = root.helpers;
				var Table = helpers.getTable(type);
				var obj = new Table();

				var func = (type === "user")? "signUp":"save";

				obj[func](data).done(function(results) {
					def.resolve(results);
				}).fail(function(error) {
					def.reject(error);
				});

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
							def.resolve(results);
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

		read:function(type, query_params, ordering, pagination) {
			var def = $.Deferred();
			var root = window.ef_database;
			var helpers = root.helpers;
			var models =  root.models;

			type = type.capitalize();
			var Table = helpers.getTable(type);
			var query = new Parse.Query(Table);

			if(_.isEmpty(query_params)){
				pagination = undefined;
			}

			if(_.isEmpty(ordering)){
				pagination = undefined;
			}

			if(_.isEmpty(pagination)){
				pagination = undefined;
			}

			if (query_params !== undefined) {
				_.each(query_params, function(obj){
					switch(obj.type) {
						case("range"):
							query.greaterThanOrEqualTo(obj.column, obj.value.min);
							query.lessThanOrEqualTo(obj.column, obj.value.max);
							break;
						case("full_text"):
							query.contains(obj.column, obj.value);
							break;
						case("equal", "in_array"):
							if (_.isArray(obj.value))
								query.containedIn(obj.column, obj.value);
							else
								query.equalTo(obj.column, obj.value);
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
					}
				});

			}

			if (ordering !== undefined) {
				if (ordering.direction === "up") {
					query.ascending(ordering.column);
				} else {
					query.descending(ordering.column);
				}
			}

			if (pagination !== undefined) {
				query.count().done(function(count){
					
					if (count < pagination.page*pagination.limit) {
						pagination.page = Math.floor(count/pagination.limit);
					}

					query.limit(pagination.limit);
					query.skip(pagination.page*pagination.limit);


					query.find().done(function(results){
						var r = _.map(results, function(obj){return(models.createObject(type, obj));});
						def.resolve(r);
					});
				});
			} else {
				query.find().done(function(results){
					var r = _.map(results, function(obj){return(models.createObject(type, obj));});
					def.resolve(r);
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