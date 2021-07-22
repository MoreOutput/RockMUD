'use strict';
/*
	Wander behavior. Mob will walk about selecting a random move direction from mob.moveDirections.
	If the mob.stayinArea property is set to false the mob can wander outside of its starting area.
	Adding a mob.wanderCheck value provides a check against 1d100; movement only occurs if the roll beats the given wanderCheck value.
*/
module.exports = { 
	stayInArea: true,
	wanderCheck: 75,
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'], // default directions
	onAlive: function(World, behavior, mob, roomObj) {
		var roll = World.dice.roll(2, 50),
		exitObj,
		direction;

		if (roll > behavior.wanderCheck && mob.position === 'standing') {
			direction = behavior.moveDirections[World.dice.roll(1, behavior.moveDirections.length) - 1];

			exitObj = World.room.getExit(roomObj, direction);
			
			if (exitObj && ((behavior.stayInArea === false) || (behavior.stayInArea === true && mob.area === exitObj.area))) {
				World.addCommand({
					cmd: 'move',
					arg: direction,
					roomObj: roomObj
				}, mob);
			}
		}
	}
};
