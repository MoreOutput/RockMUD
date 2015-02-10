/*
	Typical behavior for a town mayor.
	
*/
Dice = require('../src/dice').roller,
World = require('../src/world').world,
MayorBehavior = require('../src/world').mayor;

var Mayor = function(mobObj, mayorOptions) {
	mobObj.keyID = mayorOptions.keyID;

	this.references = [mobObj];
};

Mayor.prototype.foundKey = function() {
	
}

Mayor.prototype.exclaim = function() {
	//Cmds.yell()
}

// Main loop for the Mayor behavior. Fired when outlined in ticks.js
Mayor.prototype.alive = function() {
	if (this.)
};	