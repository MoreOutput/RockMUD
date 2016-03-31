'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
Combat = function() {
	this.adjective = [
		{value: 'weak', damage: 5},
		{value: 'some', damage: 10},
		{value: 'maiming', damage: 20},
		{value: 'MAIMING', damage: 25},
		{value: '*MAIMING*', damage: 30},
		{value: 'great', damage: 40},
		{value: 'devestating', damage: 50},
		{value: 'DEVESTATING', damage: 60}
	];

	this.abstractNouns = ['intensity', 'force', 'strength', 'power'];
};

/*
General idea behind a hit:
Your Short Sword (proper noun) slices (verb attached to item) a 
Red Dragon (proper noun) with barbaric (adjective) intensity (abstract noun) (14)
You swing and miss a Red Dragon with barbaric intensity (14)
*/

/*
* Starting combat, begin() much return true and the target node for a fight to continue
* otherwise both parties are left in the state prior. Beginning combat does not add Wait.
*/

Combat.prototype.getNumberOfAttacks = function(attacker, weapon, attackerMods, opponentMods) {
	var numOfAttacks = Math.round((attacker.hitRoll/5 + attacker.level/20) + attackerMods.dex/4);

	if (numOfAttacks <= 0) {
		numOfAttacks = 1;
	}

	if (weapon.modifiers && weapon.modifiers.numOfAttacks) {
		numOfAttacks += weapon.modifiers.numOfAttacks;
	}

	if (attacker.knowledge > opponentMods.str && World.dice.roll(1, 2) === 1) {
		numOfAttacks += 1;
	}

	if (numOfAttacks <= 3 && attackerMods.str > opponentMods.dex) {
		if (World.dice.roll(1, 2) === 2) {
			numOfAttacks += 1;
		}
	}

	if (numOfAttacks <= 3 && attackerMods.dex > opponentMods.dex) {
		if (World.dice.roll(1, 2) === 2) {
			numOfAttacks += 1;
		}
	}

	if (numOfAttacks === 1 && World.dice.roll(1, 4) === 4) {
		numOfAttacks = 2;
	}

	return numOfAttacks;
};

