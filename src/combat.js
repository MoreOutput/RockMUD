'use strict';
var World,
Combat = function(newWorld) {
	World = newWorld;

	this.damage = [
		{
			value: ['nicks', 'grazes'],
			min: 1,
			max: 4,
			sizeFlare: false, // means the value will display in uppercase if its within 70& of its max
			flagFlare: false // means the value will display flare if its within 90& of its max
		},
		{
			value: ['hurts', 'wounds', 'injures'],
			min: 5,
			max: 8,
			sizeFlare: false,
			flagFlare: false
		},
		{
			value: ['maims', 'harms'],
			min: 9,
			max: 14,
			sizeFlare: true,
			flagFlare: false
		},
		{
			value: ['mauls', 'demolishes', 'punishes'],
			min: 15,
			max: 21,
			sizeFlare: true,
			flagFlare: false
		},
		{
			value: ['destroys', 'pulverizes'],
			min: 22,
			max: 100,
			sizeFlare: true,
			flagFlare: true
		}
	];
	
	/*
	this.force = [
		{value: ['strength ', 'force'], threshold: 10},
		{value: ['intensity', 'force'], threshold: 20},
		{value: 'power', min: 4, threshold: 40},
	];
	*/
};

Combat.prototype.processFight = function(attacker, defender, roomObj, skillProfile, battle) {
	var combat = this,
	battle,
	nextPosition,
	j = 0,
	i = 0;

	if (!battle) {
		// find any battle the defender may currently be in
		battle = combat.getBattleByRefId(defender.refId);

		if (!battle) {
			battle = combat.getBattleByRefId(attacker.refId);
		}

		if (battle) {
		 	nextPosition = this.getNextBattlePosition(battle);

			attacker.fighting = true;
			defender.fighting = true;

			battle.positions[nextPosition] = {
				attacker: attacker,
				defender: defender
			};
		}
	}

	if (!battle) {
		battle = combat.createBattleObject(attacker, defender, roomObj);
		
		for (j; j < attacker.group.length; j += 1) {
			nextPosition = this.getNextBattlePosition(battle);

			battle.positions[nextPosition] = {
				attacker: attacker.group[j],
				defender: defender
			};

			attacker.group[j].fighting = true;

			World.removeAffect(attacker.group[j], 'sneak');
		}

		j = 0;

		for (j; j < defender.group.length; j += 1) {
			nextPosition = this.getNextBattlePosition(battle);

			battle.positions[nextPosition] = {
				attacker: defender.group[j],
				defender: attacker
			};

			defender.group[j].fighting = true;

			World.removeAffect(defender.group[j], 'sneak');
		}

		World.battles.push(battle);
	}

	// if a player is not currently fighting and is without an attached opponent we assume we can create a Battle Object
	// Battle Objects are put into the World battle queue and processed on a timer
	// the timer is defined in ticks.js and basically just hands the object over to the Combat.round() function

	attacker.fighting = true;
	defender.fighting = true;

	World.removeAffect(attacker, 'sneak');
	World.removeAffect(defender, 'sneak');

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
};

Combat.prototype.processFightMultiple = function(attacker, defenders, roomObj, skillProfileArr) {
	var combat = this,
	battle,
	nextPosition,
	j = 0,
	i = 0;

	battle = combat.getBattleByRefId(attacker.refId);

	if (!battle) {
		battle = combat.getBattleByRefId(defenders[0].refId);
	}

	if (!battle) {
		battle = combat.createBattleObject(attacker, defenders, roomObj);
	}

	attacker.fighting = true;

	for (j; j < attacker.group.length; j += 1) {
		nextPosition = this.getNextBattlePosition(battle);
		
		battle.positions[nextPosition] = {
			attacker: attacker.group[j],
			defender: defender
		};

		attacker.group[j].fighting = true;
	}

	defenders.forEach((defender, index) => {
		var skillProfile;

		defender.fighting = true;

		if (skillProfileArr[index]) {
			skillProfile = skillProfileArr[index];
		}
		
		j = 0;

		for (j; j < defender.group.length; j += 1) {
			nextPosition = this.getNextBattlePosition(battle);

			battle.positions[nextPosition] = {
				attacker: defender.group[j],
				defender: attacker
			};
			
			defender.group[j].fighting = true;
		}
	
		if (skillProfile) {
			if (!battle.skills[attacker.refId]) {
				battle.skills[attacker.refId] = {};
			}

			battle.skills[attacker.refId][defender.refId] = skillProfile;
		}
	});

	World.battles.push(battle);
};

