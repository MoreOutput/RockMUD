"use strict";

var Dice = require('./dice').roller,

Combat = function() {
	this.adjectives = ['barbaric', 'BARBARIC', 'great', 'GREAT', 'mighty', 'MIGHTY', 'AWESOME'];
	this.abstractNouns = ['hatred', 'intensity', 'weakness'];
};

/*
General idea behind a hit:
Your Short Sword (proper noun) slices (verb attached to item) a Red Dragon (proper noun) with barbaric (adjective) intensity (abstract noun) (14)
You swing and miss a Red Dragon with barbaric intensity (14)
*/
Combat.prototype.begin = function(s, monster, fn) {
	var combat = this;

	s.player.position = 'fighting';
	monster.position = 'fighting'; 
	
	Dice.roll(1, 20, function(total) { // Roll against AC
		var i = 0;
		total = total + 1 + s.player.dex/4;

		if (total > monster.ac) {
			if (s.player.eq.hands.length !== 0) {
				for (i; i < s.player.eq.hands.length; i += 1) {
					if (s.player.eq.hands[i].item !== null && s.player.eq.hands[i].item.itemType === 'weapon') {
						combat.meleeDamage(s.player, monster, s.player.eq.hands[i].item, function(total, weapon) {
							s.emit('msg', {
								msg: 'You ' + weapon.attackType + ' ' + monster.short + '(' + total + ')', 
								styleClass: 'player-hit'
							});
						});
					}
				}

				return fn(true, monster);	
			} else {
				// Unarmed
			}		
		} else {
			return s.emit('msg', {msg: 'You swing and miss ' +  monster.short, styleClass: 'player-miss'});
		}
	});
}

/*
* If begin() was successful then we can move to running this function until:
* 1) attacker or target hits 0 chps.
* 2) a skill or command ends the battle -- flee for example
* 3) the target or attacker changes postions to sleeping, or 'prone'
* Each player gets one round of attacks against their target
*/
Combat.prototype.round = function(s, monster, fn) {
	var combat = this;
	combat.attackerRound(s, monster, function(s, monster) {		
		if (monster.chp > 0) {
			combat.targetRound(s, monster, function(s, monster) {
				return fn();
			});
		} else {
			return fn();
		}
	});
}

/*
* The round for the entity issuing the kill command, the Attacker 
* Attacker is always at the top of the round
*/
Combat.prototype.attackerRound = function(s, monster, fn) {
	var combat = this;
	Dice.roll(1, 20, function(total) { // Roll against AC
		var i = 0;
		total = total + 1 + s.player.dex/4;

		if (total > monster.ac) {
			if (s.player.eq.hands.length !== 0) {
				for (i; i < s.player.eq.hands.length; i += 1) {
					if (s.player.eq.hands[i].item !== null && s.player.eq.hands[i].item.itemType === 'weapon') {
						combat.meleeDamage(s.player, monster, s.player.eq.hands[i].item, function(total, weapon) {
							monster.chp = (monster.chp - total);
							s.emit('msg', {
								msg: 'You ' + weapon.attackType + ' ' + monster.short + '(' + total + ')', 
								styleClass: 'player-hit'
							});
						});
					}
				}

				return fn(s, monster);	
			} else {
				// Unarmed
			}		
		} else {
			s.emit('msg', {msg: 'You swing and miss ' +  monster.short, styleClass: 'player-miss'});

			return fn(s, monster);	
		}
	});
}

/*
* The round for the entity being attacked, the Target
* Target is always at the bottom of the round
*/
Combat.prototype.targetRound = function(s, monster, fn) {
	var combat = this;
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 5;
		if (total > s.player.ac) {		
			combat.meleeDamage(monster, s.player, {diceNum: monster.diceNum, diceSides: monster.diceSides}, function(total, weapon) {
				s.player.chp = (s.player.chp - total);
				s.emit('msg', {
					msg: monster.short + ' ' + monster.attackType + 's you hard! (' + total + ')',
					styleClass: 'foe-hit'
				});	
				
				return fn(s, monster);
			});
			/*	
			Dice.roll(1, 20, function(total) {
				total = (total + monster.level + Dice.roll(monster.diceNum, monster.diceSides)) - (s.player.ac / 2) + (s.monster - s.player.level);
				s.player.chp = s.player.chp - total;
 
				s.emit('msg', {
					msg: monster.short + ' ' + monster.attackType + ' you hard! (' + total + ')',
					styleClass: 'foe-hit'
				});	
				
				return fn(s, monster);
			});		
			*/			
		} else {
			s.emit('msg', {
				msg: monster.short + ' misses '+ ' you!',
				styleClass: 'foe-miss'
			});
		}
	});
}

Combat.prototype.calXP = function(s, monster, fn) {
	if ((monster.level) >= (s.player.level - 5)) {
		if (monster.level >= s.player.level) {
			Dice.roll(1, 4, function(total) {
				var exp,
				total = total + 1;

				exp = ((monster.level - s.player.level) * total) + 1 * (total * 45);

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
		total = (total + 1 + attacker.str/2);
		total = total - (opponent.ac/3);

		if (typeof weapon !== 'function') {
			total += Dice.roll(weapon.diceNum, weapon.diceSides);

			return fn(Math.round(total), weapon);
		} else {
			return fn(Math.round(total), weapon);
		}	
	});
}

module.exports.combat = new Combat();