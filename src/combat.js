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

	Character.getWeaponSlots(attacker, function(weaponSlots) {
		var attackerMods = World.dice.getMods(attacker),
		opponentMods = World.dice.getMods(opponent),
		i = 0,
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
					// Total amounts of hits in the round
					var numOfAttacks = (attacker.hitRoll - opponent.level) + attackerMods.dex,
					j = 0;

					if (numOfAttacks < 0) {
						numOfAttacks = 0;
					}

					if (attackerRoll > opponentRoll) {
						numOfAttacks += 1;
					}

					if (attackerMods.str > opponentMods.str) {
						if (World.dice.roll(1, 20) > 8) {
							numOfAttacks += 1;
						}
					}

					if (attackerMods.dex > opponentMods.dex) {
						if (World.dice.roll(1, 20) > 12) {
							numOfAttacks += 1;
						}
					}
					
					for (j; j < numOfAttacks; j += 1) {

						// Roll damage per hit
						World.dice.roll(weapon.diceNum + attackerMods.str, weapon.diceSides, attackerMods.str, function(damage) {
							damage = Math.round(damage + (attacker.damRoll/4) );
							damage -= opponent.ac;

							if (attackerMods.str > 2) {
								damage += 1;
							}

							if (damage < 0) {
								damage = 0;
							}

							World.msgPlayer(attacker, {
								msg: 'You ' + weapon.attackType + ' ' + opponent.short + ' <span class="red">(' + damage + ')</span>',
								noPrompt: true,
								styleClass: 'player-hit grey'
							});
							
							World.msgPlayer(opponent, {
								msg: attacker.short + ' hits you with some intensity <span class="red">(' + damage + ')</span>',
								noPrompt: true,
								styleClass: 'player-hit yellow'
							});
							
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
							opponent.chp -= damage;
						});
					}

					return fn(attacker, opponent, roomObj);
				});
			});
		}
	});
};

module.exports.combat = new Combat();