Combat.prototype.createBattleObject = function(attacker, defender, roomObj) {
	if (!Array.isArray(defender)) { 
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
	} else {
		var obj = {
			round: 0,
			roomObj: roomObj,
			positions: {},
			skills: {},
			attacked: [] // refid listing of entities in this battle who've attacked this round
		};

		defender.forEach((defender, index) => {
			var battlePosition = this.createBattlePosition();

			if (index !== 0) {
				battlePosition.attacker = defender;
				battlePosition.defender = attacker;
			} else {
				battlePosition.attacker = attacker;
				battlePosition.defender = defender;
			}

			obj.positions[index] = battlePosition;
		});

		return obj;
	}
};

Combat.prototype.createBattlePosition = function() {
	return {
		attacker: null,
		defender: null
	};
}

Combat.prototype.getNextBattlePosition = function(battle) {
	// returns the length, which is the next position since we start from 0
	return this.getNumberOfBattlePositions(battle);
}

Combat.prototype.getStatusReport = function(entity) {
	var statusReport = World.character.getStatusReport(entity);

	if (!World.config.viewHp) {
		return '<div class="rnd-status">' + World.capitalizeFirstLetter(entity.name) + statusReport.msg
			+ '</div>';
	} else {
		return '<div class="rnd-status">' + World.capitalizeFirstLetter(entity.name) + statusReport.msg
			+ ' (' + entity.chp + '/' + entity.hp +')</div>';
	}
}

