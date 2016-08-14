'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
Combat = require('./combat').combat,
Skill = function() {};

/*
* Passive Skills, typically called by name within commands
*/

// Return a mod for AC rolls when the opponent has a shield"melee",

Skill.prototype.shieldBlock = function(skillObj, player, roomObj, shield) {
	if (World.dice.roll(1, 100) <= skillObj.train) {
		return World.dice.roll(1, skillObj.train/10, shield.ac + skillObj.mod);
	} else {
		return shield.ac;
	}
};

Skill.prototype.secondAttack = function(skillObj, player) {
	var intMod = World.dice.getIntMod(player);

	if (skillObj.train >= 80 && World.dice.roll(1, 100, intMod) > 95) {
		skillObj.train += 1;
	
		World.msgPlayer(player, {
			msg: '<strong>You skills with second attack improve!</strong>',
			styleClass: 'green',
			noPrompt: true
		});
	}

	if (World.dice.roll(1, 100) <= skillObj.train) {
		return 1 + skillObj.mod;
	} else { 
		return 0;
	}
};

/*
* Non combat skills, typically checked by a game entity
*/
Skill.prototype.sneak = function(skillObj, player, roomObj, command) {
	var skillAff = Character.getAffect(player, 'sneak'),
	affObj;

	if (!skillAff) {
		// run a check; chance of auto failure
		if (skillObj.train > 0 && World.dice.roll(1, 6) < 6) {
			affObj = {
				id: skillObj.id,
				display: skillObj.name,
				decay: World.dice.roll(1 + player.level/2, 10, (player.detection + player.knowledge/2) + skillObj.train/5),
				modifiers: null,
				begunSneaking: {area: roomObj.area, roomid: roomObj.id}
			};

			Character.addAffect(player, affObj);

			if (skillObj.wait) {
				player.wait += skillObj.wait;
			} else {
				player.wait += 1;
			}
		}
	} else {
		// already sneaking
	}
};

/*
* Melee Skills, called by a game entity
* Can only work on standing opponents
* Chance of knocking the target down; chances increased with a shield
* If the target is already on the ground dex check to fall
* If the target is two sizes smaller do a dex check against missing, a 1 causes the user to trip
* Smaller targets take more damage if the user is two sizes bigger
*/
Skill.prototype.bash = function(skillObj, player, roomObj, command) {
	var opponent,
	weaponSlots,
	i = 0,
	strMod = World.dice.getStrMod(player),
	oppDexMod,
	damage = 0,
	shieldArr,
	shield,
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

	if (!player.opponent && command.arg && player.position === 'standing') {
		opponent = Room.getMonster(roomObj, command);
	} else if (player.opponent && player.position === 'fighting') {
		opponent = player.opponent;
	}

	if (opponent) {
		shieldArr = Character.getSlotsWithShields(player);

		if (shieldArr.length) {
			shield = shieldArr[0].item;
		}

		if (player.position === 'standing' || player.position === 'fighting') {
			if (World.dice.roll(1, 100) <= skillObj.train) {
				damage = rollDamage(shield);

				if (!shield) {
					World.msgPlayer(player, {
						msg: 'You bash and charge at a ' + opponent.name + ' (' + damage + ')',
						noPrompt: true
					});

					World.msgPlayer(opponent, {
						msg: 'A ' + player.displayName + ' bashes and charges at you!',
						noPrompt: true
					});
				} else {
					World.msgPlayer(player, {
						msg: 'You use a ' + shield.displayName + ' to bash and charge at a ' 
							+ opponent.name + ' (' + damage + ')',
						noPrompt: true
					});

					World.msgPlayer(opponent, {
						msg: 'A ' + player.displayName + ' bashes and charges at you with a ' 
							+ shield.displayName + '!' + ' (' + damage + ')',
						noPrompt: true
					});
				}
			
				if (!player.opponent || player.opponent.refId !== opponent.refId) {
					Combat.processFight(player, opponent, roomObj);
				}

				if (player.mainStat === 'str') {
					player.wait += 3;
				} else {
					player.wait += 4;
				}

				opponent.wait += 3;
			} else {
				World.msgPlayer(player, {
					msg: 'You lunge forward and mistime your bash but manage to keep your footing!',
					noPrompt: true
				});

				Combat.processFight(player, opponent, roomObj);

				if (World.dice.roll(1, 20, player.knowledge) >= (10 + player.level)) {
					player.wait += 2;
				} else {
					player.wait += 3;
				}
			}
		}
	} else {
		World.msgPlayer(player, {
			msg: 'Bash what?'
		});
	}
};

Skill.prototype.whirlwind = function(skillObj, player, roomObj, command) {
	var weaponSlots,
	i = 0,
	strMod = World.dice.getStrMod(player),
	damage = 0,
	shieldArr,
	shield,
	opponent,
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
			if (World.dice.roll(1, 100) <= skillObj.train) {
				World.msgPlayer(player, {
					msg: 'You spin around the room slashing at everyone!',
					styleClass: 'green',
					noPrompt: true
				});

				World.msgRoom(roomObj, {
					msg: player.displayName + ' spins around the room slashing at everyone!',
					styleClass: 'red',
					playerName: player.name
				});

				player.cmv -= World.dice.roll(1, 12);

				for (i; i < roomObj.monsters.length; i += 1) {
					opponent = roomObj.monsters[i];

					damage = rollDamage(opponent);
			
					opponent.chp -= damage;					
					
					if (!player.opponent || opponent.refId !== player.opponent.refId) {
						Combat.processFight(player, opponent, roomObj);
					}
				}

				if (player.mainStat === 'str') {
					player.wait += 3;
				} else {
					player.wait += 4;
				}
			} else {
				World.msgPlayer(player, {
					msg: 'You begin to turn and stumble. Your whirlwind attempt fails!',
					styleClass: 'error',
					noPrompt: true
				});

				if (!player.opponent || opponent.refId !== player.opponent.refId) {
					Combat.processFight(player, opponent, roomObj);
				}

				if (playerMods.dexMod > 18 || skillObj.train === 100) {
					player.wait += 3;
				} else {
					player.wait += 4;
				}
			}
		}
	} else {
		World.msgPlayer(player, {
			msg: 'No one in the room!',
			styleClass: 'error'
		});
	}
};

Skill.prototype.backstab = function(skillObj, player, roomObj, command) {
	var opponent = Room.getMonster(roomObj, command),
	weaponSlots,
	i = 0,
	dexMod = World.dice.getDexMod(player), 
	damage;

	if (player.position === 'standing'
		&& (opponent.position !== 'fighting')) {
		if (World.dice.roll(1, 100) <= skillObj.train) {
			// backstab!
			damage = World.dice.roll(1, 20, dexMod);

			if (World.dice.roll(1, 20 + player.level, dexMod) > (17 + player.level + 1) ) {
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

			console.log('backstab hit!');
		} else {
			// missed
			if (World.dice.roll(1, 20, player.knowledge) >= (10 + player.level)) {
				player.wait += 3;
			} else {
				player.wait += 6;
			}

			console.log('backstab missed!');
		}
	}
};

module.exports.skills = new Skill();

