'use strict';
/*
    RockMUD move an entity toward a given refID

    @stayInArea boolean can be toggled to keep the entity from searching outside of its current area. 

    @getTarget function returns the target the entity is searching for 
*/
module.exports = {
	getTarget: function(World, behavior, mob, roomObj) {
		var target = null;

		if (behavior.targetRefId) {
			target = World.getEntityByRefId(behavior.targetRefId);
		}
		
		
		return target;
	},
	stayInArea: true,
	check: 1, // 1 out 10 chance to fire this onAlive event
	targetRefId: '',
	onAlive: function(World, behavior, mob, roomObj) {
		var roll = World.dice.roll(1, 10),
		target,
		targetRoomObj,
		exitObj, 
		direction;

		behavior.targetRefId = mob.refId;

		if (!mob.fighting && roll > behavior.check && mob.position === 'standing') {
			target = behavior.getTarget(behavior, mob, roomObj);
			
			if (target) {
				targetRoomObj = World.getRoomObject(target.area, target.roomid);
				direction = World.room.getClosestExit(roomObj, targetRoomObj);
				/*	
				exitObj = World.room.getExit(roomObj, direction);
				
				if (exitObj && ((behavior.stayInArea === false)
					|| (behavior.stayInArea === true && mob.area === exitObj.area))) {
					World.addCommand({
						cmd: 'move',
						arg: direction,
						roomObj: roomObj
					}, mob);
				}
				*/
			} else {
				console.log('could not find target');
			}
		}
	}
};
