'use strict';
var World = require('../src/world'),
towerQuestKey = 'mine_access';

module.exports = {
	exclimations: [
		'No one has ever reached the bottom.',
		'Theres a lot of money to be made rummaging around down there.',
		'I\'ve been working this hole for over forty years.'
	],
	onGoldReceived: function(mob, roomObj, gold, player) {
		var quest =  World.character.getLog(player, towerQuestKey);
		
		if (quest) {
			if (!quest.data.permission && gold) {
				quest.data.permission = true;
				quest.completed = true;

				World.addCommand({
					cmd: 'say',
					msg: 'Very nice ' + player.displayName  + '. Im sure you\'ll earn this back in no time. You can head in.'
						+ '<p class="quest-complete yellow">You completed the Quest! You earn 500 experience.</p>',
					roomObj: roomObj
				}, mob);
			}
		} else {
			World.character.addLog(player, towerQuestKey);

			quest = World.character.getLog(player, towerQuestKey);
			
			quest.completed = true;
			quest.data.permission = true;

			World.addCommand({
				cmd: 'say',
				msg: 'Your fee is paid. You may enter the mine.',
				roomObj: roomObj
			}, mob);
		}
	},
	onSay: function(mob, roomObj, player, command) {
		var quest;

		if (player.isPlayer && command) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				if (command.msg.toLowerCase().indexOf('ye') !== -1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Thats great to hear ' + player.displayName
							+  ', but everyone has to pay the fee. Give me a gold coin and you can go in.',
						roomObj: roomObj
					}, mob);

					World.character.addLog(player, towerQuestKey);
				}
			}
		}
	},
	onVisit: function(mob, roomObj, incomingRoomObj, player, command) {
		var quest;


		console.log(incomingRoomObj)

		if (player.level <= 2) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				World.addCommand({
					cmd: 'say',
					msg: player.displayName + ', we were told you were coming. Are you seeking access to <strong class="red">the Mine</strong>?',
					roomObj: roomObj
				}, mob);
			} else if (!quest.data.permission) {
				if (World.dice.roll(1, 2) === 1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Can\'t find any gold ' + player.displayName  + '?',
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
