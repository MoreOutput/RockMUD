'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	Wander behavior. Mob will walk about selecting a random move direction from
	mob.moveDirections. 

	If the mob.stayinArea property is set to false the mob can wander outside of its starting area. 

	Adding a mob.wanderCheck value provides a check against 1d10; movement only occurs if the roll 
	beats the given wanderCheck value.
*/
module.exports = {
	stayInArea: true,
	wanderCheck: 35,
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
	onAlive: function(mob, roomObj) {
		var roll = World.dice.roll(1, 40),
		exitObj,
		direction;

		if (mob && mob.wanderCheck && roll > mob.wanderCheck && mob.position === 'standing') {
			if (!mob.moveDirections) {
				mob.moveDirections = mob.moveDirections;
			}

			if (!mob.stayInArea) {
				mob.stayInArea = mob.stayInArea;
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
