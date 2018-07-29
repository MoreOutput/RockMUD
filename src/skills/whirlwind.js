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
		var oppDexMod = World.dice.getDexMod(opponent);

		if (opponent.mainStat && opponent.mainStat === 'dex' || World.dice.roll(1, 20) <= 2) {
			return World.dice.roll(player.diceNum + 1, player.diceSides + player.size.value, strMod + player.size.value)
				* (Math.round(player.level/2) + 1) - opponent.ac;
		} else {
			return World.dice.roll(player.diceNum + 1, player.diceSides + player.size.value, strMod + player.size.value)
				* (Math.round(player.level/2) + 1) - (opponent.ac + oppDexMod);
		}
	};

	if (roomObj.monsters.length) {
		if (player.position === 'standing' || player.position === 'fighting') {
			skillOutput = World.combat.createSkillProfile(player, skillObj);

			if (World.dice.roll(1, 100) <= skillObj.train) {
				for (i; i < roomObj.monsters.length; i += 1) {
					opponent = roomObj.monsters[i];

					damage = rollDamage(opponent)

					skillOutput = World.combat.createSkillProfile(player, skillObj);
					skillOutput.defenderMods.chp = -damage;
					skillOutput.winMsg = '<span class="red">Won with Whirlwind!</span>';
					skillOutput.msgToAttacker = 'You spin around the room slashing at everything! (' + damage + ')';
					skillOutput.msgToRoom = player.displayName + ' spins around the room slashing at everyone!';
					skillOutput.attackerMods.wait += 2;

					World.combat.processSkill(player, opponent, skillOutput);

					skillOutput = World.combat.createSkillProfile(player, skillObj);
				}
			} else {
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