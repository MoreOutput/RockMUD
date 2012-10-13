var Combat = function() {
	
}

Combat.prototype.firstRound = function(s, player2, fn) {
	var i  = 0;
	Dice.roller(1, 20, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4;
		
		if (total > player2.ac) {
			total = total + 1 + s.player.str/3;
			
			Dice.roller(1, 20, function(total) {
				player2.chp = player2.chp - total;
				
				s.emit('msg', {
					msg: 'hit', 
					styleClass: 'hit'
				});

				return fn(player2);
			});					
		} else {
			return s.emit('msg', {msg: 'miss', styleClass: 'hit'});
		}
	});
}

Combat.prototype.nextRound = function(s, player2, fn) {
	Dice.roller(1, 20, function(total) { // Roll against AC
		total = total + 1 + s.player.dex/4;
		if (total > player2.ac) {
			total = total + 1 + s.player.str/3;
			
			Dice.roller(1, 20, function(total) {
				player2.chp = player2.chp - total;

				s.emit('msg', {
					msg: 'hit',
					styleClass: 'hit'
				});	
				
				Combat.msgToPlayer('', function() {
					s.emit('msg', {msg: attack, styleClass: 'error'});	
					
					Combat.msgToOpponent('', function() {
						s.emit('msg', {msg: attack, styleClass: 'error'});						
							
						Combat.msgToRoom('', function() {
							s.emit('msg', {msg: attack, styleClass: 'error'});
							
						});
					});
				});
				
				
				return fn(player2);
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

Combat.prototype.msgToOpponent = function(attack, fn) {

}

Combat.prototype.msgToRoom = function(attack, fn) {

}

module.exports.combat = new Combat();