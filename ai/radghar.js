'use strict';
var World = require('../src/world');

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
			quest = World.character.getLog(player, 'mud_school');

			if (!quest) {
				if (command.msg.toLowerCase().indexOf('yes') !== -1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Thats great to hear ' + player.displayName  +  '! Let me get you signed up. Just a second...',
						roomObj: roomObj
					}, mob);

					World.character.addLog(player, 'mud_school', '0');

					climbSkill = World.character.getSkill(player, 'climb');

					setTimeout(function() {
						World.addCommand({
							cmd: 'say',
							msg: '"Alright, ' + player.name  + ', time for the enterance exam. You see this rope?'
								+ ' Climb up to the top floor of the Academy Tower. A solider will meet you there." <i class="grey">He points at a rope running up to a window in the tower above. ' 
								+ 'It is very high.</a> [<strong class="grey">Hint: Move up to continue</strong>]',
							roomObj: roomObj
						}, mob);

						if (!climbSkill) {
							climbSkill = world.character.getSkill(mob, 'climb');

							World.character.addSkill(player, climbSkill);

							World.msgPlayer(player, {
								msg: '<strong>You obtain a new skill from ' + mob.displayName + ': <span class="yellow">Improved Climbing</span></strong>. Improved Climbling increases the chance'
									+ ' of a successful climb, and reduces and falling damage.'
							});
						}
					}, 1200);
				}
			}
		}
	},
	onVisit: function(mob, roomObj, incomingRoomObj, player, command) {
		var quest;

		if (player.level <= 2) {
			quest = World.character.getLog(player, 'mud_school');

			if (!quest) {
				World.addCommand({
					cmd: 'say',
					msg: 'Greetings ' + player.displayName + ' are you here to train at the '
						+ '<strong class="red">Midgaardian Academy</strong>?',
					roomObj: roomObj
				}, mob);
			} else if (quest.entryId === '0') {
				if (World.dice.roll(1, 2) === 1) {
					World.addCommand({
						cmd: 'say',
						msg: 'You\'ve not climbed this damn rope yet ' + player.displayName  + '? I hope you\'re taking this seriously.',
						roomObj: roomObj
					}, mob);
				}
			}
		}
	},
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 200);

		if (roll === 1) {
			World.addCommand({
				cmd: 'say',
				msg: mob.exclimations[parseInt(Math.random() * ((mob.exclimations.length)))],
				roomObj: roomObj
			}, mob);
		}
	}
};
