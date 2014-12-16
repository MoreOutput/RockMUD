/*
* Working with game-wide data. Areas, Races, Classes and in-game Time
*/
'use strict';

var World = function() {

};

World.prototype.getRaces = function(fn) {
	if (typeof fn === 'function') {
		return fn(races);
	} else {
		return races;
	}
};

World.prototype.getClasses = function(fn) {
	if (typeof fn === 'function') {
		return fn(classes);
	} else {
		return classes;
	}
};

World.prototype.getRace = function(fn) {
	if (typeof fn === 'function') {
		return fn(races);
	} else {
		return races;
	}
};

World.prototype.getClass = function(fn) {
	if (typeof fn === 'function') {
		return fn(classes);
	} else {
		return classes;
	}
};


module.exports.world = new World();