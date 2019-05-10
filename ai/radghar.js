'use strict';
var World = require('../src/world'),
towerQuestKey = 'tower_access',
isElkAntler = function(item) {
	if (item.area === 'the_great_valley' && item.id === '100') {
		return true;
	}

	return false;
};

/*
	Fighter Guildmaster and Midgaard Academy guide.
*/
module.exports = {
	exclimations: [
		'No one has ever reached the top of The Tower.',
		'Theres a lot of money to be made rummaging around in the Tower. If you make it out.'
	],
	onNewItem: function(mob, roomObj, item, player) {
		var quest =  World.character.getLog(player, towerQuestKey),

		if (!quest.data.permission && isElkAntler(item)) {
			quest.data.permission = true;

			World.addCommand({
				cmd: 'say',
				msg: 'Very nice ' + player.displayName  + ' you have surprised me. You may climb the tower.',
				roomObj: roomObj
			}, mob);

			if (!climbSkill) {
				climbSkill = World.character.getSkill(mob, 'climb');

				World.character.addSkill(player, climbSkill);

				World.msgPlayer(player, {
					msg: '<strong>You obtain a new skill from ' + mob.displayName + ': <span class="yellow">Improved Climbing</span></strong>. Improved Climbling increases the chance'
						+ ' of a successful climb. Type <span class="warning">HELP SKILLS</span> to learn more about using and acquiring skills.'
						+ '<span class="warning">Each class begins with a set of skills but skills can also be obtained through questing.</span>.'
				});
			}
		}
	},
	onSay: function(mob, roomObj, player, command) {
		var quest,
		climbSkill;

		if (player.isPlayer && command) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				if (command.msg.toLowerCase().indexOf('yes') !== -1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Thats great to hear ' + player.displayName
							+  ', but everyone has to pay the fee. Give me some ivory and you can climb. If you can\'t try hunting for some Elf antlers of camp.',
						roomObj: roomObj
					}, mob);

					World.character.addLog(player, towerQuestKey);

					climbSkill = World.character.getSkill(player, 'climb');
				}
			} else if (!quest.data.permission) {
				World.addCommand({
					cmd: 'say',
					msg: 'If you want in, give me some ivory.',
					roomObj: roomObj
				}, mob);
			}
		}
	},
	onVisit: function(mob, roomObj, incomingRoomObj, player, command) {
		var quest;

		if (player.level <= 2) {
			quest = World.character.getLog(player, towerQuestKey);

			if (!quest) {
				World.addCommand({
					cmd: 'say',
					msg: player.displayName + ' are you here to climb the '
						+ '<strong class="red">The Tower</strong>?',
					roomObj: roomObj
				}, mob);
			} else if (!quest.data.permission) {
				if (World.dice.roll(1, 2) === 1) {
					World.addCommand({
						cmd: 'say',
						msg: 'Can\'t find any ivory ' + player.displayName  + '?',
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
