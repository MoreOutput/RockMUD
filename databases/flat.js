/*
	Flat file data persistence for RockMUD

	Persistence files are saved in directories within the areas folder. 
*/
'use strict';
var fs = require('fs'),
Driver = function(path) {
	console.log('driver construction', path);
	this.path = '';
	this.folderPrefix = 'persistence_';
};

Driver.prototype.loadAreas = function(areaNames, fn) {
	var driver = this;

	console.log(this.path);	

	areaNames.forEach(function(areaId, index) {
		areaId = areaId.toLowerCase().replace(/ /g, '_');

		fs.readFile('./areas/' + driver.folderPrefix + areaId + '/' + areaId + '.json', function (err, r) {
			var area;
		
			area = require('.' + path + );

			areas.push(area);
		});
	});
};

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