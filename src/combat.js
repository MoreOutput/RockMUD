'use strict';
var World = require('./world'),
Combat = function() {
	this.damage = [
		{value: ['nick'], damage: 1},
		{value: ['hurt'], damage: 3},
		{value: ['maim', 'harm'], damage: 5},
		{value: 'demolish', damage: 10},
		{value: 'DEMOLISH', damage: 11},
		{value: 'massacre', damage: 15},
		{value: 'MASSACRE', damage: 15},
		{value: 'devastate', damage: 20},
		{value: 'DEVASTATE', damage: 20},
		{value: 'ravage', damage: 30},
		{value: 'RAVAGE', damage: 40},
		{value: 'annihilate', damage: 50}
	];
};

Combat.prototype.processFight = function(attacker, defender, roomObj, skillProfile, battle) {
	var combat = this,
	battle,
	i = 0;

	if (!battle) {
		battle = combat.createBattleObject(attacker, defender, roomObj);
	}

	// if a player is not currently fighting and is without an attached opponent we assume we can create a Battle Object
	// Battle Objects are put into the World battle queue and processed on a timer
	// the timer is defined in ticks.js and basically just hands the object over to the Combat.round() function

	attacker.fighting = true;
	defender.fighting = true;

	if (skillProfile) {
		battle.skills[attacker.refId] = {};
		battle.skills[attacker.refId][defender.refId] = skillProfile;
	}

	// this puts the attackers group into the fight by outlining new Battle Objects
	// note that they run through this same function and therefore they will not switch targets if they're currently
	// in the middle of a fight
	if (attacker.group.length) {
		for (i; i < attacker.group.length; i += 1) {
			if (!attacker.group[i].fighting && attacker.group[i].position === 'standing' && attacker.group[i].chp > 0) {

			}
		}
	}

	if (defender.group.length) {
		i = 0;

		for (i; i < defender.group.length; i += 1) {
			if (!defender.group[i].fighting && defender.group[i].position === 'standing' && defender.group[i].chp > 0) {

			}
		}
	}

	World.battles.push(battle);
};

Combat.prototype.createBattleObject = function(attacker, defender, roomObj) {
	var battlePosition = this.createBattlePosition();
	battlePosition.attacker = attacker;
	battlePosition.defender = defender;

	return {
		round: 0,
		roomObj: roomObj,
		positions: {
			0: battlePosition
		},
		skills: {},
		attacked: [] // refid listing of entities in this battle who've attacked this round
	};
};

Combat.prototype.createBattlePosition = function() {
	return {
		attacker: null,
		defender: null
	};
}

Combat.prototype.getNextBattlePosition = function(battle) {
	return Object.keys(battle.positions).length;
}

