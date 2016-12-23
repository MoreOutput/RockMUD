'use strict';
var Cmd = require('../src/commands'),
Character = require('../src/character'),
Room = require('../src/rooms'),
World = require('../src/world');

/*
	Fighter Guildmaster and Midgaard Academy guide. 
*/
module.exports = {
	exclimations: [
		'The Midgaardian Academy isn\'t much but its better than venturing out with no experience.',
		'You can <strong>practice</strong> and learn new skills along with <strong>train</strong>ing stats.'
	],
	onSay: function(mob, roomObj, player, command) {
		var quest,
		climbSkill;

		if (player.isPlayer && command) {
			quest = Character.getLog(player, 'mud_school');

			if (!quest) {
				if (command.msg.toLowerCase().indexOf('yes') !== -1) {
					Cmd.say(mob, {
						msg: 'Thats great to hear ' + player.displayName  +  '! Let me get you signed up. Just a second...',
						roomObj: roomObj
					});

					Character.addLog(player, 'mud_school', '0');

					climbSkill = Character.getSkill(player, 'climb');

					setTimeout(function() {
						Cmd.say(mob, {
							msg: 'Alright, ' + player.name  + ', time for the enterance exam. You see this rope?'
								+ ' Climb up to the top floor of the Academy Tower. A solider will meet you there.',
							roomObj: roomObj
						});

						if (!climbSkill) {
							climbSkill = Character.getSkill(mob, 'climb');

							Character.addSkill(player, climbSkill);

							World.msgPlayer(player, {
								msg: '<strong>You obtain a new skill from ' + mob.displayName + ': <span class="yellow">Improved Climbing</span></strong>.',
								styleClass: 'success'
							});
						}
					
						Cmd.emote(mob, {
							msg: 'points at a rope running up to a window in the tower above. ' 
								+ 'It is very high. [<strong class="grey">Hint: Move up to continue</strong>]',
							roomObj: roomObj
						});
					}, 1200);
				}
			}
		}
	},
	onVisit: function(mob, roomObj, incomingRoomObj, player, command) {
		var quest;

		if (player.level <= 2) {
			quest = Character.getLog(player, 'mud_school');

			if (!quest) {
				Cmd.say(mob, {
					msg: 'Greetings ' + player.displayName + ' are you here to train at the '
						+ '<strong class="red">Midgaardian Academy</strong>?',
					roomObj: roomObj
				});
			} else if (quest.entryId === '0') {
				if (World.dice.roll(1, 2) === 1) {
					Cmd.say(mob, {
						msg: 'You\'ve not climbed this damn rope yet ' + player.displayName  + '? I hope you\'re taking this seriously.',
						roomObj: roomObj
					});
				}
			}
		}
	},
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 100);
		
		if (roll === 1) {
			Cmd.say(mob, {
				msg: mob.exclimations[parseInt(Math.random() * ((mob.exclimations.length)))],
				roomObj: roomObj
			});
		}
	}
};