Combat.prototype.attack = function(attacker, opponent, roomObj, fn) {
	var combat = this,
	weaponSlots,
	attackerMods = World.dice.getMods(attacker),
	opponentMods = World.dice.getMods(opponent),
	attackerRoll,
	opponentRoll,
	numOfAttacks,
	i = 0,
	j = 0,
	msgForAttacker = '',
	msgForOpponent = '',
	roomRoundTxt = '',
	damage = 0,
	dodged = false,
	blocked = false,
	weapon;

	// Is a player attacking something
	if (attacker.wait > 0) { 
		attacker.wait -= 1;
	} else {
		attacker.wait = 0;
	}

	if (attacker.position === 'fighting') {
		weaponSlots = Character.getSlotsWithWeapons(attacker);

		if (!weaponSlots.length) {
			weaponSlots = [{
				name: 'Right Hand',
				item: {
					name: 'Fighting with your bare hands!',
					level: attacker.level,
					diceNum: attacker.diceNum,
					diceSides: attacker.diceSides,
					itemType: 'weapon',
					equipped: true,
					attackType: attacker.attackType,
					material: 'flesh',
					modifiers: {},
					diceMod: 0
				},
				dual: false,
				slot: 'hands'
			}]
		}

		for (i; i < weaponSlots.length; i += 1) {
			weapon = weaponSlots[i].item;

			attackerRoll =  World.dice.roll(1, 20, (attackerMods.dex - opponent.meleeRes));
			opponentRoll = World.dice.roll(1, 20, (opponent.ac + (opponentMods.dex - attacker.knowledge)));
			numOfAttacks = combat.getNumberOfAttacks(attacker, weapon, attackerMods, opponentMods);

			if (numOfAttacks) {
				j = 0;

				for (j; j < numOfAttacks; j += 1) {
					damage = (World.dice.roll(weapon.diceNum, weapon.diceSides, attackerMods.str + weapon.diceMod)) +
						(damage + (attacker.damRoll/2) + (attacker.level/3) + attackerMods.str + attacker.str/3);

					if (attackerMods.str >= opponentMods.con) {
						damage += attackerMods.str/2;
					}

					if (attackerMods.str > 2) {
						damage += attackerMods.str;
					}

					if (attacker.damRoll > opponent.meleeRes) {
						damage += attackerMods.str;
					} else if (attacker.damRoll > opponent.meleeRes) {
						damage -= opponent.meleeRes/2
					}

					damage -= opponent.ac/3;

					if (numOfAttacks > 3 && j > 3) {
						damage =damage / 2;
					}

					if (attackerRoll === 20) {
						damage = damage * 2;
					}

					if (damage < 0) {
						damage = 0;
					} else {
						damage = Math.round(damage);
					}

					var adjective = combat.getDamageAdjective(damage);
					var abstractNoun = combat.abstractNouns[World.dice.roll(1, combat.abstractNouns.length) - 1];

					opponent.chp -= damage;

					if (attacker.isPlayer) {
						msgForAttacker +=  '<div>You ' + weapon.attackType + ' a ' + opponent.displayName 
							+ ' with ' + adjective + ' ' + abstractNoun + ' <span class="red">(' + damage + ')</span></div>';
					}

					if (opponent.isPlayer) {
						msgForOpponent +=  '<div>' + attacker.displayName + 's ' + weapon.attackType 
							+ ' hits you with ' + adjective + ' ' + abstractNoun + ' <span class="red">(' + damage + ')</span></div>';
					}
				}
			} else {
				if (attacker.isPlayer) {
					msgForAttacker +=  '<div class="grey">Your ' + weapon.attackType + ' misses a ' + opponent.displayName + '</div>';
				}

				if (opponent.isPlayer) {
					msgForOpponent +=  '<div class="grey">' + attacker.displayName + ' tries to ' + weapon.attackType + ' you and misses! </div>';
				}
			}

			return fn(attacker, opponent, roomObj, msgForAttacker, msgForOpponent);
		}
	}
};

Combat.prototype.getDamageAdjective = function(damage) {
	var i = 0;

	for (i; i < this.adjective.length; i += 1) {
		if (this.adjective[i].damage >= damage ) {
			return this.adjective[i].value;
		}
	}

	return this.adjective[1].value;
};

Combat.prototype.processFight = function(player, opponent, roomObj, fn) {
	var combat = this,
	oppStatus,
	playerStatus,
	msgForPlayer,
	msgForOpponent;

	opponent.position = 'fighting';
	player.position = 'fighting';

	opponent.opponent = player;
	player.opponent = opponent;

	World.msgPlayer(player, {
		msg: 'You scream and charge at a ' + opponent.name,
		noPrompt: true
	});

	World.msgPlayer(opponent, {
		msg: 'A ' + player.displayName + ' screams and charges at you!',
		noPrompt: true
	});

	combat.attack(player, opponent, roomObj, function(player, opponent, roomObj, msgForPlayer, msgForOpponent) {
		var oppStatus = Character.getStatusReport(opponent),
		playerStatus = Character.getStatusReport(player),
		combatInterval;

		player.wait += 1;

		if (player.isPlayer) {
			msgForPlayer += '<div class="rnd-status">A ' + opponent.name + oppStatus.msg + ' (' + opponent.chp + '/' + opponent.hp +')</div>';
		}

		if (opponent.isPlayer) {
			msgForOpponent += '<div class="rnd-status">A ' + player.name + playerStatus.msg + ' (' + player.chp + '/' + player.hp +')</div>';
		}

		World.msgPlayer(player, {
			msg: msgForPlayer,
			styleClass: 'player-hit yellow'
		});

		World.msgPlayer(opponent, {
			msg: msgForOpponent,
			styleClass: 'player-hit yellow'
		});

		if (opponent.chp > 0) {
			combatInterval = setInterval(function() {
				combat.round(combatInterval, player, opponent, roomObj);
			}, 1900);
		}
	});
};