Combat.prototype.round = function(battle) {
    var combat = this;
    var numOfPositions = combat.getNumberOfBattlePositions(battle);
    var position = battle.positions['0'];
    var roundOutput = {
        /*
            refId : {
				msg: '',
				entity: 
			},
			room: {
				msg: ''
			}
        */
    };
    var attacker;
    var defender;
	var i = 0;
	var attackerCanSee;
	var defenderCanSee;
	var attackerSkills = {};

	battle.round += 1;
	battle.attacked = [];

    for (i; i < numOfPositions; i += 1) {
        position = battle.positions[i];

        if (position !== null) {
            attacker = position.attacker;
            defender = position.defender;

			attackerCanSee = World.character.canSee(attacker, battle.roomObj);
			defenderCanSee = World.character.canSee(defender, battle.roomObj);

			if (!roundOutput[attacker.refId]) {
				roundOutput[attacker.refId] = {
					msg: '',
					entity: attacker
				};
			}

			if (!roundOutput[defender.refId]) {
				roundOutput[defender.refId] = {
					msg: '',
					entity: defender
				};
			}

            // TODO: if the attacker has a group members not in the fight they should be added

            // if the defender has group members in the same room they need to be added to the battle
            if (defender.group && defender.group.length && battle.attacked.indexOf(defender.refId) === -1) {
				var k = 0;
				
                for (k; k < defender.group.length; k += 1) {
					groupMember = combat.getBattleTargetByRefId(battle, defender.group[k].refId);

					if (!groupMember && !defender.group[k].fighting && defender.group[k].chp) {
						// group member was not in the battle
                        if (combat.inPhysicalVicinity(attacker, defender.group[k]) && attacker.chp && defender.group[k].chp) {
							var nextPosition = combat.getNextBattlePosition(battle);

							defender.group[k].fighting = true;

							battle.positions[nextPosition] = {
								attacker: attacker,
								defender: defender.group[k]
							};
						}
					}
				}
			}

			// TODO -- passive skills (defender of skill isnt combat targer)
			// passive skills (healing, passive) resolve at the head of the attackers first attack

			// same room and have hp
	        if (combat.inPhysicalVicinity(attacker, defender) && attacker.chp > 0 && defender.chp > 0) {
				// apply any skills to the casters self
				if (battle.skills[attacker.refId] && battle.skills[attacker.refId][attacker.refId] && battle.attacked.indexOf(attacker.refId) === -1) {
					attackerSkills = battle.skills[attacker.refId];

					World.character.applyMods(attacker, attackerSkills[attacker.refId].defenderMods);

					if (attackerSkills[attacker.refId].attackerMods) {
						World.character.applyMods(attacker, attackerSkills[attacker.refId].attackerMods);
					}

					roundOutput[attacker.refId].msg += '<div>' + attackerSkills[attacker.refId].msgToDefender + '</div>';

					battle.skills[attacker.refId][attacker.refId] = null;
				}

				attacker.group.forEach(grpMember => {
					if (battle.skills[attacker.refId] && battle.skills[attacker.refId][grpMember.refId]) {
						
					}
				});
				
				if (battle.skills[attacker.refId] && battle.skills[attacker.refId][defender.refId]) {
					attackerSkills = battle.skills[attacker.refId];
					
					var skillTarget = combat.getBattleEntityByRefId(battle, defender.refId);

					World.character.applyMods(skillTarget, attackerSkills[defender.refId].defenderMods);

					if (attackerSkills[defender.refId].attackerMods) {
						World.character.applyMods(attacker, attackerSkills[defender.refId].attackerMods);
					}

					if (skillTarget.chp > 0) {
						roundOutput[attacker.refId].msg += '<div>' + attackerSkills[defender.refId].msgToAttacker + '</div>';
					} else {
						roundOutput[attacker.refId].msg += '<div>' + attackerSkills[defender.refId].winMsg + '</div>';
					}

					battle.skills[attacker.refId][defender.refId] = null;
				}
				
				// apply defender skills
				if (battle.skills[defender.refId] && battle.skills[defender.refId][attacker.refId]) {
					attackerSkills = battle.skills[defender.refId];
					
					var skillTarget = combat.getBattleEntityByRefId(battle, attacker.refId);

					World.character.applyMods(skillTarget, attackerSkills[attacker.refId].defenderMods);

					if (attackerSkills[attacker.refId].attackerMods) {
						World.character.applyMods(attacker, attackerSkills[attacker.refId].attackerMods);
					}

					if (skillTarget.chp > 0) {
						roundOutput[defender.refId].msg += '<div>' + attackerSkills[attacker.refId].msgToAttacker + '</div>';
					} else {
						roundOutput[defender.refId].msg += '<div>' + attackerSkills[attacker.refId].winMsg + '</div>';
					}

					battle.skills[defender.refId][attacker.refId] = null;
				}

				if (combat.inPhysicalVicinity(attacker, defender) && attacker.chp > 0 && defender.chp > 0) {
					// can only land attacks once per round
					if (battle.attacked.indexOf(attacker.refId) === -1) {
						battle.attacked.push(attacker.refId); // prevents future attacks

						combat.attack(attacker, defender, battle, i, attackerCanSee, defenderCanSee, function(attacker, defender, roomObj, i, attackerAttackString, defenderDefString, attackerCanSee) {
							roundOutput[attacker.refId].msg += attackerAttackString;
							roundOutput[defender.refId].msg += defenderDefString;

							// check to see if the defender is still alive
							if (defender.chp > 0) {
								// defender cannnot have already attacked
								if (battle.attacked.indexOf(defender.refId) === -1) {
									battle.attacked.push(defender.refId); // prevents future attacks

									combat.attack(defender, attacker, battle, i, attackerCanSee, defenderCanSee, function(defender, attacker, roomObj, i, defenderAttackString, attackerDefString, defenderCanSee) {
										roundOutput[defender.refId].msg += defenderAttackString + combat.getStatusReport(attacker);
										roundOutput[attacker.refId].msg += attackerDefString + combat.getStatusReport(defender);

										if (attacker.chp) {
											// all entities attacked, send the message
											if (i === numOfPositions - 1) {
												combat.publishRound(roundOutput, battle);
											}
										} else {
											// attacker was killed by defender
											var deathOutput = combat.getDeathMessages(defender, attacker);

											roundOutput[attacker.refId].msg += deathOutput.msgToLoser;
											roundOutput[defender.refId].msg += deathOutput.msgToWinner;

											// the defender is dead
											if (i === numOfPositions - 1) {
												combat.publishRound(roundOutput, battle);
											}
										}
									});
								} else {
									// defender has already attacked
									roundOutput[defender.refId].msg += combat.getStatusReport(attacker);
									roundOutput[attacker.refId].msg += combat.getStatusReport(defender);
									
									if (i === numOfPositions - 1) {
										combat.publishRound(roundOutput, battle);
									}   
								}
							} else {
								var deathOutput = combat.getDeathMessages(attacker, defender);

								roundOutput[defender.refId].msg += deathOutput.msgToLoser;
								roundOutput[attacker.refId].msg += deathOutput.msgToWinner;

								// the defender is dead
								if (i === numOfPositions - 1 || combat.getNumberOfOpenBattlePositions(battle) === 1) {
									combat.publishRound(roundOutput, battle);
								}
							}
						}); 
					}
				} else {
					if (attacker.chp <= 0) {
						var deathOutput = combat.getDeathMessages(defender, attacker, attackerSkills[defender.refId]);
						
						roundOutput[defender.refId].msg += deathOutput.msgToWinner;
						roundOutput[attacker.refId].msg += deathOutput.msgToLoser;
					} else if (defender.chp <= 0) {
						var deathOutput = combat.getDeathMessages(attacker, defender, attackerSkills[attacker.refId]);

						roundOutput[attacker.refId].msg += deathOutput.msgToWinner;
						roundOutput[defender.refId].msg += deathOutput.msgToLoser;
					}

					if (i === numOfPositions - 1) {
						combat.publishRound(roundOutput, battle);
					}   
				}
            } else if (defender.chp <= 0) {
				/*
				console.warn('defender is dead 1');
				var deathOutput = combat.getDeathMessages(attacker, defender, attackerSkills[attacker.refId]);

				roundOutput[attacker.refId].msg += deathOutput.msgToWinner;
				roundOutput[defender.refId].msg += deathOutput.msgToLoser;

				if (i === numOfPositions - 1) {
					combat.publishRound(roundOutput, battle);
				}  
				*/
			} else if (attacker.chp <= 0) {
				/*
				console.warn('attacker is dead', i, numOfPositions, attacker.name, defender.name );

				var deathOutput = combat.getDeathMessages(defender, attacker);

				roundOutput[attacker.refId].msg += deathOutput.msgToLoser;
				roundOutput[defender.refId].msg += deathOutput.msgToWinner;

				if (i === numOfPositions - 1 || combat.getNumberOfOpenBattlePositions(battle) === 1) {
					combat.publishRound(roundOutput, battle);
				}  
				*/
			} else {
				console.warn('PROCESSING ROUND WITH REMOVED ENTITIES', battle.round, attacker.name, defender.name, combat.getNumberOfOpenBattlePositions(battle));
				combat.removeBattle(battle);
			}
        }
    }
};

