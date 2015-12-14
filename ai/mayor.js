'use strict';
var Dice = require('../src/dice').roller,
Cmd = require('../src/commands').cmd,
World = require('../src/world').world;

/*
	The mayor walks aroud midgaard acting as a crier and greeting the masses.
	He puts down the northern gate every mornining at sunrise and closes up the city at midnight.
*/

module.exports = {
	// msg to the room
	exclimations: [
		'What a beautiful city.', 
		'Welcome! Be sure to visit our world-famous Midgardian shops!'
	],
	moveDirections: ['gate', 'north', 'east', 'west', 'south'],
	onAlive: function() {
		Cmd.fire('say', this, {
			msg: this.exclimations[1]
		}, function() {
			
		});
	}
}
