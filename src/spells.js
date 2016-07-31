'use strict';
var World = require('./world').world,
Character = require('./character').character,
Spell = function() {};

Spell.prototype.spark = function(skillObj, player, roomObj, command, fn) {
	var intMod,
	cost = 10,
	damage = 0;
	
	if (cost < player.cmana) {
		intMod = World.dice.getIntMod(player);

		if (World.dice.roll(1, 100) <= skillObj.train) {
			player.wait += 2;
			player.cmana -= (cost - intMod);

			damage = World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana/20, intMod);
			damage -= player.opponent.magicRes;
			damage -= player.opponent.ac/2;

			player.opponent.chp -= damage;

			World.msgPlayer(player, {
				msg: 'You cast spark and a series of crackling '
				+ '<span class="blue">bright blue sparks</span> burn ' + player.opponent.displayName 
				+ ' with maiming intensity! (' + damage + ')'
			});

			World.msgPlayer(player.opponent, {
				msg: player.displayName + ' casts spark and burns you ' 
				+ player.opponent.displayName + ' with maiming intensity! (' + damage + ')'
			});
		} else {
			// spell failed
			World.msgPlayer(player, {
				msg: 'You try to channel the spell but only get '
				+ '<span class="blue">sparks and a series of crackling sounds!</span>',
			});
		}

		return fn(player, player.opponent, roomObj, command);
	} else {
		World.msgPlayer(player, {msg: 'You dont have enough mana to cast spark!', styleClass: 'error'});
	}
};

module.exports.spells = new Spell();

