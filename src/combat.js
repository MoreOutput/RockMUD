'use strict';

var Dice = require('./dice').roller,
Character = require('./character').character,
Room = require('./rooms').room,
Combat = function() {
	this.adjectives = ['barbaric', 'great', 'mighty', 'awesome'];
	this.abstractNouns = ['hatred', 'intensity', 'weakness'];
};

/*
General idea behind a hit:
Your Short Sword (proper noun) slices (verb attached to item) a 
Red Dragon (proper noun) with barbaric (adjective) intensity (abstract noun) (14)
You swing and miss a Red Dragon with barbaric intensity (14)
*/

/*
* Starting combat, begin() much return true and the target node for a fight to continue
* otherwise both parties are left in the state prior.
*/
Combat.prototype.begin = function(s, target, fn) {
	var combat = this;

	s.player.position = 'fighting';
	target.position = 'fighting'; 
	
	Dice.roll(s.player.dex/4, 20, function(total) { // Roll against AC
		var i = 0;

		if (total > target.ac) {
			combat.round(s, target, 0, function(s, damage) {
				return fn(true, target);
			});
		} else {
			return s.emit('msg', {msg: 'You swing and miss ' +  target.short, styleClass: 'player-miss'});
		}
	});
}

/*
* The AC roll for the attacker
*/
Combat.prototype.attackerRound = function(s, target, fn) {
	var combat = this;
	Dice.roll(s.player.dex/4, 20, function(total) { // Roll against AC
		var i = 0;

		if (total > target.ac) {
			combat.round(s, target, 0, function(s, damage) {
				return fn(s, target);
			});
		} else {
			s.emit('msg', {msg: 'You swing and miss ' +  target.short, styleClass: 'player-miss'});
			return fn(s, target);	
		}
	});
}

/*
* The AC roll for the target
*/
Combat.prototype.targetRound = function(s, target, fn) {
	var combat = this;
	Dice.roll(target.dex/4, 20, function(total) { // Roll against AC
		if (total > s.player.ac) {		
			combat.round(target, s, 0, function(s, damage) {
				return fn(s, target);
			});		
		} else {
			s.emit('msg', {
				msg: target.short + ' misses '+ ' you!',
				styleClass: 'foe-miss'
			});
		}
	});
}

Combat.prototype.calXP = function(s, target, fn) {
	if ((target.level) >= (s.player.level - 5)) {
		if (target.level >= s.player.level) {
			Dice.roll(1, 4, 1, function(total) {
				var exp;
				exp = ((target.level - s.player.level) * total) + 1 * (total * 45);
				s.player.exp = exp + s.player.exp;
				return fn( exp );
			});
		} else {
			Dice.roll(1, 4, function(total) {
				return fn(total * 10);
			});
		}
	} else {
		return fn(0);
	}
}

// Calculate the total damage done with a melee hit
Combat.prototype.meleeDamage = function(attacker, opponent, weapon, fn) {
	Dice.roll(1, 20, function(total) {
		total = total + Dice.roll(1, attacker.str/4);
		total = total - Dice.roll(1, opponent.ac/3);

		if (typeof weapon !== 'function') {
			// Passed in weapon
			total += Dice.roll(weapon.diceNum, weapon.diceSides);
			return fn(total, weapon);
		} else {
			// Unarmed Damage
			return weapon(total, weapon);
		}	
	});
}

Combat.prototype.round = function(s, target, mod, fn) {
	var combat = this;
	// Is a player attacking something
	if (s.player) {
		console.log('Character Target Round');
		Character.getWeapons(s.player, function(weapons) {
			var i = 0;
			for (i; i < weapons.length; i += 1) {
				combat.meleeDamage(s.player, target, weapons[i], function(total) {
					s.emit('msg', {
						msg: 'You ' + weapons[i].attackType + ' ' + target.short + '(' + total + ')', 
						styleClass: 'player-hit'
					});

					target.chp = (target.chp - total);

					return fn(s, total);
				});
			}
		});
	} else {
		console.log('MOB Round');
		Character.getWeapons(s, function(weapons) {
			var i = 0;
			for (i; i < weapons.length; i += 1) {
				combat.meleeDamage(s, target.player, weapons[i], function(total) {
					target.player.chp = (target.player.chp - total);
					return fn(target, total);
				});
			}
		});
	}
}

/*
* If begin() was successful then we can move to running this function until:
* 1) attacker or target hits 0 chps.
* 2) a skill or command ends the battle -- flee for example
* 3) the target or attacker changes postions to sleeping, or 'prone'
* Each player gets one round of attacks against their target
*/
Combat.prototype.fight = function(s, target, fn) {
	var combat = this;
	combat.attackerRound(s, target, function(s, target) {	
		if (target.chp > 0) {
			combat.targetRound(s, target, function(s, target) {
				return fn(true);
			});
		} else {
			return fn(false);
		}
	});
}

module.exports.combat = new Combat();