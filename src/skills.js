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
* Passive Skills
*/
Skill.prototype.darkvision = function(r, s) {
	return {
		minLevel: 1,
		type: 'passive',
		maxTrain: 100,
		onMove: function(room) {

		},
		onBlind: function() {

		}
	}
};

/*
* Melee Skills
*/
Skill.prototype.bash = function(r, s) {
	return {
		minLevel: 1,
		type: 'passive',
		maxTrain: 100,
		position: 'fighting',
		onUse: function() {
			// Smash a target doing damage

		},
		onBlocked: function() {
			// if blocked with a shield basher has 10% of falling down
		}
	}
};

/*
* Magic Skills
*/
Skill.prototype.spark = function(r, s) {
	return {
		minLevel: 1,
		type: 'passive',
		maxTrain: 100,
		position: ['fighting', 'standing'],
		onUse: function() {
			// Damage in battle
			
			// Lights up a room outside of battle
		}
	}
};

module.exports.skill = new Skill();
