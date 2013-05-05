var Dice = require('./dice').roller;

var Combat = function() {
	this.adjectives = ['barbaric', 'BARBARIC', 'great', 'GREAT', 'mighty', 'MIGHTY', '**AWESOME**'];
	this.abstractNouns = ['hatred', 'intensity', 'weakness'];
}

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
					msg: 'You begin your attack on ' + monster.short + ' Your HP: ' + s.player.hp + ' MOB HP: ' + monster.chp, 
					styleClass: ''
				});
				
				s.emit('msg', {
					msg: 'You hit ' + monster.short + ' (' + total + ')', 
					styleClass: 'hit'
				});

				return fn(true, monster);
			});					
		} else {
			return s.emit('msg', {msg: 'miss', styleClass: 'hit'});
		}
	});
}

/*
* If begin() was successful then we can move to running this function until the attacker or target hits 0 chps.
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

// Attacker is always at the top of the round
Combat.prototype.attackerRound = function(s, monster, fn) {
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4;
		if (total > monster.ac) {
			total = total + 1 + s.player.str/3;
			
			Dice.roll(1, 20, function(total) {
				monster.chp = monster.chp - total;

				s.emit('msg', {
					msg: 'You hit ' + monster.short.toLowerCase()  + ' hard. Damage: ' + total + ' Opponent HP: ' + monster.chp,
					styleClass: 'hit'
				});	
				
				return fn(s, monster);
			});					
		} else {
			s.emit('msg', {
				msg: 'You miss a ' + monster.short.toLowerCase()  + '.',
				styleClass: 'hit'
			});
		}
	});
}

// Target is at the bottom of the attack block
Combat.prototype.targetRound = function(s, monster, fn) {
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 5;
		if (total > s.player.ac) {
			total = total + 1;
			
			Dice.roll(1, 20, function(total) {
				s.player.chp = s.player.chp - total;

				s.emit('msg', {
					msg: monster.short + ' hits you hard! Damage: ' + total + ' Your HP: ' + s.player.chp,
					styleClass: 'hit'
				});	
				
				return fn(s, monster);
			});					
		} else {
			s.emit('msg', {
				msg: monster.short + ' misses '+ ' you!',
				styleClass: 'hit'
			});
		}
	});
}

Combat.prototype.end = function(s, monster, fn) {

}

Combat.prototype.damageMessage = function(attack, fn) {

}

Combat.prototype.msgToPlayer = function(attack, fn) {

}

Combat.prototype.msgTomonsteronent = function(attack, fn) {

}

Combat.prototype.msgToRoom = function(attack, fn) {

}

module.exports.combat = new Combat();