'use strict';
var World = require('../src/world'),
wanderBehavior = require('./wander');

/*
	The mayor walks aroud midgaard acting as a crier and greeting the masses.
	He puts down the northern gate every mornining and closes up the city at midnight.
*/
module.exports = { 
	exclimations: [
		'Dont take more than you need from the camp, we don\'t know long it will be before we can resupply.',
		'Get your asses back into camp before nightfall!',
		'Foreman Stephenson tells me we\'re close to finding the way into the next level of the mine.',
		'The mine is just outside of camp to the South.',
		'If you need to trade in your finds talk to Thomas on the west side of camp.'
	],
	runOnAliveWhenEmpty: true,
	moveDirections: ['north', 'east', 'west', 'south'],
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 100);

		if (mob.position === 'standing' && !mob.fighting) {
			if (roll === 100) {
				World.addCommand({
					cmd: 'emote',
					msg: 'looks <span class="grey">skyward</span> in thought.',
					roomObj: roomObj
				}, mob);
			} else if (roll >= 97) {
				World.addCommand({
					cmd: 'say',
					msg: mob.exclimations[parseInt(Math.random() * ((this.exclimations.length)))],
					roomObj: roomObj
				}, mob);
			} else {
				wanderBehavior.onAlive(mob, roomObj);
			}
		}
	}
};
