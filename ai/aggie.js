'use strict';

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
	onVisit: function(World, behavior, mob, roomObj, target, incomingRoomObj, command) {	
		var target;

		if (!mob.fighting) {
			if (roomObj.playersInRoom.length && behavior.playerAggressive) {
				target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
			} else if (roomObj.monsters.length && behavior.mobAggressive) {
				target = roomObj.monsters[World.dice.roll(1, roomObj.monsters.length) - 1];
			}

			if (behavior.onlyAttackLarger && mob.size.value >= target.size.value) {
				target = false;
			} else if (behavior.onlyAttackSmaller && mob.size.value <= target.size.value) {
				target = false;
			}

			if (target && behavior.attackOnVisit && mob.position === 'standing' && target.roomid === mob.roomid) {
				if (!mob.revenge) {
					World.addCommand({
						cmd: 'kill',
						arg: target.name,
						roomObj: roomObj,
						target: target
					}, mob);
				} else if (target.refId === behavior.lastAttackedBy) {
					World.addCommand({
						cmd: 'kill',
						arg: target.name,
						roomObj: roomObj,
						target: target
					}, mob);
				}
			}
		}
	},
	onAlive: function(World, behavior, mob, roomObj) {
		var target;

		if (!mob.fighting) {
			if (roomObj.playersInRoom.length && behavior.playerAggressive) {
				target = roomObj.playersInRoom[World.dice.roll(1, roomObj.playersInRoom.length) - 1];
			} else if (roomObj.monsters.length && behavior.mobAggressive) {
				target = roomObj.monsters[World.dice.roll(1, roomObj.monsters.length) - 1];
			}

			if (behavior.onlyAttackLarger && mob.size.value >= target.size.value) {
				target = false;
			} else if (behavior.onlyAttackSmaller && mob.size.value <= target.size.value) {
				target = false;
			}

			if (behavior.onlyAttackSleeping === true && target.position !== 'sleeping') {
				target = false;
			}

			if (target && behavior.attackOnAlive && mob.position === 'standing' && target.roomid === mob.roomid) {
				if (!mob.revenge) {
					World.addCommand({
						cmd: 'kill',
						arg: target.name,
						roomObj: roomObj,
						target: target
					}, mob);
				} else if (target.refId === behavior.lastAttackedBy) {
					World.addCommand({
						cmd: 'kill',
						arg: target.name,
						roomObj: roomObj,
						target: target
					}, mob);
				}
			}
		}
	}
};
