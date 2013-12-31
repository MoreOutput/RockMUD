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
	var i = 0;

	s.player.position = 'fighting';
	monster.position = 'fighting';
	
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4;
		
		if (total > monster.ac) {
			total = total + 1 + s.player.str/3;
			
			Dice.roll(1, 20, function(total) {
				monster.chp = monster.chp - total;
				
				s.emit('msg', {
					msg: 'You hit ' + monster.short + ' (' + total + ')', 
					styleClass: 'player-hit'
				});

				return fn(true, monster);
			});					
		} else {
			return s.emit('msg', {msg: 'You swing and miss.', styleClass: 'player-miss'});
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
	Dice.roll(1, 10, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4 - s.player.wait;
		if (total > monster.ac) {
			Dice.roll(1, 20, function(total) {
				total = (total + 1 + s.player.str/1.5) - monster.ac / 2;
				
				monster.chp = monster.chp - total;

				s.emit('msg', {
					msg: 'You hit ' + monster.short.toLowerCase()  + ' hard. (' + total + ') Opponent HP: ' + monster.chp,
					styleClass: 'player-hit'
				});	
				
				return fn(s, monster);
			});					
		} else {
			s.emit('msg', {
				msg: 'You miss a ' + monster.short.toLowerCase()  + '.',
				styleClass: 'player-hit'
			});
		}
	});
}

/*
* The round for the entity being attacked, the Target
* Target is always at the bottom of the round
*/
Combat.prototype.targetRound = function(s, monster, fn) {
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 5;
		if (total > s.player.ac) {			
			Dice.roll(1, 20, function(total) {
				total = (total + monster.level + monster.minAtk + 1) - (s.player.ac / 2);
				s.player.chp = s.player.chp - total ;

				s.emit('msg', {
					msg: monster.short + ' hits you hard! Damage: ' + total + ' Your HP: ' + s.player.chp,
					styleClass: 'foe-hit'
				});	
				
				return fn(s, monster);
			});					
		} else {
			s.emit('msg', {
				msg: monster.short + ' misses '+ ' you!',
				styleClass: 'foe-miss'
			});
		}
	});
}

/* End combat and reward XP and any gold on the monster */
Combat.prototype.end = function(s, monster, fn) {

}

Combat.prototype.damageMessage = function(attack, fn) {

}

module.exports.combat = new Combat();