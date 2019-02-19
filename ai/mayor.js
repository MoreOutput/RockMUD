'use strict';
var World = require('../src/world');

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
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 100);

		if (mob.position === 'standing' && !mob.fighting) {
			if (roll === 5) {
				World.addCommand({
					cmd: 'emote',
					msg: 'looks <span class="grey">skyward</span> in thought.',
					roomObj: roomObj
				}, mob);
			} else if (roll < 5) {
				World.addCommand({
					cmd: 'say',
					msg: mob.exclimations[parseInt(Math.random() * ((this.exclimations.length)))],
					roomObj: roomObj
				}, mob);
			}
		}
	}
};