Combat.prototype.processEndOfMobCombat = function(combatInterval, player, opponent, roomObj)  {
	var exp = 0,
	corpse,
	endOfCombatMsg = '';

	clearInterval(combatInterval);

	opponent.position = 'dead';
	opponent.opponent = null;
	opponent.killedBy = player.name;

	player.opponent = null;
	player.position = 'standing';

	// Until dead is in if a player dies we reset
	if (opponent.position === 'dead' && opponent.isPlayer) {
		opponent.position = 'standing';
		opponent.chp = opponent.hp;

		World.msgPlayer(player, {msg: 'At the moment player death is impossible', styleClass: 'red'});
	}

	roomObj = Room.removeMob(roomObj, opponent);

	exp = World.dice.calExp(player, opponent);

	corpse = Character.createCorpse(opponent);

	roomObj = Room.addCorpse(roomObj, opponent);

	player.position = 'standing';
	
	if (exp > 0) {
		player.exp += exp;
		endOfCombatMsg = 'You won the fight! You learn some things, resulting in ' + exp + ' experience points.';
	} else {
		endOfCombatMsg ='You won but learned nothing.';
	}

	if (opponent.gold) {
		player.gold += opponent.gold;
		endOfCombatMsg += ' <span class="yellow">You find ' + opponent.gold + ' coins on the corpse.</span>';
	}
	
	if (player.wait > 0) {
		player.wait -= 1;
	} else {
		player.wait = 0;
	}

	return World.msgPlayer(player, {msg: endOfCombatMsg, styleClass: 'victory'});
};

Combat.prototype.round = function(combatInterval, player, opponent, roomObj, fn) {
	var combat = this;

	combat.attack(player, opponent, roomObj, function(player, opponent, roomObj, msgForPlayer, msgForOpponent) {
		combat.attack(opponent, player, roomObj, function(opponent, player, roomObj, msgForOpponent2, msgForPlayer2) {
			var oppStatus = Character.getStatusReport(opponent),
			playerStatus= Character.getStatusReport(player);

			msgForPlayer += msgForPlayer2;
			msgForOpponent += msgForOpponent2;

			if (player.isPlayer) {
				msgForPlayer += '<div class="rnd-status">A ' + opponent.name + oppStatus.msg + ' (' + opponent.chp + '/' + opponent.hp +')</div>';
			}

			if (opponent.isPlayer) {
				msgForOpponent += '<div class="rnd-status">A ' + player.name + playerStatus.msg + ' (' + player.chp + '/' + player.hp +')</div>';
			}

			World.msgPlayer(player, {
				msg: msgForPlayer,
				noPrompt: true,
				styleClass: 'player-hit yellow'
			});

			World.msgPlayer(opponent, {
				msg: msgForOpponent,
				noPrompt: true,
				styleClass: 'player-hit yellow'
			});

			if (player.position !== 'fighting' || opponent.position !== 'fighting') {
				World.prompt(player);
				World.prompt(opponent);
				clearInterval(combatInterval);
			} else {
				if (opponent.chp <= 0 && !opponent.isPlayer) {
					combat.processEndOfMobCombat(combatInterval, player, opponent, roomObj);
				} else if (player.chp <= 0 && !player.isPlayer) {
					combat.processEndOfMobCombat(combatInterval, opponent, player, roomObj);
				} else if (player.isPlayer && player.chp <= 0 || opponent.isPlayer && opponent.chp <= 0) {
					clearInterval(combatInterval);
					// Player Death
					opponent.position = 'standing';
					opponent.chp = opponent.hp;
					opponent.opponent = null;

					player.position = 'standing';
					player.chp = player.hp;
					player.opponent = null;

					World.msgPlayer(player, {msg: 'You should be dead, but since this is unfinished we will just reset everything.', styleClass: 'victory'});
					World.msgPlayer(opponent, {msg: 'You should be dead, but since this is unfinished we will just reset everything.', styleClass: 'victory'});
				} else {
					World.prompt(player);
					World.prompt(opponent);
				}
			}
		});
	});
}

module.exports.combat = new Combat();
