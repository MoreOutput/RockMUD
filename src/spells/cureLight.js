'use strict'
module.exports = function(skillObj, entity, opponent, roomObj, command, World) {
	var intMod = 0;
	var wisMod = 0;
	var cost = 2;
	var healing = 0;
	var manaFailMsg = 'Not enough mana to cast ' + skillObj.display;
	var failMsg = 'Your eyes flicker blue as you <strong>fail to cast ' + skillObj.display + '</strong>.';
	var roomMsg =  '';
	var skillOutput = World.combat.createSkillProfile(entity, skillObj);
	var wait = 2;

	if (skillObj.wait) {
		wait = skillObj.wait;
	}

	skillOutput.defenderRefId = opponent.refId;

	if (cost < entity.cmana) {
		intMod = World.dice.getIntMod(entity);
		wisMod = World.dice.getWisMod(entity);

		if (skillObj.train >= 75 && World.dice.roll(1, 100) <= skillObj.train) {
			skillOutput.attackerMods.wait += wait;
			skillOutput.attackerMods.cmana -= (cost - intMod);	

			healing = World.dice.roll(1, 5, entity.level);

			if (entity.mainStat === 'wis') {
				healing += entity.level;
			}

			if (opponent.refId === entity.refId) {
				skillOutput.msgToDefender = 'You channel your powers into your own body and lightly heal your wounds. (' + healing + ')';
				
				roomMsg = entity.possessivePronoun + ' eyes turn a cloudy white.';
			} else {
				skillOutput.msgToAttacker = 'You channel your powers into ' + opponent.displayName + '.';
				skillOutput.msgToDefender = 'heals you';
				
				roomMsg = entity.possessivePronoun + ' eyes turn a cloudy white as he places his '
					+ entity.handsNoun +  's on ' + opponent.displayName + '.'
			}

			skillOutput.defenderMods.chp = healing;

			World.combat.processSkill(entity, opponent, skillOutput);
		} else {
			// fail
			console.log('failed to cast cure light');
		}
	} else {
		World.msgPlayer(entity, {
			msg: 'You dont have enough mana to cure something!',
			styleClass: 'error'
		});
	}
};;
