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
Skill.prototype["bash"] = function(r, s) {
	var addWait = 10,
	minLevel = 1; 

	if (s.player.position === 'fighting' && s.player.class === 'fighter') {
		s.emit('msg', {msg: 'BASH!', styleClass: 'skill bash'});
	} else {
		// Not advanced enough to use the skill
		s.emit('msg', {msg:'Not advanced enough to use this skill', styleClass: 'error'});
	}

	return Character.prompt(s);
};

Skill.prototype["cure-light"] = function(r, s) {
	var hpd = s.player.hp / 3;

	if(s.player.wait === 0 && s.player.cmp >= 25)
		{	
		if((s.player.chp + hpd) > s.player.hp){
			hpd = s.player.hp - s.player.chp;
			s.player.chp = s.player.hp;
		}else{
			s.player.chp += hpd;
		}

		s.player.wait++;
		s.player.cmp -= 25;
		
		s.emit('msg', {msg: '** SOOTH! ** you regain ' + hpd + 'hp', styleClass: 'skill cure-light'});
	}else{
		s.emit('msg', {msg: 'You must wait to use this skill', styleClass: 'error'});
	}
	return Character.prompt(s);
};

module.exports.skill = new Skill();