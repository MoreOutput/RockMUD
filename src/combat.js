'use strict';
var World = require('./world'),
Combat = function() {
	this.adjective = [
		{value: ['weak', 'hardly any'], damage: 5},
		{value: 'some', damage: 10},
		{value: 'directed', damage: 15},
		{value: 'maiming', damage: 20},
		{value: 'great', damage: 40},
		{value: 'demolishing', damage: 50},
		{value: '<span class="green">~~***<strong class="red">DEVASTATING</strong>***~~</span>', damage: 60}
	];

	this.abstractNouns = ['intensity', 'force', 'strength', 'power', 'might', 'effort', 'energy'];
};

Combat.prototype.processFight = function(attacker, defender, roomObj) {
	var combat = this,
	battle,
	i = 0;

	// to initiate combat an Attcker must not already be engaged in combat, defenders can already be in combat
	if (!attacker.fighting && !attacker.opponent && attacker.position !== 'resting' && attacker.position !== 'sleeping') {
		// if a player is not currently fighting and is without an attached opponent we assume we can create a Battle Object
		// Battle Objects are put into the World battle queue and processed on a timer
		// the timer is defined in ticks.js and basically just hands the object over to the Combat.round() function
		battle = combat.createBattleObject(attacker, defender, roomObj);

		// setup the attackers position and fight requirements -- attaching opoonent and changing position
		attacker.opponent = defender;

		attacker.fighting = true;

		attacker.position = 'fighting';

		// this puts the attackers group into the fight by outlining new Battle Objects
		// note that they run through this same function and therefore they will not switch targets if they're currently
		// in the middle of a fight
		if (attacker.group.length) {
			battle.attackerInGroup = true;

			for (i; i < attacker.group.length; i += 1) {
				if (!attacker.group[i].opponent) {
					battle.processFight(attacker.group[i], defender, roomObj);
				}
			}
		}

		// setup the defenders position and fight requirements -- attaching opoonent and changing position
		if (!defender.opponent) {
			defender.opponent = attacker;

			defender.fighting = true;

			defender.position = 'fighting';
		}

		if (defender.group.length) {
			i = 0;

			battle.opponentInGroup = true;

			for (i; i < defender.group.length; i += 1) {
				battle.processFight(defender.group[i], attacker, roomObj);
			}
		}

		World.battles.push(battle);

		// immediately go into the first round, this is the same function called on a timer found in ticks.js
		World.combat.round(battle);
	}
};

Combat.prototype.createBattleObject = function(attacker, defender, roomObj) {
	return {
		attacker: attacker,
		defender: defender,
		attackerInGroup: false, // attacker was a member of a group when battle started
		opponentInGroup: false, // attacker was a member of a group when battle started
		round: 0,
		roomObj: roomObj,
		attackerSkill: false,
		defenderSkill: false,
		mods: {}
	}
};

