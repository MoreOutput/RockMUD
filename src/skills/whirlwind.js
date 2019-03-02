/*
* Melee area attack
* Has a chance to miss some targets, based on train
* Begins combat with all targets
* 
* Combat skills must output a Skill Profile Object
*/
'use strict'
var World = require('../world');

module.exports = function(skillObj, player, roomObj, command) {
	var weaponSlots,
	i = 0,
	strMod = World.dice.getStrMod(player),
	damage = 0,
	opponent,
	skillOutput,
	rollDamage = function(opponent) {
		return 20;
	};

	if (roomObj.monsters.length) {
		if (player.position === 'standing') {
			if (World.dice.roll(1, 100) <= skillObj.train) {
				for (i; i < roomObj.monsters.length; i += 1) {
					opponent = roomObj.monsters[i];

					skillOutput = World.combat.createSkillProfile(player, skillObj);

					damage = rollDamage(opponent)

					skillOutput = World.combat.createSkillProfile(player, skillObj);
					skillOutput.defenderMods.chp = -damage;
					skillOutput.winMsg = '<span class="red">Won with Whirlwind!</span>';
					skillOutput.msgToAttacker = 'You spin around the room slashing at everything and hitting ' + opponent.name +'! (' + damage + ')';
					skillOutput.msgToRoom = player.displayName + ' spins around the room slashing at everyone!';
					skillOutput.attackerMods.wait += 2;

					World.combat.processSkill(player, opponent, skillOutput);
				}
			} else {
				skillOutput = World.combat.createSkillProfile(player, skillObj);

				skillOutput.attackerMods.wait += 2;
				skillOutput.msgToAttacker = 'You begin to turn and stumble. Your whirlwind attempt fails!',

				World.combat.processSkill(player, opponent, skillOutput);
			}
		}
	} else {
		skillOutput.attackerMods.wait += 2;
		skillOutput.msgToAttacker = 'You spin around like an idiot. There is no one here.',

		World.combat.processSkill(player, opponent, skillOutput);
	}
};