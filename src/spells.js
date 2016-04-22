'use strict';
var World = require('./world').world,
Character = require('./character').character,
Spell = function() {};

Spell.prototype.spark = function(player, roomObj, command, fn) {
	var skillObj = Character.getSkill(player, 'spark'),
	intMod,
	cost = 40 - player.level,
	damage = 0,
	oppIntMod;

	if (command.input || player.opponent) {
		if (cost < player.cmana) {
			intMod = World.dice.getIntMod(player),
			oppIntMod = World.dice.getIntMod(player.opponent);

			player.wait += 2;
			player.cmana -= (cost - intMod);

			damage = World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana/20, intMod);
			damage -= player.opponent.magicRes;
			damage -= player.opponent.ac;

			player.opponent.chp -= damage;

			World.msgPlayer(player, {msg: 'You cast spark and burn a ' + player.opponent.displayName 
				+ ' with maiming intensity! (' + damage + ')'});

			World.msgPlayer(player.opponent, {msg: player.displayName + ' casts spark and burns you ' 
				+ player.opponent.displayName + ' with maiming intensity! (' + damage + ')'});

			return fn(player, player.opponent, roomObj, command);
		} else {
			World.msgPlayer(player, {msg: 'You dont have enough mana to cast spark!', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(player, {msg: 'You need to point out a victim.', styleClass: 'error'});
	}
};

module.exports.spells = new Spell();