// if a round results in an opponents hp falling to zero, then combat is resolved.
// when that happens all Battle Objects containing the loser must be removed
Combat.prototype.round = function(battleObj) {
	var combat = this,
	attacker = battleObj.attacker,
	defender = battleObj.defender,
	roomObj = battleObj.roomObj,
	preventPrompt = false,
	oppStatus,
	playerStatus,
	msgToAttacker = '',
	msgToDefender = '';

	// If the two are in same room we can run the round -- further they both must have HPs
	// the functions will drop out if these requirements are not met so ending combat must be explictly handled elsewhere
	// generally this means mid-round -- within the checks found below
	if (combat.inPhyscialVicinity(attacker, defender) && attacker.chp && defender.chp) {
		// When someone uses a combat skill it is attacked to the Battle Object.

		// First the attacker has their skills applied
		if (battleObj.attackerSkill) {
			//World.character.applyMods(defender, battleObj.attackerSkill.defenderMods);
			World.character.applyMods(attacker, battleObj.attackerSkill.attackerMods);

			if (defender.chp) {
				msgToAttacker = battleObj.attackerSkill.msgToAttacker;
				msgToDefender = battleObj.attackerSkill.msgToDefender;
			} else {
				msgToAttacker = battleObj.attackerSkill.msgToAttacker;
				msgToDefender = battleObj.attackerSkill.msgToDefender;
			}
		}
		
		if (attacker.opponent.chp > 0) {
			combat.attack(attacker, attacker.opponent, roomObj, function(player, opponent, roomObj, attackerAttackString, oppDefString, attackerCanSee) {
				// run defender skills
				if (battleObj.defenderSkill) {
					//World.character.applyMods(attacker, battleObj.defenderSkill.defenderMods);
					//World.character.applyMods(defender, battleObj.attackerSkill.attackerMods);

					if (defender.chp) {
						msgToAttacker = battleObj.defenderSkill.msgToAttacker;
						msgToDefender = battleObj.defenderSkill.msgToDefender;
					} else {
						msgToAttacker = battleObj.defenderSkill.msgToAttacker;
						msgToDefender = battleObj.defenderSkill.msgToDefender;
					}
				}

				combat.attack(opponent, opponent.opponent, roomObj, function(opponent, player, roomObj, oppAttackString, attackerDefString, oppCanSee) {
					oppStatus = World.character.getStatusReport(opponent);

					msgToDefender += oppAttackString + oppDefString;

					playerStatus= World.character.getStatusReport(player);

					msgToAttacker += attackerAttackString + attackerDefString;

					if (player.isPlayer) {
						if (opponent.chp > 0) {
							if (!player.settings.canViewHp) {
								msgToAttacker += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
								+ '</div>';
							} else {
								msgToAttacker += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
									+ ' (' + opponent.chp + '/' + opponent.hp +')</div>';
							}
						} else {
							msgToAttacker += '<div class="rnd-status">You deliver a powerful <strong class="red">final blow to '
								+ opponent.short + '</strong>!</div>';
						}
					}

					if (opponent.isPlayer) {
						if (!opponent.canViewHp) {
							msgToDefender += '<div class="rnd-status">' + opponent.capitalShort + playerStatus.msg
								+ '</div>';
						} else {
							msgToDefender += '<div class="rnd-status">' + player.capitalShort + playerStatus.msg
								+ ' (' + player.chp + '/' + player.hp +')</div>';
						}
					}

					if (opponent.chp <= 0 || player.chp <= 0) {
						preventPrompt = true;
					}

					battleObj.attackerSkill = false;
					battleObj.defenderSkill = false;

					World.addCommand({
						cmd: 'alert',
						msg: msgToAttacker,
						noPrompt: preventPrompt,
						styleClass: 'player-hit warning'
					}, player);

					World.addCommand({
						cmd: 'alert',
						msg: msgToDefender,
						noPrompt: preventPrompt,
						styleClass: 'player-hit warning'
					}, opponent);

					if (player.position !== 'fighting' || opponent.position !== 'fighting') {	
						if (player.postion === 'fighting' && player.opponent.name === opponent.name) {
							player.position = 'standing';
						}

						if (opponent.postion === 'fighting' && opponent.opponent.name === player.name) {
							opponent.position = 'standing';
						}
					} else {
						if (opponent.chp <= 0) {
							//combat.processEndOfCombat(player, opponent, roomObj);
						} else if (player.chp <= 0) {
							//combat.processEndOfCombat(opponent, player, roomObj);
						} else {
							World.prompt(player);
							World.prompt(opponent);
						}
					}
				});
			});
		} else {
			// this.processEndOfCombat(attacker, defender, roomObj)
		}
	} else if (defender) {
		// this.processEndOfCombat(attacker, defender, roomObj);
	}
};

Combat.prototype.inPhyscialVicinity = function(attacker, defender) {
	if (attacker && defender && attacker.area === defender.area && attacker.roomid === defender.roomid) {
		return true;
	} else {
		return false;
	}
}

