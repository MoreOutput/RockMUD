/*
* Working with game-wide data. Areas, Races, Classes and in-game Time
*/
'use strict';

var fs = require('fs'),
World = function() {
	this.races = [];
	this.classes = [];
};

World.prototype.getPlayableRaces = function(fn) {
	var world = this;

	if (world.races.length !== 0) {
		return fn(world.races);
	} else {
		fs.readdir('./races', function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile('./races/' + fileName, function (err, race) {
					race =  JSON.parse(race);

					if (race.playable) {
						world.races.push({
							name: race.name
						});
					}

					if (i === fileNames.length - 1) {
						return fn(world.races);
					}
				});
			});
		});
	}
};

World.prototype.getPlayableClasses = function(fn) {
	var world = this;

	if (world.classes.length !== 0) {
		return fn(world.classes);
	} else {
		fs.readdir('./classes', function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile('./classes/' + fileName, function (err, classObj) {
					classObj = JSON.parse(classObj);

					if (classObj.playable) {
						world.classObj.push({
							name: classObj.name
						});
					}

					if (i === fileNames.length - 1) {
						return fn(world.classes);
					}
				});
			});
		});
	}
};

World.prototype.getRace = function(raceName, fn) {
	fs.readFile('./races/' + raceName + '.json', function (err, race) {
		return fn(JSON.parse(race));
	});
};

World.prototype.getClass = function(className, fn) {
	fs.readFile('./classes/' + className + '.json', function (err, classObj) {
		return fn(JSON.parse(classObj));
	});
};

module.exports.world = new World();