Combat.prototype.inPhysicalVicinity = function(attacker, defender) {
	if (attacker && defender && attacker.area === defender.area && attacker.roomid === defender.roomid) {
		return true;
	} else {
		return false;
	}
}

// todo this function is doing too much
Combat.prototype.getBattleTargetByRefId = function(battle, refId) {
	var i = 0,
	j = 0,
	numOfPositions = 1,
	battle;

	if (!refId) {
		refId = battle;

		battle = this.getBattleByRefId(refId);
	}
	
	if (!battle) {
		for (i; i < World.battles.length; i += 1) {
			battle = World.battles[i];

			numOfPositions = Object.keys(battle.positions).length;

			j = 0;

			for (j; j < numOfPositions; j += 1) {
				if (battle.positions[j]) {
					if (battle.positions[j].attacker.refId === refId) {
						return battle.positions[j].defender;
					} else if (battle.positions[j].defender === refId) {
						return battle.positions[j].attacker;
					}
				}
			}
		}
	} else {
		numOfPositions = Object.keys(battle.positions).length;
		for (i; i < numOfPositions; i += 1) {
			if (battle.positions[i]) {
				if (battle.positions[i].attacker.refId === refId) {
					return battle.positions[i].defender;
				} else if (battle.positions[i].defender.refId === refId) {
					return battle.positions[i].attacker;
				}
			}
		}
	}
}

Combat.prototype.getBattleEntityByRefId = function(battle, refId) {
	var i = 0,
	j = 0,
	battle,
	numOfPositions = Object.keys(battle.positions).length;
	
	for (i; i < numOfPositions; i += 1) {
		if (battle.positions[i]) {
			if (battle.positions[i].attacker.refId === refId) {
				return battle.positions[i].attacker;
			} else if (battle.positions[i].defender.refId === refId) {
				return battle.positions[i].defender;
			}
		}
	}
}

