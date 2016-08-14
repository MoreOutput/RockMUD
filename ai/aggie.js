'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	Aggie behavior, mob will attack whatever creature enters the room,
	can specifiy min/max target level in behavior definition.

	If mob.attackOnVisit is false then the mob will only look for a target during
	the onAlive tick. If mob.preventOnAlive is toggled to true then the mob will
	only attack if something enters the room from an adjacent room (entering the room
	via portal or the like would then not trigger the aggressive behavior).

	Setting mob.mobAggressive to true will empower the mob to attack other mobs.
*/

module.exports = {
	attackOnVisit: true,
	attackOnAlive: true,
	mobAggressive: false,
	onVisit: function(mob, roomObj, target, command) {	
		if (mob && mob.attackOnVisit === true
			&& mob.position === 'standing'
			&& (target.isPlayer || mob.mobAggressive)
			&& target.roomid === mob.roomid) {
			Cmd.kill(mob, {
				arg: target.name
			});
		}
	},
	onAlive: function(mob, roomObj) {
		var target;
		
		if (roomObj.playersInRoom) {
			target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
		}
		
		if (target && mob.position === 'standing'
			&& (target.isPlayer || mob.mobAggressive)
			&& target.roomid === mob.roomid && mob.attackOnAlive) {
			Cmd.kill(mob, {
				arg: target.name
			});
		}
	}
};
