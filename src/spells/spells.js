'use strict';
var World = require('../world'),
Spell = function() {};

/*
* Damage Spells
*
* Since these are combat spells they must return a Skill Profile Object
*/
Spell.prototype.spark = function(skillObj, player, opponent, roomObj, command) {
	var intMod,
	cost = 3,
	skillOutput = World.combat.createSkillProfile(player, skillObj),
	damage = 0;

	if (cost < player.cmana) {
		intMod = World.dice.getIntMod(player);

		if (World.dice.roll(1, 100) <= skillObj.train) {
			skillOutput.attackerMods.wait += 2;
			skillOutput.attackerMods.cmana -= (cost - intMod);

			damage = World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana/20, intMod);
			damage -= opponent.magicRes;

			skillOutput.defenderMods.chp = -damage;

			skillOutput.msgToAttacker = 'You cast spark and a series of crackling '
				+ '<span class="blue">bright blue bolts</span> burn <span class="grey">' + opponent.short
				+ '</span> with maiming intensity! (' + damage + ')';

			skillOutput.msgToDefender = player.displayName + ' casts spark and burns you with'
				+ ' maiming intensity! (' + damage + ')';

			World.combat.processSkill(player, opponent, skillOutput);
		} else {
			// spell failed
			skillOutput.msgToAttacker = 'You try to channel the spell but only get '
					+ '<span class="blue">sparks and a series of crackling sounds!</span>';

			World.combat.processSkill(player, opponent, skillOutput);
		}
	} else {
		World.msgPlayer(player, {
			msg: 'You dont have enough mana to cast spark!',
			styleClass: 'error'
		});
	}
};

/*
* Passive vision-oriented Spells
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

	} else {

	}
};

Spell.prototype.detectHidden = function(skillObj, player, roomObj, command, fn) {
	var intMod,
	chanceRoll = World.dice.roll(1, 100),
	failMsg = 'Your eyes flicker blue as you <strong>fail to cast detect hidden</strong>.',
	successMsg = 'Your eyes shine bright blue as you become more aware of your surroundings!',
	roomMsg =  player.possessivePronoun + ' eyes shine bright blue as you become more aware of your surroundings!',
	oppSuccessMsg = player.displayName + ' tries to cast a spell and fails.',
	alreadyAffectedMsg = 'You are already experiencing increased awareness.',
	currentlyAffected = World.character.getAffect(player, 'detectHidden'),
	timer = 1,
	cost = 1;

	if (!currentlyAffected) {
		if (World.dice.roll(1, 100) <= skillObj.train && chanceRoll > 2) {
			intMod = World.dice.getIntMod(player);

			if (player.mainStat === 'int') {
				intMod += 1;
			}

			if (chanceRoll === 100) {
				intMod += 2;
			}

			timer += World.dice.roll(1, intMod);

			World.addAffect(player, {
				id: skillObj.id,
				affect: 'hidden',
				display: 'Detect Hidden',
				caster: player.refId,
				modifiers: null,
				decay: timer
			});

			World.msgPlayer(player, {
				msg: successMsg
			});

			World.msgRoom(roomObj, {
				msg: roomMsg,
				playerName: player.name
			});

			if (opponent.isPlayer && opponent.refId !== player.refId) {
				World.msgPlayer(opponent, {
					msg: oppSuccessMsg
				});
			}
		} else {
			World.msgPlayer(player, {
				msg: failMsg
			});
		}
	} else {
		World.msgPlayer(player, {
			msg: alreadyAffectedMsg
		});
	}
};

Spell.prototype.invisibility = function(skillObj, player, roomObj, command, fn) {
	var intMod = World.dice.getIntMod(player),
	failRoll,
	successRoll,
	// Check if we already have this passive 
	inEffect = false,
	cost = 1;

	if (1 > 0) {

	} else {

	}
};

/*
* Healing Spells
*/
Spell.prototype.cureLight = function(skillObj, player, roomObj, command) {
	var intMod,
	wisMod,
	cost = 2,
	healing = 0,
	chanceRoll = World.dice.roll(1, 100),
	manaFailMsg = 'Not enough mana to cast ' + skillObj.display,
	failMsg = 'Your eyes flicker blue as you <strong>fail to cast ' + skillObj.display + '</strong>.',
	successMsg = '',
	roomMsg =  '',
	skillOutput = World.combat.createSkillProfile(player, skillObj),
	wait = 2;

	if (skillObj.wait) {
		wait = skillObj.wait;
	}

	if (cost < player.cmana) {
		if (World.dice.roll(1, 100) <= skillObj.train && chanceRoll > 2) {
			if (opponent.refId === player.refId) {
				successMsg = 'Your eyes shine as you channel your powers to make yourself feel a bit better!';
			} else {
				successMsg = 'You channel your powers into your own body by placing your hand on your'
				+ ' chest. You feel a bit better.';
			}

			roomMsg = player.possessivePronoun + ' eyes become clouded as they as they lay their ' + player.handsNoun
				+ 's upon ' + opponent.displayName + '.';

			if (opponent.refId !== player.refId) {
				roomMsg = player.possessivePronoun + ' eyes turn a cloudy white as he places his '
					+ player.handsNoun +  's on ' + opponent.displayName + '.';
			} else {
				roomMsg = player.possessivePronoun + ' reaches for their head whole their eyes turn a cloudy white. They seem reinvigorated.';
			}

			if (player.mainStat === 'wis') {
				healing = World.dice.roll(1, player.level, skillObj.mod);

				if (chanceRoll > 75) {
					cost -= 1;
				}
			} else if (player.mainStat === 'str') {
				cost += 1;
				wait += 2;
			}

			intMod = World.dice.getIntMod(player);
			
			wisMod = World.dice.getWisMod(player);

			if (skillObj.mod) {
				wisMod += World.dice.roll(1, skillObj.mod);

				intMod += World.dice.roll(1, skillObj.mod);
			}

			player.wait += wait;
			player.cmana -= cost;

			if (opponent.chp > opponent.hp) {
				opponent.chp = opponent.hp;
			}

			if (chanceRoll === 100) {
				healing += World.dice.roll(1, healing/3);
			}

			healing = World.dice.roll(player.level / 2 + 1, 20 + intMod + player.mana / 40, wisMod) + skillObj.mod;

			opponent.chp += healing;

			if (opponent.chp > opponent.hp) {
				opponent.chp = opponent.hp;
			}

			World.msgPlayer(player, {
				msg: successMsg
			});

			if (roomMsg) {
				World.msgRoom(roomObj, {
					msg: roomMsg,
					playerName: player.name
				});
			}
		} else {
			World.msgPlayer(player, {
				msg: failMsg
			});
		}

		if (fn) {
			return fn(player, opponent, roomObj, command);
		}
	} else {
		World.msgPlayer(player, {
			msg: manaFailMsg,
			styleClass: 'error'
		});

		if (fn) {
			return fn(player, opponent, roomObj, command);
		}
	}
};

module.exports = new Spell();;
