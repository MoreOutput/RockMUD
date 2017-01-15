/*
	CouchDB Driver for RockMUD. Example REST driver.

	Basically we just make rest calls to an outlined database and grab JSON blobs.
	
	Objects have the same form as the default flat-file system.

	Databases should already be seetup within couch.
*/
'use strict';
var http = require('https');

module.exports = function(config) {
	// Setup driver wide properties
	var Driver = function() {
		var driver = this;

		driver.dataDbName = 'rockmud';
		driver.playerDbName = 'rockmud_players';
		driver.dbHost = 'moreoutput.cloudant.com';
        driver.dbPort = 443;
        driver.username = 'moreoutput';
        driver.password = 'rolento1';
		driver.dataView = 'areasByName',
		driver.playerView = '_design/players/_view/byName?key=';
		driver.authHeader = 'Basic ' + new Buffer(driver.username + ':' + driver.password).toString('base64');
		driver.createGenericOpt = function(method, db, data) {
			var path = '/' + driver.playerDbName;	

			return {
				hostname: driver.dbHost,
  				method: method,
				port: driver.dbPort,
				path: path,	
  				headers: {
    				'Content-Type': 'application/json',
					'Authorization': driver.authHeader
  				}
			};
		};

		return driver;
	};

	Driver.prototype.savePlayer = function(obj, fn) {
		var options = this.createGenericOpt('POST', this.playerDbName, obj),
		req = http.request(options, function(res) {
			res.on('data', function() {
			
			});

			res.on('end', function() {
    			fn(false, obj);
  			});
		});

		req.on('error', function(e) {
			
		});

		req.write(obj);
		req.end();
	};

	Driver.prototype.getPlayer = function(name, fn) {
		var driver = this,
		options = {
			method: 'GET',
			host: driver.dbHost,
			port: driver.dbPort,
			path: '/' + driver.playerDbName + '/' + driver.playerView + '%22' + name.toLowerCase() + '%22',
			headers: {
				'Authorization': driver.authHeader,
				'Content-Type': 'application/json'
			}
		},
		result = '',
		req = http.request(options, function(res) {
			res.on('data', function(c) {
				result += c;
			});

			res.on('end', function() {
				result = JSON.parse(result);

				if (result) {
					if (result.rows.length) {
						result = result.rows[0].value;

						// the player ID should match document ID
						if (result.id !== result._id) {
							result.id = result._id;
						}
					} else {
						result = false;
					}
				}

				if (result) {
    				return fn(false, result);
				} else {
					return fn(true, false);
				}
  			});
		}).end();
	};

	return new Driver();
}
 
