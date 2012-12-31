var Dice = require('./dice').roller;

var Combat = function() {
	this.adjectives = ['barbaric', 'great', 'mighty', 'AWESOME'];
	this.abstractNouns = ['hatred', 'intensity', 'weakness'];
}
/*
General idea behind a hit:
Your Short Sword (proper noun) slices (verb attached to item) a Red Dragon (proper noun) with barbaric (adjective) intensity (abstract noun) (14)
You swing and miss a Red Dragon with barbaric intensity 
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
					msg: 'You begin your attack on ' + monster.short, 
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

Combat.prototype.round = function(s, monster, fn) {
	Dice.roll(1, 20, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4;
		if (total > monster.ac) {
			total = total + 1 + s.player.str/3;
			
			Dice.roll(1, 20, function(total) {
				monster.chp = monster.chp - total;

				s.emit('msg', {
					msg: 'hit',
					styleClass: 'hit'
				});	
				return fn();
			});					
		} else {
			s.emit('msg', {msg: 'miss', styleClass: 'hit'});
		}
	});
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