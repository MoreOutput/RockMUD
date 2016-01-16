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

        if (mob.position === 'standing' && target.isPlayer && target.roomid === mob.roomid) {
            Cmd.fire('kill', mob, {
                arg: target.name
            });
        }
    }
};
