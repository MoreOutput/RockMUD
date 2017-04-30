'use strict';
var Cmd = require('../src/commands'),
Room = require('../src/rooms'),
World = require('../src/world');

/*
	Aggie behavior, mob will attack whatever creature enters the room,
	can specifiy min/max target level in behavior definition.

	If mob.attackOnVisit is false then the mob will only look for a target during
	the onAlive tick. If mob.preventOnAlive is toggled to true then the mob will
	only attack if something enters the room from an adjacent room (entering the room
	via portal or the like would then not trigger the aggressive behavior).

	Setting mob.mobAggressive to true will empower the mob to attack other mobs.

	Setting revenge to true limits the mob to only being aggie against the thing that attacked it last.
*/
module.exports = {
	attackOnVisit: true,
	attackOnAlive: true,
	playerAggressive: true,
	mobAggressive: false,
	onlyAttackLarger: false,
	onlyAttackSmaller: false,
	onlyAttackSleeping: false,
	revenge: false,
	onVisit: function(mob, roomObj, target, incomingRoomObj, command) {	
		var target;
		
		if (roomObj.playersInRoom.length && mob.playerAggressive) {
			target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
		} else if (roomObj.monsters.length && mob.mobAggressive) {
			target = roomObj.monsters[World.dice.roll(1, roomObj.monsters.length) - 1];
		}

		if (mob.onlyAttackLarger && mob.size.value >= target.size.value) {
			target = false;
		} else if (mob.onlyAttackSmaller && mob.size.value <= target.size.value) {
			target = false;
		}
		
		if (target && mob.attackOnVisit && mob.position === 'standing' && target.roomid === mob.roomid) {
			if (!mob.revenge) {
				Cmd.kill(mob, {
					arg: target.name,
					roomObj: roomObj
				});
			} else if (target.refId === mob.lastAttackedBy) {
				Cmd.kill(mob, {
					arg: target.name,
					roomObj: roomObj
				});
			}
		}
	},
	onAlive: function(mob, roomObj) {
		var target;
		
		if (roomObj.playersInRoom.length && mob.playerAggressive) {
			target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
		} else if (roomObj.monsters.length && mob.mobAggressive) {
			target = roomObj.monsters[World.dice.roll(1, roomObj.monsters.length) - 1];
		}

		if (mob.onlyAttackLarger && mob.size.value >= target.size.value) {
			target = false;
		} else if (mob.onlyAttackSmaller && mob.size.value <= target.size.value) {
			target = false;
		}

		if (mob.onlyAttackSleeping === true && target.position !== 'sleeping') {
			target = false;
		}
		
		if (target && mob.attackOnAlive && mob.position === 'standing' && target.roomid === mob.roomid) {
			if (!mob.revenge) {
				Cmd.kill(mob, {
					arg: target.name,
					roomObj: roomObj
				});
			} else if (target.refId === mob.lastAttackedBy) {
				Cmd.kill(mob, {
					arg: target.name,
					roomObj: roomObj
				});
			}
		}
	}
};
