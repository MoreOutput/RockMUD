'use strict';
Dice = require('../src/dice').roller,
World = require('../src/world').world;

/*
	The mayor walks aroud midgaard acting as a crier and greeting the masses.
	He puts down the northern gate every mornining at sunrise and closes up the city at midnight.
*/

var Mayor = function(mob) {
	this.mob = mob;
	this.foundKey = false;
	this.boundToArea = true;
	this.exclimations = [
		'What a beautiful city!', 
		'Welcome! Be sure to visit the world-famous Midgaardian shops!'
	];
	this.moveDirections = ['gate', 'north', 'east', 'west', 'south'];
};

// Fired as long as mob has > 0 hps
Mayor.prototype.onAlive = function() {
	var direction;

	if (!this.foundKey) {
		Cmd.fire('yell', this.mob, 'Is heading ' + direction, function() {
			Cmd.fire('move', this.mob, direction);
		});
	} else {
		// Start looking for the gate
	}
};

// Custom death behavior for Mob
Mayor.prototype.onDeath = function() {

};

// Custom Spawn behavior
Mayor.prototype.onSpawn = function() {

};