Combat.prototype.publishRound = function(roundOutput, battleObj) {
	var refId;
	var numOfPositions = this.getNumberOfBattlePositions(battleObj);
	var roomObj = battleObj.roomObj;
	var i = 0;

	// Sort the battle positions
	for (i; i < numOfPositions; i += 1) {
		var battlePosition = battleObj.positions[i];

		if (battlePosition && (battlePosition.attacker.chp <= 0 || battlePosition.defender.chp <= 0)) {
			var loser;
			var winner;

			if (battlePosition.attacker.chp > 0) {
				winner = battlePosition.attacker;
				loser = battlePosition.defender;
			} else {
				winner = battlePosition.defender;
				loser = battlePosition.attacker;
			}

			var loserIsAttacker = undefined;
			var entityToPlace = null;
			var entityToAttack;
			
			if (battlePosition.attacker.refId === loser.refId) {
				loserIsAttacker = true;
				entityToPlace = battlePosition.defender;
			} else if (battlePosition.defender.refId === loser.refId) {
				loserIsAttacker = false;
				entityToPlace = battlePosition.attacker;
			}

			if (entityToPlace !== null) {
				// if the entity is in another slot already, do nothing
				var j = 0;
				var inAnotherSlot = false;

				// see if the entity is in another slot
				for (j; j < numOfPositions; j += 1) {
					if (!inAnotherSlot && battleObj.positions[j] && (battleObj.positions[j].attacker.refId === entityToPlace.refId
						|| battleObj.positions[j].defender.refId === entityToPlace.refId) && i !== j) {
						inAnotherSlot = true;
					}
				}

				if (!inAnotherSlot) {
					j = 0;
					// find the first non grouped entity								
					for (j; j < numOfPositions; j += 1) {
						if (battleObj.positions[j] 
							&& battleObj.positions[j].attacker.refId !== loser.refId
							&& battleObj.positions[j].attacker.refId !== entityToPlace.refId) {
							if (!World.character.checkGrouped(battleObj.positions[j].attacker, entityToPlace)) {
								entityToAttack = battleObj.positions[j].attacker;
							}
						} else if (battleObj.positions[j] 
							&& battleObj.positions[j].defender.refId !== loser.refId
							&& battleObj.positions[j].defender.refId !== entityToPlace.refId) {
							if (!World.character.checkGrouped(battleObj.positions[j].defender, entityToPlace)) {
								entityToAttack = battleObj.positions[j].defender;
							}
						}
					}

					// check if the entity has a group member in the battle
					// if they do then make that a new position
					if (entityToPlace.group.length && entityToAttack) {
						entityToPlace.group.forEach((grpMember) => {
							var inBattle = combat.getBattleTargetByRefId(battleObj, grpMember.refId);
							if (inBattle) {
								battleObj.positions[numOfPositions] = {
									defender: entityToAttack,
									attacker: entityToPlace
								};	
							}
						});
					}

					battleObj.positions[i] = null;
				} else {
					battleObj.positions[i] = null;
				}
			};

			loser.fighting = false;
			loser.chp = 0;
			loser.killedBy = winner.name;

			loser.exp = 0;
			
			var corpse = World.character.createCorpse(loser);

			if (!loser.isPlayer) {
				World.room.removeMob(roomObj, loser);
			} else {
				var respawnRoom = World.getRoomObject(loser.recall.area, loser.recall.roomid);

				World.room.removePlayer(roomObj, loser);

				loser.chp = 5;
				loser.cmana = 1;
				loser.cmv = 7;
				loser.items = [];
				loser.position = 'standing';

				respawnRoom.playersInRoom.push(loser);

				loser.roomid = respawnRoom.id;
				loser.area = respawnRoom.area;

				World.character.save(loser);
			}

			World.room.addItem(roomObj, corpse);
		}
	}

	if (!this.getNumberOfOpenBattlePositions(battleObj)) {
		winner.fighting = false;

		this.removeBattle(battleObj);
	}

	for (refId in roundOutput) {
		World.character.changeWait(roundOutput[refId].entity, -1);

		World.addCommand({
			cmd: 'alert',
			msg: roundOutput[refId].msg,
			styleClass: 'round'
		},  roundOutput[refId].entity);
	}
};

