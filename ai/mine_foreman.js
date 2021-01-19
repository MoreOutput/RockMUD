'use strict';
var towerQuestKey = 'mine_access';

module.exports = {
	exclimations: [
		'No one has ever reached the bottom.',
		'There is a lot of money to be made rummaging around down there.',
		'I\'ve been working this hole for over forty years.'
	],
	onGoldReceived: function(World, behavior, mob, roomObj, gold, player) {
		var quest =  World.character.getLog(player, towerQuestKey);

		if (quest) {
			if (!quest.data.permission && gold) {
				quest.data.permission = true;
				quest.completed = true;

				World.addCommand({
					cmd: 'say',
					msg: 'Very good ' + player.displayName  + '. Im sure you\'ll earn this back in no time. You can head in.'
						+ '<p class="quest-complete yellow">You completed the Quest! (+500 experience)</p>',
					roomObj: roomObj
				}, mob);

				World.character.addExp(player, 500); // TODO: character could level
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
	onSay: function(World, behavior, mob, roomObj, player, command) {
		var quest;

		if (player.isPlayer && command) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				if (command.msg.toLowerCase().indexOf('ye') !== -1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Thats great to hear ' + player.displayName
							+  ', but everyone has to pay the fee. <strong class="warning">Give me a gold coin and you can go in</strong>. I know Tom\'s'
							+ ' buying furs if you don\'t have it. <strong class="red">NEWBIE:</strong> You have accepted a Quest! To see a list of your open quests use the <strong>Quest</strong> command (<strong class="green">Alias: j</strong>).',
						roomObj: roomObj
					}, mob);

					World.character.addLog(player, towerQuestKey);
				}
			}
		}
	},
	onVisit: function(World, behavior, mob, roomObj, incomingRoomObj, player, command) {
		var quest;

		if (player.level <= 2) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				World.addCommand({
					cmd: 'say',
					msg: player.displayName + ', I had heard you arrived! <strong class="warning">Are you seeking access to the Mine</strong>?',
					roomObj: roomObj
				}, mob);
			}
		}
	},
	onAlive: function(World, behavior, mob, roomObj) {
		var roll = World.dice.roll(2, 50);

		if (roll > 95) {
			World.addCommand({
				cmd: 'say',
				msg: behavior.exclimations[parseInt(Math.random() * ((behavior.exclimations.length)))],
				roomObj: roomObj
			}, mob);
		}
	}
};
