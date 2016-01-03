'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
Combat = function() {
	/*
	fs.readFile('./templates/messages/combat.json', function (err, r) {
		world.combatMessages = JSON.parse(r);
	});
	*/	
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

Combat.prototype.round = function(attacker, opponent, roomObj, fn) {
	var combat = this;

	// Is a player attacking something
	if (attacker.wait > 0) { 
		attacker.wait -= 1;
	} else {
		attacker.wait = 0;
	}

	Character.getSlotsWithWeapons(attacker, function(weaponSlots) {
		var attackerMods = World.dice.getMods(attacker),
		opponentMods = World.dice.getMods(opponent),
		i = 0,
		attackerRoundTxt = '',
		opponentRoundTxt = '',
		roomRoundTxt = '',
		weapon;

		//Character.getShield(opponent, function(shield) {

		//});

		if (!weaponSlots.length) {
			weaponSlots = [{
				name: 'Right Hand',
				item: {
					name: 'Fists',
					level: attacker.level,
					diceNum: attacker.diceNum,
					diceSides: attacker.diceSides,
					itemType: 'weapon',
					equipped: true,
					attackType: attacker.attackType,
					material: 'flesh'
				},
				dual: false,
				slot: 'hands'
			}]
		}

		for (i; i < weaponSlots.length; i += 1) {
			weapon = weaponSlots[i].item;

			World.dice.roll(1, 20, (attackerMods.dex - opponent.meleeRes), function(attackerRoll) {
				World.dice.roll(1, 20, (opponent.ac + (opponentMods.dex - attacker.knowledge)), function(opponentRoll) {
					var numOfAttacks = Math.round((attacker.hitRoll/5 + attacker.level/20) + attackerMods.dex/4),
					j = 0;

					if (numOfAttacks < 0) {
						numOfAttacks = 0;
					}

					if (attackerRoll > opponentRoll) {
						numOfAttacks += 1;
					}

					if (numOfAttacks <= 3 && attackerMods.str > opponentMods.str) {
						if (World.dice.roll(1, 2) === 2) {
							numOfAttacks += 1;
						}
					}

					if (numOfAttacks <= 3 && attackerMods.dex > opponentMods.dex) {
						if (World.dice.roll(1, 2) === 2) {
							numOfAttacks += 1;
						}
					}

					console.log(attacker.name, numOfAttacks, attackerMods, attacker.str);

					if (numOfAttacks) {
						for (j; j < numOfAttacks; j += 1) {
							World.dice.roll(weapon.diceNum, weapon.diceSides, attackerMods.str, function(damage) {
								damage = Math.round(damage + (attacker.damRoll/2) + (attacker.level) );
								damage -= opponent.ac;

								if (attackerMods.str > opponentMods.con) {
									damage += 5;
								}

								if (attackerMods.str > 2) {
									damage += attackerMods.str;
								}

								if (damage < 0) {
									damage = 0;
								}

								if (attacker.isPlayer) {
									attackerRoundTxt +=  '<div>You ' + weapon.attackType + ' a ' + opponent.displayName + ' <span class="red">(' + damage + ')</span></div>';
								}

								if (opponent.isPlayer) {
									opponentRoundTxt +=  '<div>' + attacker.displayName + ' ' + weapon.attackType + 's you with some intensity <span class="red">(' + damage + ')</span></div>';
								}

								opponent.chp -= damage;
							});
						}
					} else {
						if (attacker.isPlayer) {
							attackerRoundTxt +=  '<div>Your ' + weapon.attackType + ' misses a ' + opponent.displayName + '</div>';
						}

						if (opponent.isPlayer) {
							opponentRoundTxt +=  '<div>' + attacker.displayName + ' ' + weapon.attackType + 's misses you! </div>';
						}
					}

					if (attackerRoundTxt) {
						World.msgPlayer(attacker, {
							msg: attackerRoundTxt,
							noPrompt: true,
							styleClass: 'player-hit grey'
						});
					}
					
					if (opponentRoundTxt) {
						World.msgPlayer(opponent, {
							msg: opponentRoundTxt,
							noPrompt: true,
							styleClass: 'player-hit yellow'
						});
					}
					
					/*
					TODO: array for player name
					if (roomObj.playersInRoom.length > 0) {
						World.dice.roll(1, 10, function(total) {
							if (total > 8) {
								World.msgRoom(roomObj, {
									msg: 'You can hear nothin over the hectic sounds of fighting.',
									styleClass: 'player-hit-room grey',
									playerName: attacker.name
								});
							}
						});
					}
					*/

					return fn(attacker, opponent, roomObj);
				});
			});
		}
	});
};

module.exports.combat = new Combat();
