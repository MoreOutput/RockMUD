'use strict';
var World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Spell = function() {

};

Spell.prototype.spark = function(player, opponent, roomObj, command, fn) {
    var intMod = World.dice.getIntMod(player),
    opponent = World.dice.getIntMod(opponent);
    // Roll a spell hit check
    // remove mana here

    player.cmana -= (50 - player.level) - intMod;


    World.msgPlayer(player, {msg: "ZAP!"});

    return fn(player, opponent, roomObj, command);

};

module.exports.spells = new Spell();
