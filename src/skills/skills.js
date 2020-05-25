'use strict';
var World = require('../world'),
Skill = function() {};

/*
* Passive Skills, typically called by name within commands
*/

// Return a mod for chance to block with shield
Skill.prototype.shieldBlock = function(skillObj, player, roomObj, shield) {
	var conMod = World.dice.getConMod(skillUser),
	skillOutput = this.createSkillProfile();

	if (skillObj.train >= 80 && World.dice.roll(1, 100) > (98 - conMod)) {
		skillObj.train += 1;

		World.msgPlayer(skillUser, {
			msg: '<strong>Your Shield Block abilities improve!</strong>',
			styleClass: 'green',
			noPrompt: true
		});
	}

	if (skillObj.train >= 20) {
		return 1 + Math.round(player.level / 8);
	} else {
		return 0;
	}
};

// Returns a modifier for number of attacks per round
Skill.prototype.secondAttack = function(skillObj, skillUser) {
	var intMod = World.dice.getIntMod(skillUser);

	if (skillObj.train >= 80 && World.dice.roll(1, 100) > (98 - intMod)) {
		skillObj.train += 1;

		World.msgPlayer(skillUser, {
			msg: '<strong>Your ability to Second Attack has improved!</strong>',
			styleClass: 'green',
			noPrompt: true
		});
	}

	if (skillObj.train >= 20) {
		return 1;
	} else {
		return 0;
	}
};

/*
* Non combat skills, typically checked by a game entity
*/
Skill.prototype.sneak = function(skillObj, player, roomObj, command) {
	var skillAff = World.getAffect(player, 'sneak'),
	affObj;

	if (!skillAff) {
		if (player.position === 'standing') {
			// run a check; chance of auto failure
			if (skillObj.train > 0 && World.dice.roll(1, 6) < 6) {
				affObj = {
					id: skillObj.id,
					affect: 'sneak',
					display: false,
					decay: World.dice.roll(1 + player.level/2, 10, (player.detection + player.knowledge/2) + skillObj.train/5)
				};

				World.addAffect(player, affObj);

				if (skillObj.wait) {
					player.wait += skillObj.wait;
				} else {
					player.wait += 1;
				}
			}
			// Players never know if they're successfully sneaking
			World.msgPlayer(player, {
				msg: 'You begin sneaking.'
			});
		} else {
			World.msgPlayer(player, {
				msg: 'You can\'t sneak in this position.'
			});
		}
	} else {
		// already sneaking
	}
};

/*
* Melee Skills, called by a game entity
*/
 
/*
* Can only work on standing opponents
* Chance of knocking the target down; chances increased with a shield
* If the target is already on the ground dex check to fall
* If the target is two sizes smaller do a dex check against missing, a critical fail causes the user to trip
* Attacker does .5 more damage per size difference in target
*
* Since this is a combat skill it must output a Skill Profile Object
*/
Skill.prototype.bash = function(skillObj, player, roomObj, command) {
	var opponent = World.combat.getBattleTargetByRefId(player.refId),
	weaponSlots,
	i = 0,
	strMod = World.dice.getStrMod(player),
	oppDexMod,
	shieldArr,
	shield,
	skillOutput = World.combat.createSkillProfile(player, skillObj),
	dmg,
	rollDamage = function(shield) {
		var dmg = 0;

		dmg = World.dice.roll(player.diceNum, player.diceSides + player.size.value, strMod + player.size.value) 
			* Math.round(player.level/2) + 1;

		if (player.mainStat === 'str') {
			dmg += World.dice.roll(1, 2 + player.level, strMod);
		}

		if (shield) {
			if (!shield.diceNum) {
				dmg += World.dice.roll(1, 1 + player.level);
			} else {
				dmg += World.dice.roll(shield.diceNum, shield.diceSides, strMod);
			}
		}

		return dmg;
	};

	if (skillObj.train > 5) {
		if (!opponent && command.arg && player.position === 'standing') {
			opponent = World.room.getMonster(roomObj, command);
		}

		skillOutput.winMsg = '<span class="red">You smash into ' + opponent.displayName + ' and they splatter into a thousand different pieces!</span>';

		if (opponent) { 
			shieldArr = World.character.getSlotsWithShields(player);

			if (shieldArr.length) {
				shield = shieldArr[0].item;
			}

			if (player.position === 'standing') {
				if (World.dice.roll(1, 100) <= skillObj.train) {
					dmg = rollDamage(shield);
	
					skillOutput.defenderMods.chp = -dmg;

					if (!shield) {
						skillOutput.msgToAttacker = 'You bash and charge at a ' + opponent.name + ' (' + dmg + ')';

						skillOutput.msgToDefender = 'A ' + player.displayName + ' bashes and charges at you!' + ' (' + dmg + ')';
					} else {
						skillOutput.msgToAttacker = 'You use a ' + shield.displayName + ' to bash and charge at a '
							+ opponent.name + ' (' + dmg + ')';

						skillOutput.msgToDefender = 'A ' + player.displayName + ' bashes and charges at you with a '
							+ shield.displayName + '! (' + dmg + ')';
					}

					if (player.mainStat === 'str') {
						skillOutput.attackerMods.wait += 3;
					} else {
						skillOutput.attackerMods.wait += 4;
					}

					skillOutput.defenderMods.wait += 4;

					World.combat.processSkill(player, opponent, skillOutput);
				} else {
					skillOutput.msgToAttacker = 'You lunge forward and miss your bash but manage to keep your footing!';

					if (World.dice.roll(1, 20, player.knowledge) >= (10 + player.level)) {
						skillOutput.attackerMods.wait += 3;
					} else {
						skillOutput.attackerMods.wait += 5;
					}

					World.combat.processSkill(player, opponent, skillOutput);
				}
			}
		} else {
			World.msgPlayer(player, {
				msg: 'Bash what?'
			});
		}
	} else {
		World.msgPlayer(player, {
			msg: 'You need to train more before using Bash.',
			styleClass: 'error'
		});
	}
};

Skill.prototype.backstab = function(skillObj, player, roomObj, command) {
	var opponent = World.room.getMonster(roomObj, command),
	weaponSlots,
	i = 0,
	dexMod = World.dice.getDexMod(player),
	damage;

	if (opponent && player.position === 'standing' && !opponent.fighting) {
		if (World.dice.roll(1, 100) <= skillObj.train) {
			// backstab!
			damage = World.dice.roll(1, 20 + dexMod, dexMod);

			if (World.dice.roll(1, 20 + player.level, dexMod) > (17 + player.level + 1)) {
				if (!player.sneaking) {
					damage = damage * 1.5;
				} else {
					damage = (damage * 2) + dexMod;
				}
			}

			if (player.mainStat === 'dex') {
				damage += World.dice.roll(1, 20 + player.level);
			}

			player.wait += 3;
			opponent.wait += 3;
		} else {
			// missed
			if (World.dice.roll(1, 20, player.knowledge) >= (10 + player.level)) {
				player.wait += 3;
			} else {
				player.wait += 6;
			}
		}
	}
};

module.exports = new Skill();
