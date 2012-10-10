/*
	General skills 
*/
var Dice = require('./dice').roller,
Character = require('./character').character,
Room = require('./rooms').room;

var Skill = function() {
	this.perms = ['admin'];
}

// Starting a fight needs to meet requirements, therefore it is a skill (working concept of definition)
Skill.prototype.kill = function(r, s, players, fn) {
	
}

module.exports.skill = new Skill();
