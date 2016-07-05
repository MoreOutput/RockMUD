'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
WanderAI = require('../ai/wander'),
World = require('../src/world').world;

/*
	The mayor walks aroud midgaard acting as a crier and greeting the masses.
	He puts down the northern gate every mornining and closes up the city at midnight.
*/
module.exports = { 
	exclimations: [
		'What a beautiful city.',
		'Welcome! Be sure to visit our world-famous Midgaardian shops!',
		'I lock up the city each evening, be sure to get your affairs in order before nightfall.',
		'Each day before sunrise I lower the bridge and open the city.'
	],
	moveDirections: ['north', 'east', 'west', 'south'],
	onAlive: function(roomObj, mayor) {
		var roll = World.dice.roll(1, 10);

		if (roll === 5) {
			Cmd.emote(mayor, {
				msg: 'Rufus checks his time piece and stares skyward in thought.'
			});
		}

		if (roll <= 3) {
			// Most of the time we just proclaim something
			Cmd.say(mayor, {
				msg: mayor.exclimations[parseInt(Math.random() * ((mayor.exclimations.length)))]
			});
		} else {
			WanderAI.onAlive(roomObj, mayor);
		}
	}
};
