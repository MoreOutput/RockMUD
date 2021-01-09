/**
* Cast a spell attached to an item
 */
'use strict'

module.exports = function(entity, command, World) {
	var scroll = World.character.getItemByName(entity, command.arg);
	var level = entity.level;

	if (entity.mainStat !== 'int') {
		level -= 5;
	}

	if (level < 0) {
		level = 0;
	}

	if (scroll && scroll.spell && (scroll.itemType === 'scroll' || scroll.equipped === true)) {
		if (!scroll.spellLevel || scroll.spellLevel <= level) {
			if (scroll.spell.type.indexOf('passive') === -1) {
				if (command.msg === command.arg) {
					
				}
			} else {
				if (command.msg === command.arg) {
					command.input = 'self';
				}
			}

			command.skillObj = scroll.spell;

			this.cast(entity, command);
		} else {

		}
	} else {
		
	}
};