Combat.prototype.attack = function(attacker, opponent, roomObj, fn) {
	var combat = this,
	weaponSlots,
	shieldSlots,
	attackerMods = World.dice.getMods(attacker),
	opponentMods = World.dice.getMods(opponent),
	numOfAttacks,
	shieldBlockSkill = World.character.getSkillById(opponent, 'shieldBlock'),
	i = 0,
	j = 0,
	msgForAttacker = '',
	msgForOpponent = '',
	roomRoundTxt = '',
	damage = 0,
	dodged = false,
	blocked = false,
	adjective,
	abstractNoun,
	weapon,
	shield,
	shieldAC = 0,
	hitRoll = World.dice.roll(attacker.diceNum, attacker.diceSides, attacker.hitRoll + attackerMods.dex + World.dice.roll(1, 10)),
	damRoll	= World.dice.roll(attacker.diceNum, attacker.diceSides, attacker.damRoll + attackerMods.str + attacker.level),
	criticalAttackXP,
	criticalAttack = false,
	dodgeCheck = World.dice.roll(opponent.diceNum, opponent.diceSides, opponentMods.dex + opponent.detection + opponent.awareness/2 + (attacker.size.value - opponent.size.value)),
	acCheck = World.dice.roll(opponent.diceNum, opponent.diceSides, opponent.ac + opponentMods.dex + opponent.level) + World.dice.roll(1, 10),
	attackerCanSee = World.character.canSee(attacker, roomObj),
	opponentCanSee = World.character.canSee(opponent, roomObj);

	if (attacker.chp && opponent.chp) {
		if (hitRoll < 0) {
			hitRoll = attacker.level;
		}

		if (damRoll < 0) {
			damRoll = attacker.level;
		}

		if (attacker.position === 'fighting') {
			weaponSlots = World.character.getWeaponSlots(attacker);

			if (opponent.position === 'fighting') {
				shieldSlots = World.character.getSlotsWithShields(opponent);

				if (shieldSlots.length > 0) {
					shield = shieldSlots[0].item;
				}
			}

			// the weapon that is selected is random, an unshielded attacker does get the benefits of dual wielding
			for (i; i < weaponSlots.length; i += 1) {
				if (weaponSlots[i].item) {
					weapon = World.character.getItemByRefId(attacker, weaponSlots[i].item);

					break;
				}
			}

			// if no weapon was found we use a generated fist object
			if (!weapon) {
				weapon = World.character.getFist(attacker);
			}

			i = 0;

			for (i; i < weaponSlots.length; i += 1) {
				numOfAttacks = combat.getNumberOfAttacks(attacker, weapon, attackerMods, opponentMods);

				if (numOfAttacks) {
					j = 0;

					for (j; j < numOfAttacks; j += 1) {
						if (shield) {
							if (shieldBlockSkill) {
								acCheck += World.dice.roll(1, attacker.level);
							}

							acCheck += shieldAC;
						}

						if (opponent.vulnerableTo.length && opponent.vulnerableTo.toString().indexOf(weapon.attackType) !== -1) {
							damage += World.dice.roll(1, 4 + weapon.level);
						}

						if (opponent.resistantTo.length && opponent.resistantTo.toString().indexOf(weapon.attackType) !== -1) {
							damage -= World.dice.roll(1, 4 + weapon.level);
						}

						if (acCheck < hitRoll) {
							if (dodgeCheck < hitRoll) {
								damage = World.dice.roll(weapon.diceNum, weapon.diceSides, attacker.damRoll + weapon.diceMod + attackerMods.str);

								damage += (attacker.level/2) + (attackerMods.str/4);

								if (attackerMods.str >= opponentMods.con) {
									damage += damRoll/3;
								}

								damage -= opponent.ac/2;
								damage -= opponent.meleeRes;

								if (numOfAttacks > 3 && j > 3) {
									damage = damage/2;
								}

								if (World.dice.roll(1, 200) >= (200 - attacker.detection)) {
									criticalAttack = true;
									criticalAttackXP = World.dice.roll(1 + attacker.level, 20);

									attacker.exp += criticalAttackXP;

									damage = (damage * 3) + attacker.str;
								}

								if (damage < 0) {
									damage = attackerMods.str;
								} else {
									damage = Math.round(damage);
								}

								adjective = combat.getDamageAdjective(damage);

								abstractNoun = combat.abstractNouns[World.dice.roll(1, combat.abstractNouns.length) - 1];

								opponent.chp -= damage;

								if (attacker.isPlayer) {
									if (!criticalAttack) {
										if (attackerCanSee) {
											msgForAttacker += '<div>You ' + weapon.attackType + ' ' + opponent.short
												+ ' with ' + adjective + ' ' + abstractNoun + ' <strong class="red">('
												+ damage + ')</strong></div>';
										} else {
											msgForAttacker += '<div>You ' + weapon.attackType + ' <strong>something</strong> '
												+ ' with ' + adjective + ' ' + abstractNoun + ' <strong class="red">('
												+ damage + ')</strong></div>';
										}
									} else {
										if (attackerCanSee) {
											msgForAttacker += '<div>You ' + weapon.attackType + ' ' + opponent.short
												+ ' with ' + adjective + ' ' + abstractNoun + ' <strong class="red">('
												+ damage + ')</strong></div>'
												+ '<div class="green">You landed a critical hit and gain '
												+ criticalAttackXP + ' experience.</div>';
										} else {
											msgForAttacker += '<div>You ' + weapon.attackType
												+ ' someone with ' + adjective + ' ' + abstractNoun + ' <strong class="red">('
												+ damage + ')</strong></div>'
												+ '<div class="green">You landed a critical hit and gain '
												+ criticalAttackXP + ' experience.</div>';
										}

										if (attacker.onExp) {
											attacker.onExp(criticalAttackXP);
										}
									}
								}

								if (opponent.isPlayer) {
									if (!criticalAttack) {
										if (attackerCanSee) {
											msgForOpponent += '<div class="grey">' + attacker.possessivePronoun + ' '
												+ weapon.attackType + ' hits you with ' + adjective + ' ' + abstractNoun
												+ ' <span class="red">(' + damage + ')</span></div>';
										} else {
											msgForOpponent += '<div class="grey">Someones ' + weapon.attackType 
												+ ' hits you with ' + adjective + ' ' + abstractNoun
												+ ' <span class="red">(' + damage + ')</span></div>';
										}
									} else {
										if (attackerCanSee) {
											msgForOpponent += '<div class="grey"><strong>' + attacker.possessivePronoun + ' '
												+ weapon.attackType + ' hits you with ' + adjective + ' ' + abstractNoun
												+ '</strong> <span class="red">(' + damage + ')</span></div>';
										} else {
											msgForOpponent += '<div class="grey"><strong>Someones ' + weapon.attackType 
												+ ' hits you with ' + adjective + ' ' + abstractNoun
												+ '</strong> <span class="red">(' + damage + ')</span></div>';
										}
									}
								}
							} else {
								if (attacker.isPlayer) {
									if (World.dice.roll(1, 2) === 1) {
										msgForAttacker += '<div class="red">You lunge at '
											+ opponent.short + ' and miss!</div>';
									} else {
										msgForAttacker += '<div class="red">You swing at '
											+ opponent.short + ' with <strong>' + weapon.short + '</strong> and miss!</div>';
									}
								}

								if (opponent.isPlayer) {
									if (World.dice.roll(1, 2) === 1) {
										msgForAttacker += '<div class="green">' + attacker.capitalShort
											+ ' tries to attack but you dodge at the last minute!</div>';
									} else {
										msgForAttacker += '<div class="green">' + attacker.capitalShort
											+ ' lunges and you with ' + weapon.short +  ' and misses!</div>';
									}
								}
							}
						} else {
							if (attacker.isPlayer) {
								if (!shield) {
									if (World.dice.roll(1, 2) === 1) {
										msgForAttacker += '<div class="red">You try to attack ' + opponent.short
											+ ' and they block your attack!</div>';
									} else {
										msgForAttacker += '<div class="red">You try to attack ' + opponent.short
											+ ' with ' + weapon.short + ' but they narrowly avoid the attack!</div>';
									}
								} else {
									if (World.dice.roll(1, 2) === 1) {
										msgForAttacker += '<div class="red">You try to attack ' + opponent.short
											+ ' and they block the incoming attack with ' + shield.short + '!</div>';
									} else {
										msgForAttacker += '<div class="red">You swing at ' + opponent.short
											+ ' but they use their ' + shield.displayName + ' to defend against the attack!</div>';
									}
								}
							}

							if (opponent.isPlayer) {
								if (!shield) {
									msgForOpponent += '<div class="green">' + attacker.capitalShort +
									' swings wildy and you narrowly block their attack!</div>';
								}
							}
						}
					}
				} else {
					if (attacker.isPlayer) {
						msgForAttacker +=  '<div class="grey">Your ' + weapon.attackType + ' misses a '
							+ opponent.displayName + '</div>';
					}

					if (opponent.isPlayer) {
						msgForOpponent +=  '<div class="grey">' + attacker.displayName + ' tries to '
							+ weapon.attackType + ' you and misses! </div>';
					}
				}

				return fn(attacker, opponent, roomObj, msgForAttacker, msgForOpponent, attackerCanSee);
			}
		}
	} else {
		return fn(attacker, opponent, roomObj, msgForAttacker, msgForOpponent, attackerCanSee);
	}
};

