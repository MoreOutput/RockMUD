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

Combat.prototype.processFight = function(attacker, defender, roomObj, skillProfile) {
	var combat = this,
	battle,
	i = 0;

	// setup the attackers position and fight requirements -- attaching opoonent and changing position
	if (!attacker.opponent) {
		attacker.opponent = defender;
	}

	// if a player is not currently fighting and is without an attached opponent we assume we can create a Battle Object
	// Battle Objects are put into the World battle queue and processed on a timer
	// the timer is defined in ticks.js and basically just hands the object over to the Combat.round() function
	battle = combat.createBattleObject(attacker, defender, roomObj);

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
			if (!defender.group[i].opponent) {
				battle.processFight(defender.group[i], attacker, roomObj);
			}
		}
	}

	battle.attackerSkill = skillProfile;

	// immediately go into the first round, this is the same function called on a timer found in ticks.js
	//World.combat.round([battle]);

	World.battles.push(battle);
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
		id: attacker.refId + defender.refId,
		mods: {}
	}
};

// if a round results in an opponents hp falling to zero, then combat is resolved.
// when that happens all Battle Objects containing the loser must be removed
Combat.prototype.round = function(battleObjArr, skillProfile) {
	var combat = this,
	i = 0,
	battleObj,
	attacker,
	defender,
	roomObj = battleObjArr[0].roomObj,
	preventPrompt = false,
	oppStatus,
	playerStatus,
	msgToAttacker = '',
	msgToDefender = '';

	for (i; i < battleObjArr.length; i += 1) {
		battleObj = battleObjArr[i];
		attacker = battleObjArr[i].attacker;
		defender = battleObjArr[i].defender;

		// If the two are in same room we can run the round -- further they both must have HPs
		// the functions will drop out if these requirements are not met so ending combat must be explictly handled elsewhere
		// generally this means mid-round -- within the checks found below
		if (combat.inPhyscialVicinity(attacker, defender) && attacker.chp && defender.chp) {
			if (battleObj.attackerSkill) {
				World.character.applyMods(defender, battleObj.attackerSkill.defenderMods);
				World.character.applyMods(attacker, battleObj.attackerSkill.attackerMods);

				msgToAttacker += battleObj.attackerSkill.msgToAttacker;
				msgToDefender += battleObj.attackerSkill.msgToDefender;
			}

			if (attacker.opponent.chp > 0) {
				combat.attack(attacker, attacker.opponent, roomObj, function(player, opponent, roomObj, attackerAttackString, oppDefString, attackerCanSee) {
					if (opponent.chp > 0) {
						// run defender skills
						if (battleObj.defenderSkill) {
							World.character.applyMods(attacker, battleObj.defenderSkill.defenderMods);
							World.character.applyMods(defender, battleObj.attackerSkill.attackerMods);

							msgToAttacker += battleObj.attackerSkill.msgToAttacker;
							msgToDefender += battleObj.attackerSkill.msgToDefender;
						}

						combat.attack(defender, attacker, roomObj, function(opponent, player, roomObj, oppAttackString, attackerDefString, oppCanSee) {
							msgToDefender += oppAttackString + oppDefString;

							msgToAttacker += attackerAttackString + attackerDefString;

							if (opponent.opponent.chp > 0) {
								oppStatus = World.character.getStatusReport(opponent);
								console.log('status', opponent.name, oppStatus);
								playerStatus = World.character.getStatusReport(player);

								if (player.isPlayer) {
									if (!World.config.viewHp) {
										msgToAttacker += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
										+ '</div>';
									} else {
										msgToAttacker += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
											+ ' (' + opponent.chp + '/' + opponent.hp +')</div>';
									}
								}

								if (opponent.isPlayer) {
									if (!World.config.viewHp) {
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
								
								if (opponent.wait) {
									opponent.wait -= 1;
								}

								if (player.wait) {
									player.wait -= 1;
								}

								if (i === battleObjArr.length - 1) {
									battleObj.round += 1;

									msgToAttacker =  '<div>***** Round ' + battleObj.round + '*****</div>' + msgToAttacker;

									console.log('SENDING');

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
								}
							} else {
								World.addCommand({
									cmd: 'alert',
									msg: msgToAttacker,
									noPrompt: true,
									styleClass: 'player-hit warning'
								}, player);

								World.addCommand({
									cmd: 'alert',
									msg: msgToDefender,
									noPrompt: true,
									styleClass: 'player-hit warning'
								}, opponent);

								console.log('test');

								combat.processEndOfCombat(battleObj);
							}
						});
					} else {
						console.log('DEATH BOAR');
						preventPrompt = true;

						msgToDefender = oppDefString;

						msgToAttacker = attackerAttackString;
						msgToAttacker += '<div class="rnd-status">You deliver a powerful <strong class="red">final blow to '
											+ opponent.short + '</strong>!</div>';

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

						combat.processEndOfCombat(battleObj);
					}
				});
			} else {
				preventPrompt = true;

				console.log('test 2')

				World.addCommand({
					cmd: 'alert',
					msg: msgToAttacker,
					noPrompt: preventPrompt,
					styleClass: 'player-hit warning'
				}, attacker);

				World.addCommand({
					cmd: 'alert',
					msg: msgToDefender,
					noPrompt: preventPrompt,
					styleClass: 'player-hit warning'
				}, defender);

				this.processEndOfCombat(battleObj, battleObj.attackerSkill);
			}
		} else if (defender) {
			console.log('test3');
			combat.processEndOfCombat(battleObj, skillProfile);
		}
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
	weapons,
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
	hitroll = World.character.getHitroll(attacker),
	damroll	= World.character.getDamroll(attacker),
	criticalAttackXP,
	criticalAttack = false,
	dodgeChance = World.dice.getDodgeChance(opponent, attacker),
	armorScore = World.dice.getRelativeArmorScore(opponent, attacker),
	attackerCanSee = World.character.canSee(attacker, roomObj),
	opponentCanSee = World.character.canSee(opponent, roomObj);

	if (attacker.opponent.refId === opponent.refId && attacker.chp && opponent.chp) {
		if (attacker.position === 'fighting') {
			weaponSlots = World.character.getWeaponSlots(attacker);

			if (opponent.position === 'fighting') {
				shieldSlots = World.character.getSlotsWithShields(opponent);

				if (shieldSlots.length) {
					shield = shieldSlots[0].item;
				}
			}

			i = 0;

			for (i; i < weaponSlots.length; i += 1) {
				if (weaponSlots[i].item) {
					weapon = World.character.getItemByRefId(attacker, weaponSlots[i].item);
				} else {
					weapon = World.character.getFist(attacker);
				}

				numOfAttacks = combat.getNumberOfAttacks(attacker, weapon, attackerMods, opponentMods);

				if (numOfAttacks) {
					j = 0;

					for (j; j < numOfAttacks; j += 1) {
						if (shield) {
							if (shieldBlockSkill) {
								chanceToDodge += World.skills.shieldBlock(shieldBlockSkill, defender);
							}

							armorScore += shieldAC;
						}

						if (opponent.vulnerableTo.length && opponent.vulnerableTo.toString().indexOf(weapon.attackType) !== -1) {
							damage += World.dice.roll(1, 4 + weapon.level);
						}

						if (opponent.resistantTo.length && opponent.resistantTo.toString().indexOf(weapon.attackType) !== -1) {
							damage -= World.dice.roll(1, 4 + weapon.level);
						}

						console.log(opponent.name + ' ac: ' + armorScore + ', ' + attacker.name + ' hitroll: ' + hitroll + ', damroll: ' + damroll);

						if (armorScore <= hitroll) {
							if (dodgeChance < World.dice.roll(1, 100)) {
								damage = World.dice.roll(1 +  weapon.diceMod, damroll + World.dice.roll(damage.diceNum, weapon.diceSides) + attackerMods.str) + 1;

								damage = World.dice.roll(1, damage);

								damage -= opponent.meleeRes;

								if (World.dice.roll(1, 100) > (99 - attacker.detection)) {
									criticalAttack = true;
									criticalAttackXP = World.dice.roll(1 + attacker.level, 20);

									attacker.exp += criticalAttackXP;

									damage = (damage * 2 + weapon.diceMod) + attacker.str;
								}

								if (damage <= 0) {
									damage = attackerMods.str;
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

						return fn(attacker, opponent, roomObj, msgForAttacker, msgForOpponent, attackerCanSee);
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

Combat.prototype.getNumberOfAttacks = function(attacker, weapon) {
	var numOfAttacks = 1,
	secondAttackSkill = World.character.getSkillById(attacker, 'secondAttack');

	if (weapon.modifiers && weapon.modifiers.numOfAttacks) {
		numOfAttacks += weapon.modifiers.numOfAttacks;
	}

	if (attacker.mainStat === 'dex' && World.dice.roll(1, 10) < 2) {
		numOfAttacks += 1;
	}

	if (numOfAttacks <= 1 && World.dice.roll(1, 3) === 1) {
		numOfAttacks += 1;
	}

	if (secondAttackSkill && numOfAttacks <= 1) {
		if (World.dice.roll(1, 100) > secondAttackSkill.train) {
			numOfAttacks = World.skills.secondAttack(secondAttackSkill, attacker);
		}
	}

	return numOfAttacks;
};

// Insert a skill profile into the relevant battle object so it can be applied in round()
Combat.prototype.processSkill = function(attacker, defender, skillProfile) {
	var battle = this.getBattleByRefIds(attacker.refId, defender.refId);

	if (battle) {
		if (attacker.refId === battle.attacker.refId) {
			battle.attackerSkill = skillProfile;
		} else {
			battle.defenderSkill = skillProfile;
		}
	} else {
		this.processFight(attacker, defender, World.getRoomObject(attacker.area, attacker.roomid), skillProfile);
	}
}

// Skills that fire in the Battle loop, that modify the opponent state, must output a Skill Profile Object
// This object ensures all modifiers and messages apply consistently
Combat.prototype.createSkillProfile = function(skillUser, skillObj, mods) {
	if (!mods) {
		mods = {};
	}
	
	if (!mods.attackerMods) {
		mods.attackerMods = {
			chp: 0,
			cmana: 0,
			cmv: 0,
			wait: 0
		};
	}

	if (!mods.defenderMods) {
		mods.defenderMods = {
			chp: 0,
			cmana: 0,
			cmv: 0,
			wait: 0
		};
	}

	return {
		refId: skillUser.refId,
		defenderMods: mods.attackerMods,
		attackerMods: mods.defenderMods,
		applyAttackerMods: true,
		applyDefenderMods: true,
		msgToAttacker: '',
		msgToDefender: '',
		msgToRoom: '',
		winMsg: '',
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
Combat.prototype.processEndOfCombat = function(battleObj, skillProfile) {
	var combat = this,
	winner,
	loser,
	roomObj = battleObj.roomObj,
	exp = 0,
	corpse,
	endOfCombatMsg = '',
	respawnRoom;

	// we need to move on to the next target if we're being attacked
	// if not the battle object should be removed
	combat.removeBattle(battleObj);

	if (battleObj.attacker.chp > 0) {
		winner = battleObj.attacker;
		loser = battleObj.defender;
	} else {
		winner = battleObj.defender;
		loser = battleObj.attacker;
	}

	loser.chp = 0; // cant go below zero hp

	winner.opponent = null;
	winner.position = 'standing';

	loser.killedBy = winner.name;
	loser.opponent = null;

	World.processEvents('onDeath', roomObj, loser, winner);
	World.processEvents('onDeath', loser, roomObj, winner);
	World.processEvents('onVictory', winner, roomObj, loser);

	corpse = World.character.createCorpse(loser);

	if (!loser.isPlayer) {
		World.room.removeMob(roomObj, loser);
	} else {
		respawnRoom = World.getRoomObject(loser.recall.area, loser.recall.roomid);

		World.room.removePlayer(roomObj, loser);

		loser.items = [];
		loser.position = 'standing';

		respawnRoom.playersInRoom.push(loser);

		loser.roomid = respawnRoom.id;
		loser.area = respawnRoom.area;
		loser.chp = 1;
		loser.cmana = 1;
		loser.cmv = 7;
		loser.exp = 0;

		World.addCommand({
			cmd: 'alert',
			msg: '<strong>You died! Make it back to your corpse before it rots to get your gear!</strong>',
			styleClass: 'error'
		}, loser);

		World.character.save(loser);
	}

	exp = World.dice.calExp(winner, loser);

	World.room.addItem(roomObj, corpse);

	if (skillProfile && skillProfile.winMsg) {
		endOfCombatMsg = skillProfile.winMsg + ' ';
	}

	if (exp > 0) {
		winner.exp += exp;

		if (World.dice.roll(1, 2) === 1) {
			endOfCombatMsg += 'You won the fight! You gain <strong>'
				+ exp + ' experience points!</strong>.';
		} else {
			endOfCombatMsg += '<strong>You are victorious! You earn <span class="red">'
				+ exp + '</span> experience points!';
		}
	} else {
		if (World.dice.roll(1, 2) === 1) {
			endOfCombatMsg += 'You won but learned nothing.';
		} else {
			endOfCombatMsg += 'You did not learn anything from the fight.';
		}
	}

	if (loser.gold) {
		winner.gold += loser.gold;

		endOfCombatMsg += ' <span class="yellow">You find ' + loser.gold
			+ ' ' + World.config.coinage  + ' on the corpse.</span>';
	}

	winner.killed += 1;

	if (winner.exp >= winner.expToLevel) {
		World.addCommand({
			cmd: 'alert',
			msg: endOfCombatMsg,
			styleClass: 'victory'
		}, winner);

		World.character.level(winner);
	} else {
		console.log("********ADDING**************");
		World.addCommand({
			cmd: 'alert',
			msg: endOfCombatMsg,
			styleClass: 'victory'
		}, winner);

		World.character.save(winner);
	}
};

Combat.prototype.getBattleByRefIds = function(attackerRefId, defenderRefId) {
	var i = 0,
	results = [];

	for (i; i < World.battles.length; i += 1) {
		if (World.battles[i].attacker.refId === attackerRefId && World.battles[i].defender.refId === defenderRefId) {
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
