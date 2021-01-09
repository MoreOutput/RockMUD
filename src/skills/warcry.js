/*
* Non combat skill. Add a bonus to Damroll and Hitroll
*/
'use strict'
module.exports = function(skillObj, entity, roomObj, command, World) {
	var wait = 3;
	var skillOutput = World.combat.createSkillProfile(entity, skillObj);
	var decay = 2;
	var existing = World.getAffect(entity, 'warcry');

	if (skillObj.wait) {
		wait = skillObj.wait;
	}

	if (!command.second && !existing) {
		if (entity.position === 'standing' && !entity.mute) {
			if (World.dice.roll(1, 100) <= skillObj.train) {			
				World.addAffect(entity, { 
					id: skillObj.id,
					affect: 'modifiers',
					display: 'Warcry',
					caster: entity.refId,
					modifiers: {
						damroll: 5,
						hitroll: 5
					},
					decay: decay
				});

				skillOutput.msgToDefender = 'Arrarrragghhhhhhhh!';
				skillOutput.defenderMods.wait = wait;

				World.combat.processSkill(entity, entity, skillOutput);
			}
		} else {
			World.msgPlayer(entity, {msg: 'You can\'t skin anything right now'});
		}
	} else if (existing) {
		World.msgPlayer(entity, {msg: 'You are already enraged!'});
	}
};
