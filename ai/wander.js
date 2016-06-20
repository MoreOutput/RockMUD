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
		roomObj,
		exitObj,
		targetRoom,
		direction;

		if (roll > mob.wanderCheck) {
			roomObj = World.getRoomObject(mob.area, mob.roomid); 

			direction = mob.moveDirections[World.dice.roll(1, mob.moveDirections.length) - 1];
			
			exitObj = Room.getExit(roomObj, direction);

			targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

			if (targetRoom && ((mob.stayInArea === false) || (mob.stayInArea === true && targetRoom.area === roomObj.area))) {
				Cmd.move(mob, {
					arg: direction,
					roomObj: roomObj
				});
			}
		}
	}
};