// if a round results in an opponents hp falling to zero, then combat is resolved.
// when that happens all Battle Objects containing the loser must be removed
Combat.prototype.round = function(battle, skillProfile) {
	var combat = this,
	i = 0,
	cnt = 0,
	battleObj,
	attacker,
	defender,
	numOfPositions = combat.getNumberOfBattlePositions(battle),
	roomObj = battle.roomObj,
	preventPrompt = false,
	attackerName,
	defenderName,
	attackerSkill,
	defenderSkill,
	defenderStatus,
	attackerStatus,
	prop,
	msgToAttacker = '',
	msgToDefender = '';

	for (i; i < numOfPositions; i += 1) {
		battleObj = battle.positions[i];
		attacker = battleObj.attacker;
		defender = battleObj.defender;

		attackerName = combat.getCombatName(attacker);
		defenderName = combat.getCombatName(defender);

		// If the two are in same room we can run the round -- further they both must have HPs
		// the functions will drop out if these requirements are not met so ending combat must be explictly handled elsewhere
		// generally this means mid-round -- within the checks found below
		if (combat.inPhyscialVicinity(attacker, defender) && attacker.chp && defender.chp) {
			if (battle.skills[attacker.refId] && battle.attacked.indexOf(attacker.refId) === -1) {
				for (prop in battle.skills[attacker.refId]) {
					var attackerSkills = battle.skills[attacker.refId];

					for (prop in attackerSkills) {
						var skillTarget = combat.getBattleTargetByRefId(battle, prop);
						
						World.character.applyMods(skillTarget, attackerSkills[prop].defenderMods);

						if (attackerSkills[prop].attackerMods && cnt === 0) {
							World.character.applyMods(attacker, attackerSkills[prop].attackerMods);
						}

						msgToAttacker += '<div>' + attackerSkills[prop].msgToAttacker + '</div>';
						msgToDefender += '<div>' + attackerSkills[prop].msgToDefender + '</div>';

						cnt += 1
					}

					battle.skills[attacker.refId] = {};
				}
			}

			cnt = 0;

			if (defender.chp > 0) {
				combat.attack(attacker, defender, battle, function(attacker, defender, roomObj, attackerAttackString, defenderDefString, attackerCanSee) {
					if (defender.chp > 0) {
						// run defender skills
						if (battle.skills[defender.refId] && battle.attacked.indexOf(defender.refId) === -1) {
							for (prop in battle.skills[defender.refId]) {
								var defenderSkills = battle.skills[defender.refId];
			
								for (prop in defenderSkills) {
									var skillTarget = combat.getBattleTargetByRefId(battle, prop);
									
									World.character.applyMods(skillTarget, defenderSkills[prop].defenderMods);
			
									if (defenderSkills[prop].attackerMods && cnt === 0) {
										World.character.applyMods(defender, attackerSkills[prop].attackerMods);
									}
			
									msgToDefender += '<div>' + defenderSkills[prop].msgToAttacker + '</div>';
									msgToAttacker += '<div>' + defenderSkills[prop].msgToDefender + '</div>';
			
									cnt += 1
								}

								battle.skills[attacker.refId] = {};
							}
						}

						cnt = 0;

						combat.attack(defender, attacker, battle, function(defender, attacker, roomObj, defenderAttackString, attackerDefString, defenderCanSee) {
							msgToDefender += defenderAttackString + defenderDefString;

							msgToAttacker += attackerAttackString + attackerDefString;

							if (attacker.chp > 0) {
								defenderStatus = World.character.getStatusReport(defender);
								attackerStatus = World.character.getStatusReport(attacker);

								if (!World.config.viewHp) {
									msgToAttacker += '<div class="rnd-status">' + World.capitalizeFirstLetter(defenderName) + defenderStatus.msg
										+ '</div>';
								} else {
									msgToAttacker += '<div class="rnd-status">' + World.capitalizeFirstLetter(defenderName) + defenderStatus.msg
										+ ' (' + defender.chp + '/' + defender.hp +')</div>';
								}

								if (!World.config.viewHp) {
									msgToDefender += '<div class="rnd-status">' + World.capitalizeFirstLetter(attackerName) + attackerStatus.msg
										+ '</div>';
								} else {
									msgToDefender += '<div class="rnd-status">' +  World.capitalizeFirstLetter(attackerName) + attackerStatus.msg
										+ ' (' + attacker.chp + '/' + attacker.hp +')</div>';
								}

								if (defender.chp <= 0 || attacker.chp <= 0) {
									preventPrompt = true;
								}

								// wait state reductuon is once per round
								if (defender.wait && battle.attacked.indexOf(defender.refId) === -1) {
									defender.wait -= 1;
								}

								if (attacker.wait && battle.attacked.indexOf(attacker.refId) === -1) {
									attacker.wait -= 1;
								}

								battle.attacked.push(attacker.refId);
								battle.attacked.push(defender.refId);

								if (i === numOfPositions - 1) {
									battle.round += 1;

									battle.attacked = [];
									battle.skills = {};

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
								}
							} else {
								// ATTACKER HAS DIED
								World.addCommand({
									cmd: 'alert',
									msg: msgToAttacker,
									noPrompt: true,
									styleClass: 'player-hit warning'
								}, attacker);

								World.addCommand({
									cmd: 'alert',
									msg: msgToDefender,
									noPrompt: true,
									styleClass: 'player-hit warning'
								}, defender);

								battle.attacked = [];
								battle.skills = {};

								console.log('calling end', 4);

								combat.processEndOfCombat(battle, attacker, defender);
							}
						});
					} else {
						preventPrompt = true;

						msgToDefender = defenderDefString;

						msgToAttacker = attackerAttackString;

						if (World.dice.roll(1, 2) === 1) {
							msgToAttacker += '<div class="rnd-status">You deliver a powerful <strong class="red">final blow to '
								+ defenderName + '</strong>!</div>';
						} else {
							msgToAttacker += '<div class="rnd-status">' + World.capitalizeFirstLetter(defenderName) + ' dies from its wounds!</div>';
						}

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

						battle.attacked = [];
						battle.skills = {};

						console.log('calling end', 3);

						combat.processEndOfCombat(battle, attacker, defender);
					}
				});
			} else {
				preventPrompt = true;

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

				battle.attacked = [];
				battle.skills = {};

				console.log('calling end', 2);
				
				combat.processEndOfCombat(battle, attacker, defender);
			}
		} else if (defender) {
			battle.attacked = [];
			battle.skills = {};

			console.log('calling end', 1);

			combat.processEndOfCombat(battle, attacker, defender, skillProfile);
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

Combat.prototype.getBattleTargetByRefId = function(battle, refId) {
	var i = 0,
	j = 0,
	numOfPositions = 1,
	battle;

	if (!refId) {
		refId = battle;

		battle = false;
	}

	if (!battle) {
		for (i; i < World.battles.length; i += 1) {
			battle = World.battles[i];

			numOfPositions = Object.keys(battle.positions).length;

			j = 0;

			for (j; j < numOfPositions; j += 1) {
				if (battle.positions[j].attacker.refId === refId) {
					return battle.positions[j].defender;
				} else if (battle.positions[j].defender === refId) {
					return battle.positions[j].attacker;
				}
			}
		}
	} else {
		numOfPositions = Object.keys(battle.positions).length;

		for (i; i < numOfPositions; i += 1) {
			if (battle.positions[i].attacker.refId === refId) {
				return battle.positions[i].attacker;
			} else if (battle.positions[i].defender.refId === refId) {
				return battle.positions[i].defender;
			}
		}
	}
}

Combat.prototype.attack = function(attacker, defender, battle, fn) {
	var combat = this,
	roomObj = battle.roomObj,
	weaponSlots,
	shieldSlots,
	weapons,
	attackerMods = World.dice.getMods(attacker),
	defenderMods = World.dice.getMods(defender),
	numOfAttacks,
	shieldBlockSkill = World.character.getSkillById(defender, 'shieldBlock'),
	i = 0,
	j = 0,
	attackerName = combat.getCombatName(attacker),
	attackerNameCF = World.capitalizeFirstLetter(attackerName),
	defenderName = combat.getCombatName(defender),
	defenderNameCF = World.capitalizeFirstLetter(defenderName),
	msgForAttacker = '',
	msgForDefender = '',
	roomRoundTxt = '',
	damage = 0,
	dodged = false,
	blocked = false,
	damageText = '',
	weapon,
	weaponName,
	shield,
	shieldName,
	hitroll = World.character.getHitroll(attacker),
	damroll	= World.character.getDamroll(attacker),
	criticalAttackXP,
	criticalAttack = false,
	dodgeChance = World.dice.getDodgeChance(defender, attacker),
	armorScore = World.dice.getRelativeArmorScore(defender, attacker),
	attackerCanSee = World.character.canSee(attacker, roomObj),
	defenderCanSee = World.character.canSee(defender, roomObj),
	hitMsgRoll; // used in logic related to randomizing output messages

	if (attacker.chp && defender.chp && battle.attacked.indexOf(attacker.refId) === -1) {
		if (attacker.position === 'standing' && attacker.fighting) {
			weaponSlots = World.character.getWeaponSlots(attacker);

			if (defender.position === 'standing' && defender.fighting) {
				shieldSlots = World.character.getSlotsWithShields(defender);

				if (shieldSlots.length > 0) {
					//shield = shieldSlots[0].item;
					
					//shieldName = this.getCombatName(shield);
				}
			}

			i = 0;

			for (i; i < weaponSlots.length; i += 1) {
				if (weaponSlots[i].item) {
					weapon = World.character.getItemByRefId(attacker, weaponSlots[i].item);
				} else if (i === 0) {
					weapon = attacker.fist;
				}

				weaponName = this.getCombatName(weapon);

				if (i === 0) {
					numOfAttacks = combat.getNumberOfAttacks(attacker, defender, weapon, attackerMods, defenderMods);
				} else {
					numOfAttacks = World.dice.roll(1, 2) - 1;
				}

				if (numOfAttacks && weapon) {
					for (j; j < numOfAttacks; j += 1) {
						if (shield) {
							if (shieldBlockSkill) {
								chanceToDodge += World.skills.shieldBlock(shieldBlockSkill, defender);
							}

							armorScore += shieldAC;
						}

						if (armorScore < hitroll || World.dice.roll(1, 10) <= 3) {
							if (defender.vulnerableTo.length && defender.vulnerableTo.toString().indexOf(weapon.attackType) !== -1) {
								damage += World.dice.roll(1, 4 + weapon.level, attacker.level);
							}
	
							if (defender.resistantTo.length && defender.resistantTo.toString().indexOf(weapon.attackType) !== -1) {
								damage -= World.dice.roll(1, 4 + weapon.level, attacker.level);
							}

							if (dodgeChance < World.dice.roll(1, 100)) {
								damage += World.dice.roll(1, damroll) + World.dice.roll(weapon.diceNum, weapon.diceSides) + attackerMods.str;

								damage -= defender.meleeRes;

								if (damage <= 0) {
									damage = attackerMods.str;
								}

								if (World.dice.roll(1, 100) > (99 - attacker.detection)) {
									criticalAttack = true;
									criticalAttackXP = World.dice.roll(1 + attacker.level, 20);

									attacker.exp += criticalAttackXP;

									damage = (damage * (2 + weapon.diceMod)) + attacker.str + damroll + World.dice.roll(1, 20, attacker.level + 10);
								}

								damageText = combat.getDamageText(damage, defender.hp);

  								defender.chp -= damage;
								
								// if the attacker is a player we need to give a display string for reading
								if (!criticalAttack) {
									if (attackerCanSee) {
										hitMsgRoll = World.dice.roll(1, 5); // rolling for which hit message will be given

										if (hitMsgRoll <= 2) {
											msgForAttacker += '<div>You ' + damageText + ' ' + defenderName + ' with a ' + weapon.attackType
												+ ' from your ' + weapon.displayName + ' <strong class="red">('+ damage + ')</strong></div>';

											msgForDefender += '<div>' + attackerNameCF + ' ' + damageText + 's you with a ' + weapon.attackType
												+ ' from their ' + weapon.displayName + ' <strong class="red">('+ damage + ')</strong></div>';
										} else if (hitMsgRoll <= 4) {
											msgForAttacker += '<div>You ' + weapon.attackType + ' with your ' + weapon.displayName + ' '
												+ damageText + ' ' + defenderName + ' <strong class="red">(' + damage + ')</strong></div>';

											msgForDefender += '<div>' + attackerNameCF + 's ' + weapon.attackType + ' ' + damageText
											 + 's you <strong class="red">(' + damage + ')</strong></div>';
										} else {
											msgForAttacker += '<div>You ' + weapon.attackType + ' ' + defenderName + ' with your ' + weapon.displayName
												+ ' <strong class="red">(' + damage + ')</strong></div>';

											msgForDefender += '<div>' + attackerNameCF + ' ' + weapon.attackType + 's you'
											+ ' <strong class="red">('+ damage + ')</strong></div>';
										}
									} else {
										msgForAttacker += '<div>You manage to ' + weapon.attackType + ' <strong>something</strong> '
											+ ' with your ' + weapon.displayName + ' <strong class="red">(' + damage + ')</strong></div>';
									}
								} else {
									if (attackerCanSee) {
										msgForAttacker += '<div>Your ' + weapon.displayName  + ' ' + weapon.attackType + ' hits ' + defenderName
											+ ' with <strong class="red">***AMAZING***</strong> force <strong classw="red">(' + damage + ')</strong></div>'
											+ '<div class="green">You landed a <span class="red">critical hit</span> and gain '
											+ criticalAttackXP + ' experience.</div>';

										msgForDefender += '<div>' + attackerNameCF + ' ' + damageText + ' s you with '
											+ '<strong class="red">***AMAZING***</strong> force <strong classw="red">(' + damage + ')</strong></div>';
									} else {
										msgForAttacker += '<div>You ' + weapon.attackType
											+ ' somethins even while being unable to see <strong class="red">('
											+ damage + ')</strong></div>'
											+ '<div class="green">You landed a <span class="red">critical hit</span> and gain '
											+ criticalAttackXP + ' experience.</div>';

											
										msgForDefender += '<div>Something ' + weapon.attackType + 's you with '
											+ ' with <strong class="red">***AMAZING***</strong> force <strong classw="red">(' + damage + ')</strong></div>';
									}
								}
							} else {
								if (World.dice.roll(1, 2) === 1) {
									msgForAttacker += '<div class="red">You lunge at ' + defenderName + ' and miss!</div>';
									
									msgForDefender = attackerName + ' misses'
								} else {
									msgForAttacker += '<div class="red">You tryo to attack '
										+ defenderName + ' and miss!</div>';
								
									msgForDefender = attackerName + ' misses'
								}
							}
						} else {
							if (World.dice.roll(1, 2) === 1) {
								msgForAttacker += '<div class="red">You strike ' + defenderName + ' and they block your attack</div>';
								msgForDefender += '<div class="red">You block ' + attackerName + '  attack</div>';
							} else {
								msgForAttacker += '<div class="red">You try to attack ' + defenderName + ' with ' + weapon.displayName + ' but they narrowly avoid the attack</div>';
								msgForDefender += '<div class="red">You block ' + attackerName + '  attack</div>';
							}
						}
					}
				} else {
					msgForAttacker += '<div class="grey">Your ' + weapon.attackType + ' misses '
						+ defenderName + '</div>';

					msgForDefender += '<div class="grey">' + attackerNameCF + ' tries to '
						+ weapon.attackType + ' you and misses! </div>';
				}
			}
		}
	}

	return fn(attacker, defender, roomObj, msgForAttacker, msgForDefender, attackerCanSee);
};

Combat.prototype.getCombatName = function(gameObject) {
	if (gameObject.combatName) {
		return gameObject.combatName;
	} else {
		return gameObject.displayName;
	}
};

Combat.prototype.getNumberOfAttacks = function(attacker, defender, weapon) {
	var numOfAttacks = 1,
	secondAttackSkill = World.character.getSkillById(attacker, 'secondAttack');

	if (weapon.modifiers && weapon.modifiers.numOfAttacks) {
		numOfAttacks += (Word.dice.roll(1, weapon.modifiers.numOfAttacks));
	}

	if (attacker.mainStat === 'dex' && World.dice.roll(1, 10) <= 2) {
		numOfAttacks += 1;
	}

	if (attacker.dex > 15 && World.dice.roll(1, 10) === 1) {
		numOfAttacks += 1;
	}

	if (attacker.str > 20 && World.dice.roll(1, 10) === 1) {
		numOfAttacks += 1;
	}

	if (secondAttackSkill && numOfAttacks === 1) {
		if (World.dice.roll(1, 100) <= secondAttackSkill.train) {
			numOfAttacks = World.skills.secondAttack(secondAttackSkill, attacker);
		}
	}

	if (numOfAttacks === 1 && World.dice.roll(1, 3) === 1) {
		numOfAttacks += 1;
	}

	if (numOfAttacks > 1 && defender.level > attacker.level) {
		if (World.dice.roll(1, 2) === 1) {
			numOfAttacks -= 1;
		}
	}

	return numOfAttacks;
};

// Insert a skill profile into the relevant battle object so it can be applied in round()
Combat.prototype.processSkill = function(attacker, defender, skillProfile) {
	var battle = this.getBattleByRefIds(attacker.refId, defender.refId);

	if (battle) {
		var prop;
		var inBattle = false;

		for (prop in battle.positions) {
			if (!inBattle && battle.positions[prop].defender.refId === defender.refId
				|| battle.positions[prop].attacker.refId === defender.refId) {
					inBattle = true;
				}
		}

		if (!inBattle) {
			var nextPosition = this.getNextBattlePosition(battle);

			attacker.fighting = true;
			defender.fighting = true;

			battle.positions[nextPosition] = {
				attacker: attacker,
				defender: defender
			};
		}

		if (!battle.skills[attacker.refId]) {
			battle.skills[attacker.refId] = {};
		}

		battle.skills[attacker.refId][defender.refId] = skillProfile;
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

Combat.prototype.getDamageText = function(damage, hp) {
	var i = 0,
	percentOfDmg = parseInt(((damage/hp) * 100), 10),
	value;

	for (i; i < this.damage.length; i += 1) {
		if (this.damage[i].damage >= percentOfDmg) {
			if (!Array.isArray(this.damage[i].value)) {
				value = this.damage[i].value;
			} else {
				value = this.damage[i].value[World.dice.roll(1, 2) - 1];
			}

			return value;
		}
	}

	return this.damage[this.damage.length - 1].value;
};

// TODO: ending combat message needs to be sent to all attacking players along with removing their Battle Objects
Combat.prototype.processEndOfCombat = function(battleObj, attacker, defender, skillProfile) {
	var combat = this,
	winner,
	loser,
	roomObj = battleObj.roomObj,
	exp = 0,
	corpse,
	endOfCombatMsg = '',
	numOfPositions = combat.getNumberOfBattlePositions(battleObj),
	i = 0,
	battlePositionId,
	battlePosition,
	positionsWithDefender = [], // the battle positions involving the slain entity
	respawnRoom;

	if (attacker.chp <= 0 || defender.chp <= 0) {
				
		if (attacker.chp > 0) {
			winner = attacker;
			loser = defender;
		} else {
			winner = defender;
			loser = attacker;
		}

		if (numOfPositions !== 1) {
			// processing combat objects with more than one battle position
			for (i; i < numOfPositions; i += 1) {
				battlePosition = battleObj.positions[i];

				if (battlePosition.attacker.refId === loser.refId) {
					battleObj.positions[i] = undefined;
				} else if (battlePosition.defender.refId === loser.refId) {
					battleObj.positions[i] = undefined;
				}
			}

			numOfPositions = combat.getNumberOfBattlePositions(battleObj);

			if (!numOfPositions) {
				combat.removeBattle(battleObj);

				loser.fighting = false;

				winner.fighting = false;
			} else {
				loser.fighting = false;
			}
		} else {
			combat.removeBattle(battleObj);

			loser.fighting = false;

			winner.fighting = false;
		}

		loser.chp = 0; // cant go below zero hp
		loser.killedBy = winner.name;

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
			World.addCommand({
				cmd: 'alert',
				msg: endOfCombatMsg,
				styleClass: 'victory'
			}, winner);

			World.character.save(winner);
		}
	} else {
		if (numOfPositions !== 1) {
			console.log('TODO: ending an unfinished battle with multiple positions');
			combat.removeBattle(battleObj);

			attacker.fighting = false;
		} else {
			combat.removeBattle(battleObj);
			battleObj.positions[0].defender.fighting = false;
			battleObj.positions[0].attacker.fighting = false;
		}
	}
};

Combat.prototype.getNumberOfBattlePositions = function(battleObj) {
	var numOfPositions = 0,
	battlePositionId;

	for (battlePositionId in battleObj.positions) {
		if (battleObj.positions[battlePositionId] !== undefined) {
			numOfPositions += 1;
		}
	}

	return numOfPositions;
}

Combat.prototype.getBattleByRefId = function(refId) {
	var i = 0,
	battle,
	prop;

	for (i; i < World.battles.length; i += 1) {
		battle = World.battles[i];

		for (prop in battle.positions) {
			if (battle.positions[prop].attacker.refId === refId ||
				battle.positions[prop].defender.refId === refId) {
				return battle;
			}
		}
	}
}

Combat.prototype.getBattleByRefIds = function(attackerRefId, defenderRefId) {
	var i = 0,
	battle,
	prop;

	for (i; i < World.battles.length; i += 1) {
		battle = World.battles[i];

		for (prop in battle.positions) {
			if (
				(battle.positions[prop].attacker.refId === attackerRefId ||
				battle.positions[prop].defender.refId === attackerRefId) ||
				(battle.positions[prop].attacker.refId === defenderRefId ||
				battle.positions[prop].defender.refId === defenderRefId)
			) {
				return battle;
			}
		}
	}
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
