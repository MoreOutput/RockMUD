/*
	Flat file data persistence for RockMUD

	Persistence files are saved in directories within the areas folder. 
*/
'use strict';
var fs = require('fs');

module.exports = function(config) {
	// Setup driver wide properties
	var Driver = function() {
		var defaultPath = '../areas';
		var folderPrefix = 'persistence_';

		if (config) {
			if (!config.path) {
				this.path = defaultPath;
			} else {
				this.path = config.path;
			}
	
			if (!config.folderPrefix) {
				this.folderPrefix = folderPrefix;
			} else {
				this.folderPrefix = config.folderPrefix;
			}

			this.config = config;
		}
 
		return this;
	};
	
	// Get all areas. First driver function called.
	// Must be given and return a function.
	Driver.prototype.loadAreas = function(fn) {
		var driver = this,
		areas  = [];
	/*
		console.log(this.path);	

		areaNames.forEach(function(areaId, index) {
			areaId = areaId.toLowerCase().replace(/ /g, '_');

			fs.readFile('./areas/' + driver.folderPrefix + areaId + '/' + areaId + '.json', function (err, r) {
				var area;

				area = require('.' + path + );

				areas.push(area);
			});
		});
	*/
		return fn(areas);
	};

	/*
	Driver.prototype.loadArea = function(area, fn) {

	};

	Driver.prototype.saveArea = function(area, initialSave, fn) {
		if (initialSave) {
			fs.mkdir('./areas/' + driver.folderPrefix + area.id, function(err) {
				if (!err) {
					fs.writeFile('./areas/' + driver.folderPrefix + area.id + '/' + area.id + '.json', JSON.stringify(area, null), function (err) {

					});
				}
			});
		} else {
			fs.writeFile('./areas/' + driver.folderPrefix + area.id + '/' + area.id + '.json', JSON.stringify(area, null), function (err) {

			});
		}
	};

	Driver.prototype.savePlayer = function(area, fn) {

	};

	Driver.prototype.saveMob = function(area, fn) {

	};
	*/

	return new Driver();
}
