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

/*
* Fighter Skills
*/
Skill.prototype.bash = function(r, s) { 

}

module.exports.skill = new Skill();