Combat.prototype.getNumberOfAttacks = function(attacker, weapon, attackerMods, opponentMods) {
	var numOfAttacks = 0,
	secondAttackSkill = World.character.getSkillById(attacker, 'secondAttack');

	if (secondAttackSkill && World.dice.roll(1, 100) >= secondAttackSkill.train) {
		secondAttackSkill === false;
	}

	if (weapon.modifiers && weapon.modifiers.numOfAttacks) {
		numOfAttacks += weapon.modifiers.numOfAttacks;
	}

	if (attacker.knowledge > opponentMods.str && World.dice.roll(1, 2) === 1) {
		numOfAttacks += 1;
	}

	if (numOfAttacks <= 1 && attackerMods.dex > opponentMods.dex) {
		if (World.dice.roll(1, 2) === 2) {
			numOfAttacks += 1;
		}
	}

	if (numOfAttacks === 0 && World.dice.roll(1, 2) === 1) {
		numOfAttacks = 1;
	}

	if (secondAttackSkill && numOfAttacks === 1) {
		numOfAttacks = 2;
	} else if (secondAttackSkill && World.dice.roll(1, 4) === 1) {
		numOfAttacks += 1;
	}

	if (numOfAttacks === 0 && World.dice.roll(1, 6) === 1) {
		numOfAttacks = 1;
	}

	if (World.dice.roll(1, 4) > 2) {
		numOfAttacks += Math.round(attacker.hitRoll/10) + attackerMods.dex;
	}

	return numOfAttacks;
};

