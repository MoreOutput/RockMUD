/*
* Heal Everyone in the casters group and in the room
*/
'use strict'
module.exports = function(skillObj, entity, target, roomObj, command, World) {
	var entitiesToHeal = [entity];
	var skillOutput;
	var skills = [];
	var intMod = World.dice.getIntMod(entity);

	entitiesToHeal = entitiesToHeal.concat(entity.group);

	entitiesToHeal.forEach(defender => {
		var healAmt = World.dice.roll(1, 10 + intMod, entity.level + intMod);
		
		skillOutput = World.combat.createSkillProfile(entity, skillObj);
		skillOutput.defenderRefId = defender.refId;

		if (defender.refId === entity.refId) {
			skillOutput.msgToDefender = '<span class="grey">You channel your energies into yourself</span>! '
				+ '<span class="green">(' + healAmt + ')</span>';
		} else {
			skillOutput.msgToDefender = 'You heal ' + defender.displayName + '! (' + healAmt + ')';
		}

		skillOutput.attackerMods.wait += 4;
		skillOutput.defenderMods.chp += 10;

		skills.push(skillOutput);
	});

	World.combat.processMultiSkill(entity, entitiesToHeal, skills);
};
