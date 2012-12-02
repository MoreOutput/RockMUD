var Dice = require('./dice').roller,
Character = require('./character').character,
Combat = require('./combat').combat,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas;

var Skill = function() {
	this.perms = ['admin'];
}

// For attacking in-game monsters
Skill.prototype.kill = function(r, s) {
	Room.checkMonster(r, s, function(fnd, monster) {
		if (fnd) {
			Combat.begin(s, monster, function(contFight, monster) { // the first round qualifiers
				if (contFight) {
					while (s.player.position === 'fighting' && monster.position === 'fighting') {
						Combat.round(s, monster, function() {
							
							if (monster.chp <= 0 || s.player.chp <= 0) {
								monster.position = 'dead';
								Character.prompt(s);
							}						
						});						
					}					
				}
			});
		} else {
			s.emit('msg', {msg: 'There is nothing by that name here.', styleClass: 'error'});
		}
	});
}

Skill.prototype.bash = function(r, s) { 

}

/*
Skill.prototype.kill = function(r, s, fn) {
	var i  = 0;	
	for (i; i < players.length; i += 1) {
		if (players[i].name === r.msg && r.msg != s.player.name) {
			Combat.firstRound(s, players[i], function(player2) {
				Combat.damageMessage('', function(attack) {	

					Combat.msgToPlayer('', function() {
						s.emit('msg', {msg: attack, styleClass: 'error'});
						
						Combat.msgToOpponent('', function() {
							s.emit('msg', {msg: attack, styleClass: 'error'}); 
							
							Combat.msgToRoom('', function() {
								s.emit('msg', {msg: attack, styleClass: 'error'});
							});
						});
					});					
	
					Character.updateBySocket(players[i], function(player) {
						while (s.player.chp > 0) {
							Combat.nextRound(s, player2, function() {
							
							}); 
						};
					});
				});
			});
		} else {
			s.emit('msg', {msg: 'Kill failed.', styleClass: 'error'});
		}
	}
	
	if (typeof fn === 'function') {
		fn();
	}	
}
*/

module.exports.skill = new Skill();