Combat.prototype.attack = function(attacker, defender, battle, positionNumber, attackerCanSee, defenderCanSee, fn) {
	var combat = this;
	var roomObj = battle.roomObj;
	var weaponSlots;
	var shieldSlots;
	var attackerMods = World.dice.getMods(attacker);
	var defenderMods = World.dice.getMods(defender);
	var numOfAttacks;
	var i = 0;
	var j = 0;
	var attackerName = combat.getCombatName(attacker);
	var attackerNameCF = World.capitalizeFirstLetter(attackerName);
	var defenderName = combat.getCombatName(defender);
	var msgForAttacker = '';
	var msgForDefender = '';
	var damage = 0;
	var blocked = false;
	var damageText = '';
	var weapon;
	var criticalAttack = false;
	var unarmed = false;
	var hitMsgRoll;
	var weaponName;
	var weapon;

	if (attacker.chp && defender.chp) {
		if (attacker.position === 'standing' && attacker.fighting) {
			weaponSlots = World.character.getWeaponSlots(attacker);

			shieldSlots = World.character.getSlotsWithShields(defender);

			if (shieldSlots.length > 0) {
				//shield = shieldSlots[0].item;
				
				//shieldName = this.getCombatName(shield);
			}

			for (i; i < weaponSlots.length; i += 1) {
				if (weaponSlots[i].item) {
					weapon = World.character.getItemByRefId(attacker, weaponSlots[i].item);
				} else {
					weapon = attacker.fist;
					unarmed = true;
				}

				weaponName = combat.getCombatName(weapon);

				numOfAttacks = combat.getNumberOfAttacks(attacker, defender, weapon, attackerMods, defenderMods);

				// max two attacks with secondary weapons
				if (i !== 0 && numOfAttacks > 2) {
					numOfAttacks = 2;
				}

				//unarmed only attacks once
				if (unarmed) {
					numOfAttacks = 1;
				}

				if (numOfAttacks && i === 0) {
					j = 0;

					for (j; j < numOfAttacks; j += 1) {
						var baseHit = World.dice.roll(2, 10);
						var baseBlock = World.dice.roll(2, 10);
						var attackRoll = baseHit + attackerMods.dex + attacker.hitroll;
						var armorTotal = defender.ac + (defenderMods.dex) + defender.meleeRes;

						if (baseHit === 20) {
							criticalAttack = true;
						}					
						
						attackRoll += (attacker.level - defender.level)
						
						attackRoll += (defender.size.value - attacker.size.value);

						if (baseBlock === 2) {
							blocked = false;
						} else if (baseBlock === 20) {
							blocked = true;
						}

						damage = World.dice.roll(weapon.diceNum, weapon.diceSides, attacker.damroll + attackerMods.str) ;
						damage -= defender.meleeRes;

						if (damage < 1) {
							blocked = true;
						}

						if (baseHit !== 2 && !blocked && attackRoll > armorTotal) {
							if (criticalAttack) {
								damage = (damage * 3) + (attacker.damroll + attackerMods.str);
							}

							damageText = combat.getDamageText(damage, defender.chp);

							World.character.changeHp(defender, -damage);

							// if the attacker is a player we need to give a display string for reading
							if (!criticalAttack) {
								// regular attacks
								if (attackerCanSee) {
									hitMsgRoll = World.dice.roll(1, 5); // rolling for which hit message will be given

									if (hitMsgRoll <= 2) {
										msgForAttacker += '<div>Your ' + weapon.attackType + ' ' + damageText 
											+ ' ' + defenderName + '<strong class="red">('+ damage + ')</strong></div>';

										msgForDefender += '<div>' + attackerNameCF + ' ' + damageText + ' you with a ' + weapon.attackType
											+ ' from their ' + weapon.displayName + ' <strong class="red">('+ damage + ')</strong></div>';
									} else if (hitMsgRoll <= 4) {
										msgForAttacker += '<div>You ' + weapon.attackType + ' with your ' + weapon.displayName + ' and it '
											+ damageText + ' ' + defenderName + ' <strong class="red">(' + damage + ')</strong></div>';

										msgForDefender += '<div>' + attackerNameCF + 's ' + weapon.attackType + ' ' + damageText
											+ ' you <strong class="red">(' + damage + ')</strong></div>';
									} else {
										msgForAttacker += '<div>A ' + weapon.attackType + ' from your ' + weapon.displayName + ' ' + damageText 
											+ ' ' + defenderName + '<strong class="red">('+ damage + ')</strong></div>';

										msgForDefender += '<div>' + attackerNameCF + ' ' + weapon.attackType + 's you'
											+ ' <strong class="red">('+ damage + ')</strong></div>';
									}
								} else {
									msgForAttacker += '<div>You manage to ' + weapon.attackType + ' <strong>something</strong> '
										+ ' with your ' + weapon.displayName + ' <strong class="red">(' + damage + ')</strong></div>';
								}
							} else {
								// critical hits
								if (attackerCanSee) {
									msgForAttacker += '<div>Your ' + weapon.displayName  + ' hit ' + defenderName
										+ ' with <strong class="green">*---->CrItIcAl FOrcE<----*</strong><strong class="red">(' + damage + ')</strong></div>'
										+ '<span class="yellow">You landed a <span class="red">critical hit</span>.</div>';

									msgForDefender += '<div>' + attackerNameCF + ' ' + damageText + ' s you with '
										+ '<strong class="red">*---->CrItIcAl FOrcE<----*</strong> <strong classw="red">(' + damage + ')</strong></div>';
								} else {
									msgForAttacker += '<div>You ' + weapon.attackType
										+ ' something even while being unable to see <span class="red">('
										+ damage + ')</span></div>'
										+ '<div class="yellow">You landed a <span class="red">critical hit</span>.</div>';
										
									msgForDefender += '<div>Something ' + weapon.attackType + 's you with '
										+ ' with <span class="red">***CRITICAL***</span> force <strong classw="red">(' + damage + ')</strong></div>';
								}
							}
						} else if (baseHit === 2) {
							// baseHit was 2 -- automatic miss
							msgForAttacker += '<div class="grey">Your ' + weapon.attackType + ' misses '
								+ defenderName + '</div>';
	
							msgForDefender += '<div class="grey">' + attackerNameCF + ' tries to '
								+ weapon.attackType + ' you and misses! </div>';
						} else if (Math.abs(armorTotal - attackRoll) <= defenderMods.dex) {
							// dodge
							msgForAttacker += '<div class="red">You lunge at ' + defenderName + ' but they dodge just in time!</div>';
								
							msgForDefender = attackerName + ' misses'
						} else {
							// attack was blocked
							if (World.dice.roll(1, 2) === 1) {
								msgForAttacker += '<div class="red">You strike ' + defenderName + ' and they block your attack</div>';
								msgForDefender += '<div class="red">You block ' + attackerName + '  attack</div>';
							} else {
								msgForAttacker += '<div class="red">You try to attack ' + defenderName + ' with ' + weapon.displayName + ' but they narrowly avoid the attack</div>';
								msgForDefender += '<div class="red">You block ' + attackerName + '  attack</div>';
							}
						}
					}
				} else if (!unarmed && i > 0) {
					msgForAttacker += '<div class="grey">Your ' + weapon.attackType + ' misses '
						+ defenderName + '</div>';

					msgForDefender += '<div class="grey">' + attackerNameCF + ' tries to '
						+ weapon.attackType + ' you and misses! </div>';
				}
			}
		}
	}

	return fn(attacker, defender, roomObj, positionNumber, msgForAttacker, msgForDefender, attackerCanSee, defenderCanSee);
};

