'use strict';
var World = require('./world'),
Character = require('./character'),
Room = require('./rooms'),
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

Combat.prototype.getNumberOfAttacks = function(attacker, weapon, attackerMods, opponentMods) {
	var numOfAttacks = 0,
	secondAttackSkill = Character.getSkillById(attacker, 'secondAttack');

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


Combat.prototype.attack = function(attacker, opponent, roomObj, fn) {
	if (!Character) {
		Character = require('./character');
	}

	var combat = this,
	weaponSlots,
	shieldSlots,
	attackerMods = World.dice.getMods(attacker),
	opponentMods = World.dice.getMods(opponent),
	numOfAttacks,
	shieldBlockSkill = Character.getSkillById(opponent, 'shieldBlock'),
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
	attackerCanSee = Character.canSee(attacker, roomObj),
	opponentCanSee = Character.canSee(opponent, roomObj);

	if (hitRoll < 0) {
		hitRoll = attacker.level;
	}

	if (damRoll < 0) {
		damRoll = attacker.level;
	}

	if (attacker.wait > 0) { 
		attacker.wait -= 1;
	} else {
		attacker.wait = 0;
	}

	if (attacker.position === 'fighting') {
		weaponSlots = Character.getWeaponSlots(attacker);

		if (opponent.position === 'fighting') {
			shieldSlots = Character.getSlotsWithShields(opponent);

			if (shieldSlots.length > 0) {
				shield = shieldSlots[0].item;
			}
		}

		for (i; i < weaponSlots.length; i += 1) {
			if (weaponSlots[i].item) {
				weapon = Character.getItemByRefId(attacker, weaponSlots[i].item);
			} else {
				weapon = Character.getFist(attacker);
			}

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

					if (opponent.vulnerableTo && opponent.vulnerableTo.toString().indexOf(weapon.attackType) !== -1) {
						damage += World.dice.roll(1, 4 + weapon.level);
					}

					if (opponent.resistantTo && opponent.resistantTo.toString().indexOf(weapon.attackType) !== -1) {
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
};

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

Combat.prototype.processFight = function(player, opponent, roomObj) {
	var combat = this,
	oppStatus,
	playerStatus,
	msgForPlayer,
	msgForOpponent;

	if (!Character) {
		Character = require('./character');
	}

	opponent.position = 'fighting';

	if (!opponent.opponent) {
		opponent.opponent = player;
	}

	player.position = 'fighting';

	if (!player.opponent) {
		player.opponent = opponent;
	}

	if (player.group.length) {
		let i = 0;

		for (i; i < player.group.length; i += 1) {
			let grMate = player.group[i];

			if (!grMate.opponent) {
				grMate.opponent = player.opponent;
			}
		}
	}

	if (opponent.group.length) {
		let i = 0;

		for (i; i < opponent.group.length; i += 1) {
			let grMate = opponent.group[i];

			if (!grMate.opponent) {
				grMate.opponent = player;
			}
		}
	}

	let combatObj = {
		attackers:  Character.getAllAttackers(player.opponent, roomObj),
		opponents:  Character.getAllAttackers(player, roomObj),
		initiator: player,
		rounds: 1
	};

	/*
		Every attacker gets a chance at at least one hit (meaning a chance to beat ac/dodge).
		Theres a reduced chance of hit for grouped members that are not tanking.

		If you are being attacked by more than one person you get an evasion penalty
	*/

	let i = 0;

	for (i; i < attackers.length; i += 1) {
		let attacker = attackers[i];
		let opp = attacker.opponent;

		let msgForPlayer = '';
		let msgForOpponent = '';

		combat.attack(attacker, opp, roomObj, function(attacker, opp, roomObj, msgForAttacker, msgForOpp, attackerCanSee) {
			msgForPlayer += msgForAttacker;
			msgForOpponent += msgForOpp;

			if (i === attackers.length - 1) {
				var oppStatus = Character.getStatusReport(player.opponent),
				playerStatus = Character.getStatusReport(opponent.opponent),
				preventPrompt = false,
				combatInterval;

				player.wait += 1;

				if (opponent.chp > 0) {
					if (!opponent.isPlayer) {
						msgForPlayer += '<div class="rnd-status">' + player.opponent.capitalShort + ' ' + oppStatus.msg + '</div>';
					} else {
						msgForPlayer += '<div class="rnd-status">' + player.opponent.displayName + ' ' + oppStatus.msg + '</div>';
					}
				} else {
					if (!opponent.isPlayer) {
						if (attackerCanSee) {	
							msgForPlayer += '<div class="rnd-status">You <strong class="red">decapitate ' 
								+ opponent.short + '</strong>.</div>';
						}
					} else {
						if (attackerCanSee) {
							msgForPlayer += '<div class="rnd-status">You run <strong>' 
								+ opponent.displayName + ' through, killing them</strong>.</div>';
						}
					}
				}

				if (opponent.isPlayer) {
					msgForOpponent += '<div class="rnd-status">' + player.displayName + ' ' + playerStatus.msg + '</div>';
				}

				if (player.chp <= 0 || opponent.chp <= 0) {
					preventPrompt = true;
				}

				World.addCommand({
					cmd: 'alert',
					msg: msgForPlayer,
					noPrompt: preventPrompt,
					styleClass: 'player-hit warning'
				}, player);

				World.addCommand({
					cmd: 'alert',
					msg: msgForOpponent,
					noPrompt: preventPrompt,
					styleClass: 'player-hit warning'
				}, opponent);

				if (player.opponent.chp <= 0) {
					combat.processEndOfCombat(null, player, attackers, opponents, roomObj);
				}
			}
		});
	}
};

Combat.prototype.processEndOfCombat = function(combatInterval, player, attackers, opponent, roomObj)  {
	var exp = 0,
	corpse,
	endOfCombatMsg = '',
	respawnRoom;

	if (combatInterval) {
		clearInterval(combatInterval);
	}

	if (mob.chp <= 0) {
		mob.opponent = null;
		mob.killedBy = player.name;

		player.opponent = null;
		player.position = 'standing';

		World.processEvents('onDeath', roomObj, mob, player);
		World.processEvents('onDeath', mob, roomObj, player);
		World.processEvents('onVictory', player, roomObj, mob);

		corpse = Character.createCorpse(mob);

		if (!mob.isPlayer) {
			Room.removeMob(roomObj, mob);
		} else {
			respawnRoom = World.getRoomObject(mob.recall.area, mob.recall.roomid);

			Room.removePlayer(roomObj, mob);

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
				msg: '<strong>You died! Make it back to your corpse before it rots to save your gear!</strong>',
				styleClass: 'error'
			}, mob);

			Character.save(mob);
		}

		exp = World.dice.calExp(player, mob);

		Room.addItem(roomObj, corpse);

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
		
		if (player.wait > 0) {
			player.wait -= 1;
		} else {
			player.wait = 0;
		}

		player.killed += 1;

		if (player.exp >= player.expToLevel) {
			World.addCommand({
				cmd: 'alert',
				msg: endOfCombatMsg,
				noPrompt: true,
				styleClass: 'victory'
			}, player);

			Character.level(player);
		} else {
			World.addCommand({
				cmd: 'alert',
				msg: endOfCombatMsg,
				styleClass: 'victory'
			}, player);

			Character.save(player);
		}
	}
};

Combat.prototype.round = function(combatInterval, player, attackers, opponents, roomObj) {
	var combat = this;

	let i = 0;

	for (i; i < attackers.length; i += 1) {
		let attacker = attackers[i];
		let opp = attacker.opponent;

		if (attacker.opponent && attacker.area === opp.area && attacker.roomid === opp.roomid) {
			combat.attack(attacker, attacker.opponent, roomObj, function(player, opponent, roomObj, attackerAttackString, oppDefString, attackerCanSee) {
				combat.attack(opponent, opponent.opponent, roomObj, function(opponent, player, roomObj, oppAttackString, attackerDefString, oppCanSee) {
					var oppStatus = Character.getStatusReport(opponent),
					playerStatus= Character.getStatusReport(player),
					preventPrompt = false,
					msgForPlayer = attackerAttackString + attackerDefString,
					msgForOpponent = oppAttackString + oppDefString;

					if (player.isPlayer) {
						if (opponent.chp > 0) {
							if (!player.canViewHp) {
								msgForPlayer += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
								+ '</div>';
							} else {
								msgForPlayer += '<div class="rnd-status">' + opponent.capitalShort + oppStatus.msg
									+ ' (' + opponent.chp + '/' + opponent.hp +')</div>';
							}
						} else {
							msgForPlayer += '<div class="rnd-status">You deliver a powerful <strong class="red">final blow to '
								+ opponent.short + '</strong>!</div>';
						}
					}

					if (opponent.isPlayer) {
						if (!opponent.canViewHp) {
							msgForOpponent += '<div class="rnd-status">' + opponent.capitalShort + playerStatus.msg
								+ '</div>';
						} else {
							msgForOpponent += '<div class="rnd-status">' + player.capitalShort + playerStatus.msg
								+ ' (' + player.chp + '/' + player.hp +')</div>';
						}
					}

					if (opponent.chp <= 0 || player.chp <= 0) {
						preventPrompt = true;
					}

					World.addCommand({
						cmd: 'alert',
						msg: msgForPlayer,
						noPrompt: preventPrompt,
						styleClass: 'player-hit warning'
					}, player);

					World.addCommand({
						cmd: 'alert',
						msg: msgForOpponent,
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

						clearInterval(combatInterval);
					} else {
						if (opponent.chp <= 0) {
							combat.processEndOfCombat(combatInterval, player, player, opponent, roomObj);
						} else if (player.chp <= 0) {
							combat.processEndOfCombat(combatInterval, player, opponent, player, roomObj);
						} else {
							World.prompt(player);
							World.prompt(opponent);
						}
					}
				});
			});
		} else {
			this.processEndOfCombat(combatInterval, attacker, opp, roomObj);
		}
	}
};

module.exports = new Combat();