// Insert a skill profile into the relevant battle object so it can be applied in round()
Combat.prototype.processSkill = function(attacker, skillProfile) {
	var battle = this.getBattleByRefId(attacker.refId);

	if (attacker.refId === battle.attacker.refId) {
		battle.attackerSkill = skillProfile;
	} else if (attacker.refId === battle.defender.refId) {
		battle.defenderSkill = skillProfile;
	}
}

Combat.prototype.createSkillProfile = function(skillUser, skillObj, modifiers) {
	if (!modifiers) {
		modifiers = {
			chp: 0,
			cmana: 0,
			cmv: 0,
			wait: 0
		};
	}

	return {
		refId: skillUser,
		defenderMods: modifiers,
		attackerMods: modifiers,
		msgToAttacker: '',
		msgToDefender: '',
		msgToRoom: '',
		skillObj: skillObj
	}
}

Combat.prototype.getDamageAdjective = function(damage) {
	var i = 0,
	value,
	damLevel = damage / this.adjective[i].damage * 100;

	for (i; i < this.adjective.length; i += 1) {
		if (this.adjective[i].damage >= damage) {
			if (!Array.isArray(this.adjective[i].value)) {
				value = this.adjective[i].value;
			} else {
				value = this.adjective[i].value[World.dice.roll(1, this.adjective[i].value.length) - 1];
			}

			if (damage > 10) {
				if (damLevel === 100) {
					return '**' + value.toUpperCase() + '**';
				} else if (damLevel >= 80) {
					return value.toUpperCase();
				} else {
					return value;
				}
			} else {
				return value;
			}
		}
	}

	return this.adjective[1].value;
};

