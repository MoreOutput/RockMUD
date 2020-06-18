/**
 * This file serves as an example of implementing a command on a file basis
 * This command will be added to the object prototype outlined in commands.
 */
'use strict'
var World = require('../world');

module.exports = function(entity, command) {
	var scroll = World.character.getItem(entity, command),
	level = entity.level;

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
					command.last = 'self';
				}
			}

			command.skillObj = scroll.spell;

			this.cast(entity, command);
		} else {

		}
	} else {
		
	}
};
