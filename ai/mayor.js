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
		'I lock up the city each evening. Get your affairs in order before nightfall.',
		'Each day before sunrise I lower the bridge and open the city.'
	],
	moveDirections: ['north', 'east', 'west', 'south'],
	wanderCheck: 3,
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 20);

		if (roll === 5) {
			Cmd.emote(this, {
				msg: 'stares <span class="blue">skyward</span> in thought.'
			});
		}

		if (roll <= 6 && roomObj.playersInRoom.length) {
			// Most of the time we just proclaim something
			Cmd.say(this, {
				msg: this.exclimations[parseInt(Math.random() * ((this.exclimations.length)))]
			});
		} else {
			WanderAI.onAlive(this, roomObj);
		}
	}
};
