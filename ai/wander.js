'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
    moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
    onAlive: function(roll) {
        var mob = this;

        World.dice.roll(1, 10, function(roll) {
            if (roll > 2) {
                Cmd.fire('move', mob, {
                    arg:  mayor.moveDirections[parseInt(Math.random() * ((mayor.moveDirections.length)))]
                });
            }
        });
    }
};
