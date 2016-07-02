'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	stayInArea: true,
	wanderCheck: 0,
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
	onAlive: function(roomObj) {
		var mob = this,
		roll = World.dice.roll(1, 10),
		exitObj,
		direction;

		if (roll > mob.wanderCheck) {
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
