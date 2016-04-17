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
			&& target.isPlayer
			&& target.roomid === mob.roomid) {
            Cmd.kill(mob, {
                arg: target.name
            });
        }
    },
	onAlive: function(target, roomObj) {
	}
};
