/*
* Non combat skill. Add a bonus to Damroll and Hitroll
*/
'use strict'
var World = require('../world');

module.exports = function(skillObj, entity, roomObj, command) {
	var strMod; // a corpse from a slain entity in the same room as calling entity
	var wait = 3;
	var skillOutput = World.combat.createSkillProfile(entity, skillObj);
	var decay = 2;

	if (skillObj.wait) {
		wait = skillObj.wait;W
	}

	if (!command.second) {
		if (entity.position === 'standing' && !entity.mute) {
			if (World.dice.roll(1, 100) <= skillObj.train) {
				strMod = World.dice.getIntMod(entity);
			
				World.addAffect(entity, { 
					id: skillObj.id,
					affect: 'hidden',
					display: 'Warcry',
					caster: entity.refId,
					modifiers: {
						damroll: 10,
						hitroll: 10
					},
					decay: decay
				});

				entity.wait += 3;

				World.msgPlayer(entity, {msg: 'Arrarrragghhhhhhhh!', styleClass: 'yellow'});
			}
		} else {
			World.msgPlayer(entity, {msg: 'You can\'t skin anything right now'});
		}
	}
};
