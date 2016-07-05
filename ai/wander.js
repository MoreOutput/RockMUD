'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	stayInArea: true,
	wanderCheck: 0,
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
	onAlive: function(roomObj, mob) {
		var roll = World.dice.roll(1, 10),
		exitObj,
		direction;

		if (!mob.wanderCheck) {
			mob.wanderCheck = this.wanderCheck;
		}

		if (roll > mob.wanderCheck) {
			if (!mob.moveDirections) {
				mob.moveDirections = this.moveDirections;
			}

			if (!mob.stayInArea) {
				mob.stayInArea = this.stayInArea;
			}

			direction = mob.moveDirections[World.dice.roll(1, mob.moveDirections.length) - 1];

			exitObj = Room.getExit(roomObj, direction);

			if (exitObj && ((mob.stayInArea === false) || (mob.stayInArea === true && mob.area === exitObj.area))) {
				Cmd.move(mob, {
					arg: direction,
					roomObj: roomObj
				});
			}
		}
	}
};
