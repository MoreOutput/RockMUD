'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	Fighter Guildmaster and Midgaard Academy guide. 
*/
module.exports = {
	exclimations: [
		'The Midgaardian Academy isn\'t much but its better than venturing out with no experience.',
		'I am the acting Fighter Guildmaster. You can find other Guildmasters in town.',
		'You can <strong>practice</strong> and learn new skills from Guildmasters and Trainers along with <strong>train</strong>ing stats.'
	],
	currentlyTraining: '',
	currentStep: 0,
	onSay: function(mob, roomObj, player, command) {
		if (player.isPlayer && command) {
			if (command.msg.toLowerCase().indexOf('yes') !== -1) {
				Cmd.say(mob, {
					msg: 'Thats great to hear ' + player.displayName  +  '! Let me get you signed up. Just a second...',
					roomObj: roomObj
				});

				this.currentlyTraining = player.name;
				this.currentStep = 1;

				setTimeout(function() {
					Cmd.say(mob, {
						msg: 'Alright, move north from here and we\'ll get you some gear.',
						roomObj: roomObj
					});	
				}, 1000);
			}
		}
	},
	onVisit: function(mob, roomObj, player, command) {
		if (player.level <= 2 && !this.currentlyTraining) {
			Cmd.say(mob, {
				msg: 'Greetings ' + player.displayName + ' are you here to train at the '
					+ '<strong class="red">Midgaardian Academy</strong>?',
				roomObj: roomObj
			});
		}
	},
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 60);
		
		if (!this.currentlyTraining && roll === 10) {
			Cmd.say(mob, {
				msg: mob.exclimations[parseInt(Math.random() * ((mob.exclimations.length)))],
				roomObj: roomObj
			});
		}
	}
};