Combat.prototype.getCombatName = function(gameObject) {
	if (gameObject.combatName) {
		return gameObject.combatName;
	} else {
		return gameObject.displayName;
	}
};

Combat.prototype.getNumberOfAttacks = function(attacker, defender, weapon, attackerMods, defenderMods) {
	var numOfAttacks = 1;
	var secondAttackSkill = World.character.getSkillById(attacker, 'secondAttack');
	var thirdAttackSkill = World.character.getSkillById(attacker, 'thirdAttack');
	var luck = World.dice.roll(2, 10);

	if (weapon.modifiers && weapon.modifiers.numOfAttacks) {
		numOfAttacks += (Word.dice.roll(1, weapon.modifiers.numOfAttacks));
	}

	if (secondAttackSkill && numOfAttacks <= 1) {
		if (World.dice.roll(1, 100) <= secondAttackSkill.train && secondAttackSkill.train > 70) {
			numOfAttacks = 2;
		}
	}

	if (thirdAttackSkill && numOfAttacks <= 2 ) {
		if (World.dice.roll(1, 100) <= thirdAttackSkill.train && thirdAttackSkill.train > 75) {
			numOfAttacks = 3;
		}
	}

	if ((attacker.mainStat === 'dex' || numOfAttacks < 4 && attackerMods.dex) && World.dice.roll(2, 10) > 10) {
		numOfAttacks += World.dice.roll(1, 2);
	}

	if (numOfAttacks === 1 && luck > 18) {
		numOfAttacks = 2;
	} else if (luck === 1) {
		numOfAttacks = 1;
	}

	return numOfAttacks;
};

// Insert a skill profile into the relevant battle object so it can be applied in round()
Combat.prototype.processSkill = function(attacker, defender, skillProfile, battle) {
	var prop,
	inBattle = false,
	nextPosition;

	if (!battle) {
		battle = this.getBattleByRefId(attacker.refId);
	}

	if (!battle) {
		battle = this.getBattleByRefId(defender.refId);
	}

	if (battle) {
		for (prop in battle.positions) {
			if (!inBattle && battle.positions[prop] && (battle.positions[prop].defender.refId === defender.refId
				|| battle.positions[prop].attacker.refId === defender.refId)) {
					inBattle = true;
				}
		}

		if (!inBattle) {
			nextPosition = this.getNextBattlePosition(battle);

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

		// TODO: Move defender.refId to target in skillProfile? Allow for array based skills for flexibility?
		battle.skills[attacker.refId][defender.refId] = skillProfile;
	} else {
		if (!skillProfile.skillObj.type.includes('heal') !== -1 || skillProfile.skillObj.type.includes('passive')) {
			World.character.applyMods(attacker, skillProfile.attackerMods);
			World.character.applyMods(defender, skillProfile.defenderMods);

			World.addCommand({
				cmd: 'alert',
				msg: skillProfile.msgToDefender,
			},  attacker);
		} else {
			this.processFight(attacker, defender, World.getRoomObject(attacker.area, attacker.roomid), skillProfile);
		}
	}
}

Combat.prototype.processMultiSkill = function(attacker, defenders, skillProfileArr, battleObj) {
	var prop,
	battle,
	inBattle = false,
	nextPosition;

	if (battleObj) {
		battle = battleObj;
	}

	if (!battle) {
		battle = this.getBattleByRefId(attacker.refId);
	}

	
	if (!battle) {
		battle = this.getBattleByRefId(defenders[0].refId);
	}

	if (battle) {
		defenders.forEach((defender, index) => {
			var skillProfile;

			inBattle  = false;
		
			if (skillProfileArr[index]) {
				skillProfile = skillProfileArr[index];
			}
		
			for (prop in battle.positions) {
				if (!inBattle && battle.positions[prop] && (battle.positions[prop].defender.refId === defender.refId
					|| battle.positions[prop].attacker.refId === defender.refId)) {
						inBattle = true;
					}
			}

			if (!inBattle) {
				nextPosition = this.getNextBattlePosition(battle);

				defender.fighting = true;

				battle.positions[nextPosition] = {
					attacker: defender,
					defender: attacker
				};
			}

			if (!battle.skills[attacker.refId]) {
				battle.skills[attacker.refId] = {};
			}

			// TODO: Move defender.refId to target in skillProfile? Allow for array based skills for flexibility?
			battle.skills[attacker.refId][defender.refId] = skillProfile;
		});
	} else {
		if (!skillProfileArr[0].skillObj.type.includes('heal')) {
			this.processFightMultiple(attacker, defenders, World.getRoomObject(attacker.area, attacker.roomid), skillProfileArr);
		} else {
			// using a passive spell outside of combat
			World.character.applyMods(attacker, skillProfileArr[0].attackerMods);

			skillProfileArr.forEach((skillProfile, index) => {
				World.character.applyMods(defenders[index], skillProfile.defenderMods);
				
				World.addCommand({
					cmd: 'alert',
					msg: skillProfile.msgToDefender,
					styleClass: 'round'
				},  defenders[index]);
			});
		}
	}
}

// Skills that fire in the Battle loop, that modify the opponent state, must output a Skill Profile Object
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
		defenderRefId: '',
		msgToAttacker: '',
		msgToDefender: '',
		msgToRoom: '',
		winMsg: '',
		skillObj: skillObj
	}
}

