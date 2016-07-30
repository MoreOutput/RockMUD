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
		'You can <strong>practice</strong> and learn new skills from Guildmasters along with <strong>training</strong> stats.',
	],
	currentlyEnrolled: [],
	onSay: function(player, roomObj, command) {
		if (player.isPlayer) {
			if (command.msg.toLowerCase().indexOf('yes') !== -1) {
				Cmd.say(this, {
					msg: 'Great! Let me get you signed up. Just a second...',
					roomObj: roomObj
				});				
			}
		}
	},
	onVisit: function(player, roomObj, command) {
		if (player.level === 1) {
			Cmd.say(this, {
				msg: 'Greetings ' + player.displayName + ' are you here to train at the '
					+ '<strong class="red">Midgaardian Academy</strong>?',
				roomObj: roomObj
			});
		}
	},
	onAlive: function(roomObj) {
		var roll = World.dice.roll(1, 10);

		if (roll === 10) {
			Cmd.say(this, {
				msg: this.exclimations[parseInt(Math.random() * ((this.exclimations.length)))]
			});
		}
	}
};
