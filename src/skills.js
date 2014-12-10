'use strict';

var Dice = require('./dice').roller,
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Skill = function() {

};

/*
* Melee Skills
*/
Skill.prototype.bash = function(r, s) {
	var addWait = 10,
	minLevel = 1; 

	if (s.player.position === 'fighting' && s.player.class === 'fighter') {
		s.emit('msg', {msg: 'BASH!', styleClass: 'skill bash'});
	} else {
		// Not advanced enough to use the skill
	}
};

module.exports.skill = new Skill();