Combat.prototype.getDamageText = function(damage, hp) {
	var i = 0;
	var percentOfDmg = parseInt(((damage/hp) * 100), 10);
	var value;
	var dmgProfile;
	var dmgRangePlacement;

	if (percentOfDmg > 100) {
		percentOfDmg = 100;
	}

	for (i; i < this.damage.length; i += 1) {
		dmgProfile = this.damage[i];

		if (percentOfDmg >= dmgProfile.min && percentOfDmg <= dmgProfile.max) {
			if (!Array.isArray(dmgProfile.value)) {
				value = dmgProfile.value;
			} else {
				value = dmgProfile.value[(World.dice.roll(1, dmgProfile.value.length)) - 1];
			}

			dmgRangePlacement = (100 - (dmgProfile.max - damage));

			if (dmgRangePlacement > 96 && dmgProfile.sizeFlare) {
				value = '<strong>' + value.toUpperCase() + '</strong>';
			} else if (dmgRangePlacement > 90 && dmgProfile.sizeFlare) {
				value = value.toUpperCase();
			}

			if (dmgRangePlacement > 95 && dmgProfile.flagFlare) {
				value = '**' + value + '**';
			}

			return value;
		}
	}

	return value;
};

Combat.prototype.getDeathMessages = function(winner, loser, skillProfile) {
	var deathOutput = {
		msgToWinner: '',
		msgToLoser: ''
	};
	var exp = World.dice.calExp(winner, loser);

	loser.fighting = false;
			
	if (exp > 0) {
		winner.exp += exp;

		if (World.dice.roll(1, 3) < 3) {
			deathOutput.msgToWinner += '<div class="victory">You have slain ' +  loser.short + '! You gain <span class="red">'
				+ exp + '</span> experience points!</div>';
		} else {
			deathOutput.msgToWinner += '<div class="victory">You are victorious! ' + World.capitalizeFirstLetter(loser.name) +' has been killed! You earn <span class="green">'
				+ exp + '</span> experience points!</div>';
		}
	} else {
		if (World.dice.roll(1, 2) === 1) {
			deathOutput.msgToWinner += '<div>You won but learned nothing.</div>';
		} else {
			deathOutput.msgToWinner += '<div>You did not learn anything from this battle.</div>';
		}
	}

	if (loser.gold) {
		deathOutput.msgToWinner += ' <span class="yellow">You find ' + loser.gold
			+ ' ' + World.config.coinage  + ' on the corpse.</span>';
	}

	deathOutput.msgToLoser += '<div class="player-death-msg">You died! You will respawn at your Recall point. Make it back to your corpse before it rots to get your gear!</div>';

	return deathOutput;
};

Combat.prototype.getNumberOfBattlePositions = function(battleObj) {
	return Object.keys(battleObj.positions).length;
}

Combat.prototype.getNumberOfOpenBattlePositions = function(battleObj) {
	var result = 0;
	var prop;

	for (prop in battleObj.positions) {
		if (battleObj.positions[prop] !== null 
			&& battleObj.positions[prop].defender.chp > 0 
			&& battleObj.positions[prop].attacker.chp > 0) {
			result += 1;
		}
	}

	return result;
}


Combat.prototype.getBattleByRefId = function(refId) {
	var i = 0,
	battle,
	prop;

	for (i; i < World.battles.length; i += 1) {
		battle = World.battles[i];

		for (prop in battle.positions) {
			if (battle.positions[prop] && (battle.positions[prop].attacker.refId === refId ||
				battle.positions[prop].defender.refId === refId)) {
				return battle;
			}
		}
	}

	return null;
}

Combat.prototype.removeBattle = function(battleObj) {
	var i = 0;

	for (i; i < World.battles.length; i += 1) {
		if (World.battles[i] === battleObj) {
			World.battles[i].attacked = [];
			World.battles[i].skills = {};

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

module.exports = Combat;