// TODO: ending combat message needs to be sent to all attacking players along with removing their Battle Objects
Combat.prototype.processEndOfCombat = function(battleObj) {
	var combat = this,
	exp = 0,
	corpse,
	endOfCombatMsg = '',
	respawnRoom;

	if (mob.chp <= 0) {
		// we need to move on to the next target if we're being attacked
		// if not the battle object should be removed
		combat.removeBattle(player, mob, roomObj);

		mob.opponent = null;
		mob.killedBy = player.name;

		player.opponent = null;
		player.position = 'standing';

		World.processEvents('onDeath', roomObj, mob, player);
		World.processEvents('onDeath', mob, roomObj, player);
		World.processEvents('onVictory', player, roomObj, mob);

		corpse = World.character.createCorpse(mob);

		if (!mob.isPlayer) {
			World.room.removeMob(roomObj, mob);
		} else {
			respawnRoom = World.getRoomObject(mob.recall.area, mob.recall.roomid);

			World.room.removePlayer(roomObj, mob);

			mob.items = [];
			mob.position = 'standing';

			respawnRoom.playersInRoom.push(mob);

			mob.roomid = respawnRoom.id;
			mob.area = respawnRoom.area;
			mob.chp = 1;
			mob.cmana = 1;
			mob.cmv = 7;

			World.addCommand({
				cmd: 'alert',
				msg: '<strong>You died! Make it back to your corpse before it rots to get your gear!</strong>',
				styleClass: 'error'
			}, mob);

			World.character.save(mob);
		}

		exp = World.dice.calExp(player, mob);

		World.room.addItem(roomObj, corpse);

		if (exp > 0) {
			player.exp += exp;

			if (World.dice.roll(1, 2) === 1) {
				endOfCombatMsg = 'You won the fight! You learn some things resulting in <strong>'
					+ exp + ' experience points</strong>.';
			} else {
				endOfCombatMsg = '<strong>You are victorious! You earn <span class="red">'
					+ exp + '</span> experience points!';
			}
		} else {
			if (World.dice.roll(1, 2) === 1) {
				endOfCombatMsg = 'You won but learned nothing.';
			} else {
				endOfCombatMsg = 'You did not learn anything from the fight.';
			}
		}

		if (mob.gold) {
			player.gold +- mob.gold;

			endOfCombatMsg += ' <span class="yellow">You find ' + mob.gold
				+ ' ' + World.config.coinage  + ' on the corpse.</span>';
		}

		player.killed += 1;

		if (player.exp >= player.expToLevel) {
			World.addCommand({
				cmd: 'alert',
				msg: endOfCombatMsg,
				noPrompt: true,
				styleClass: 'victory'
			}, player);

			World.character.level(player);
		} else {
			World.addCommand({
				cmd: 'alert',
				msg: endOfCombatMsg,
				styleClass: 'victory'
			}, player);

			World.character.save(player);
		}
	}
};

Combat.prototype.getBattleByRefId = function(refId) {
	var i = 0;

	for (i; i < World.battles.length; i += 1) {
		if (World.battles[i].attacker.refId === refId || World.battles[i].defender.refId === refId) {
			return World.battles[i];
		}
	}

	return false;
}

Combat.prototype.getBattlesByRefId = function(refId) {
	var i = 0,
	results = [];

	for (i; i < World.battles.length; i += 1) {
		if (World.battles[i].attacker.refId === refId || World.battles[i].defender.refId === refId) {
			results.push(World.battles[i]);
		}
	}

	return results;
}

Combat.prototype.removeBattle = function(battleObj) {
	var i = 0;

	for (i; i < World.battles.length; i += 1) {
		if (World.battles[i] === battleObj) {
			World.battles.splice(0, 1);
		}
	}
};

Combat.prototype.removeBattles = function(battleObjArr) {
	var i = 0;

	for (i; i < battleObjArr.length; i += 1) {
		this.removeBattle(battleObjArr[i]);
	}
};

module.exports = new Combat();
