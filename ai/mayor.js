'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	The mayor walks aroud midgaard acting as a crier and greeting the masses.
	He puts down the northern gate every mornining and closes up the city at midnight.
*/

module.exports = {
	exclimations: [
		'What a beautiful city.',
		'Welcome! Be sure to visit our world-famous Midgardian shops!',
		'I lock up the city each evening, be sure to get your affairs in order before nightfall.',
		'Each day before sunrise I lower the bridge and open the city.'
	],
	moveDirections: ['gate', 'north', 'east', 'west', 'south'],
	onAlive: function(roll) {
		var mayor = this;

		World.dice.roll(1, 10, function(roll) {
			if (roll > 3) {
				// Most of the time we just proclaim something
				Cmd.fire('say', mayor, {
					msg: mayor.exclimations[parseInt(Math.random() * ((mayor.exclimations.length)))]
				});
			} else {
				// Sometimes we move to a new room
				Cmd.fire('move', mayor, {
					msg:  mayor.moveDirections[parseInt(Math.random() * ((mayor.moveDirections.length)))]
				});
			}
		});
	}
};
