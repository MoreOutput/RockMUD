'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Skill = function() {

};

/*
* Passive Skills
*/

// Return a mod for AC rolls when the opponent has a shield
Skill.prototype.shieldBlock = function(player, roomObj, shield) {
	var skillObj = Character.getSkill(player, 'shieldBlock');
	
	if (skillObj) {
		return World.dice.roll(1, skillObj.train/10, shield.ac);
	} else {
		return shield.ac;
	}	
};

Skill.prototype.darkvision = function(player, roomObj) {
	var skillObj;
};

/*
* Melee Skills
*/
Skill.prototype.bash = function(player, roomObj, command) {

};

module.exports.skills = new Skill();
