'use strict';
var World = require('./world').world,

Spell = function() {

};

Spell.prototype.spark = function(player, opponent, roomObj, command, fn) {
	var intMod,
	cost = 40 - player.level,
	oppIntMod;

	if (command.input || player.opponent) {
		if (cost < player.cmana) {
			intMod = World.dice.getIntMod(player),
			oppIntMod = World.dice.getIntMod(opponent);

			player.wait += 2;
			player.cmana -= (cost - intMod);
			// Failure check
			// World.dice.spellCheck(player, opponent, fn);

			World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana/20, intMod, function(damage) {
				damage -= opponent.magicRes;
				damage -= opponent.ac;

				opponent.chp -= damage;

				World.msgPlayer(player, {msg: 'You cast spark and burn a ' + opponent.displayName 
					+ ' with maiming intensity! (' + damage +')'});

				World.msgPlayer(opponent, {msg: player.displayName + ' casts spark and burns you ' 
					+ opponent.displayName + ' with maiming intensity! (' + damage +')'});

				return fn(player, opponent, roomObj, command);
			});
		} else {
			World.msgPlayer(player, {msg: 'You dont have enough mana to cast spark!', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(player, {msg: 'You need to point out a victim.', styleClass: 'error'});
	}
};

module.exports.spells = new Spell();
