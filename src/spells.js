'use strict';
var World = require('./world').world,
Character = require('./character').character,
Spell = function() {};

/*
* Damage Spells
*/
Spell.prototype.spark = function(skillObj, player, opponent, roomObj, command, fn) {
	var intMod,
	cost = 2,
	damage = 0;
	
	if (cost < player.cmana) {
		intMod = World.dice.getIntMod(player);

		if (World.dice.roll(1, 100) <= skillObj.train) {
			player.wait += 2;
			player.cmana -= (cost - intMod);

			damage = World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana/20, intMod);
			damage -= opponent.magicRes;
			damage -= opponent.ac/2;

			opponent.chp -= damage;

			World.msgPlayer(player, {
				msg: 'You cast spark and a series of crackling '
					+ '<span class="blue">bright blue sparks</span> burn ' + opponent.displayName 
					+ ' with maiming intensity! (' + damage + ')',
				noPrompt: true
			});

			World.msgPlayer(opponent, {
				msg: player.displayName + ' casts  spark and burns you ' 
					+ opponent.displayName + ' with maiming intensity! (' + damage + ')'
			});
		} else {
			// spell failed
			World.msgPlayer(player, {
				msg: 'You try to channel the spell but only get '
					+ '<span class="blue">sparks and a series of crackling sounds!</span>',
			});
		}

		return fn(player, opponent, roomObj, command);
	} else {
		World.msgPlayer(player, {
			msg: 'You dont have enough mana to cast spark!',
			styleClass: 'error'
		});
	}
};

/*
* Passive Spells
*/

Spell.prototype.detectInvis = function(skillObj, player, roomObj, command, fn) {
	var intMod = World.dice.getIntMod(player),
	failRoll,
	successRoll,
	// Check if we already have this passive 
	// false if we dont have the affect otherwise the affect object
	currentAffect,
	cost = 1;

	if (1 > 0) {
		console.log('here');
	} else {

	}
};

module.exports.spells = new Spell();

