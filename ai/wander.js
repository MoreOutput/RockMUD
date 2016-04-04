'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
    moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
    onAlive: function(roll) {
        var mob = this,
        roll = World.dice.roll(1, 10),
        direction;

        if (roll > 6) {
            direction = mob.moveDirections[parseInt(Math.random() * ((mob.moveDirections.length)))];

            Cmd.move(mob, {
                arg: direction
            });
        }
    }
};
