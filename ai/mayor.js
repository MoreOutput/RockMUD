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
		'Welcome! Be sure to visit our world-famous Midgaardian shops!',
		'I lock up the city each evening. Get your affairs in order before nightfall.',
		'Each day before sunrise I lower the bridge and open the city.'
	],
	moveDirections: ['north', 'east', 'west', 'south'],
	wanderCheck: 3,
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 40);

		if (mob.position === 'standing') {
			if (roll === 5) {
				Cmd.emote(mob, {
					msg: 'stares <span class="grey">skyward</span> in thought.',
					roomObj: roomObj
				});
			} else if (roll === 1 && roomObj.playersInRoom.length) {
				// Most of the time we just proclaim something
				Cmd.say(mob, {
					msg: mob.exclimations[parseInt(Math.random() * ((this.exclimations.length)))],
					roomObj: roomObj
				});
			}
		}
	}
};
