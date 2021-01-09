'use strict';
var World;
var Spell = function(newWorld) {
	World = newWorld;
};

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

			skillOutput.defenderMods.chp = -damage;
			skillOutput.defenderRefId = opponent.refId;
			
			skillOutput.msgToAttacker = 'You cast spark and a series of crackling '
				+ '<span class="blue">bright blue bolts</span> burn <span class="grey">' + opponent.short
				+ '</span> with maiming intensity! (' + damage + ')';

			skillOutput.winMsg = 'Your spark hits '
				+ opponent.short + ' <span class="red">burning</span> their flesh!'
				+ ' (' + damage + ')';

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
	cost = -1;

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

			World.character.changeMana(player, cost);

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

module.exports = Spell;
