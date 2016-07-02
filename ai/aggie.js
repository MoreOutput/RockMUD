'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	Aggie behavior, mob will attack whatever creature enters the room,
	can specifiy min/max target level in behavior definition
*/

module.exports = {
	onVisit: function(target, roomObj) {
		var mob = this;
		// if we do not have this property set the mob will only attack when it finds
		// other players in its room.
		if (mob.attackOnVisit === true
			&& mob.position === 'standing'
			&& (target.isPlayer || mob.mobAggressive)
			&& target.roomid === mob.roomid) {
			Cmd.kill(mob, {
				arg: target.name
			});
		}
	},
	onAlive: function(roomObj) {
		var mob = this,
		target;

		if (roomObj.playersInRoom) {
			target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
		}
		
		if (target && mob.position === 'standing'
			&& (target.isPlayer || mob.mobAggressive)
			&& target.roomid === mob.roomid) {
			Cmd.kill(mob, {
				arg: target.name
			});
		}
	}
};
