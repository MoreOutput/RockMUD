'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Skill = function() {

};

Skill.prototype.spark = function(player, opponent, roomObj, command, fn) {
    return {
        minLevel: 1,
        type: 'passive',
        maxTrain: 100,
        position: ['fighting', 'standing'],
        onUse: function() {
            // Damage in battle
            
            // Lights up a room outside of battle
        }
    }
};

module.exports.skill = new Skill();
