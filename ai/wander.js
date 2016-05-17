'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	stayInArea: true,
    moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
    onAlive: function(roomObj) {
        var mob = this,
        roll = World.dice.roll(1, 10),
        direction;

        if (roll > 6) {
            direction = mob.moveDirections[World.dice.roll(1, mob.moveDirections.length) - 1];

            Cmd.move(mob, {
                arg: direction
            });
        }
    }
};
