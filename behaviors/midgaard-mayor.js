'use strict';
Dice = require('../src/dice').roller,
World = require('../src/world').world;

var Mayor = function(mobObj) {
	mobObj.foundKey = false;
	this.references = [mobObj];
};

Mayor.prototype.foundKey = function() {
	
}

Mayor.prototype.exclaim = function() {
	//Cmds.yell()
}

Mayor.prototype.walk = function() {

}

// Main loop for the Mayor behavior. Fired when outlined in ticks.js
Mayor.prototype.live = function() {
	
};
