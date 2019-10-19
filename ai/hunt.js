'use strict';
var World = require('../src/world');

/*
    RockMUD A* move the entity toward a given ref ID

    @stayInArea boolean can be toggled to keep the entity from searching outside of its current area. 
    @stayInOriginatingArea boolean can be toggled to only allow search when
*/
module.exports = {
	stayInArea: true,
	check: 1, // 1 out 10 chance to fire this onAlive event
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'], // default directions
	onAlive: function(behavior, mob, roomObj) {
		var roll = World.dice.roll(1, 10),
		exitObj,
		direction;

		if (mob && behavior.check && roll > behavior.check && mob.position === 'standing') {
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
