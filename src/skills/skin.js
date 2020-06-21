/*
* Non combat skill. Turn a corpse into materials.
*/
'use strict'
var World = require('../world');

module.exports = function(skillObj, entity, roomObj, command) {
	var corpse; // a corpse from a slain entity in the same room as calling entity
	var fur;
	var food;
	var rndChance = 3; // must be highr than given value on 1d10
	var wait = 2;

	if (skillObj.wait) {
		wait = skillObj.wait;
	}

	if (command.second) {
		if (entity.position === 'standing' && !entity.fighting) {
			if (roomObj.items.length) {
				corpse = World.room.getItem(roomObj, command);

				if (corpse && corpse.itemType === 'corpse') {
					if (corpse.race === 'animal') {
						if (entity.charClass === 'ranger') {
							rndChance = 2;
						}

						if (World.dice.roll(1, 100) <= skillObj.train && World.dice.roll(1, 10) > rndChance) {
							food = World.createItem();
							food.displayName = corpse.displayName + ' meat';
							food.name = corpse.displayName + ' meat';
							food.short = corpse.displayName + ' meat';
							food.long = 'A thick slab of meat cut from ' + corpse.displayName + ' was left here';
							food.area = corpse.area;
							food.level = 1;
							food.itemType = 'food';
							food.material = 'flesh';
							food.modifiers.hunger = -1;

							World.room.addItem(roomObj, food);

							if (World.dice.roll(1, 3) === 1) {
								fur = World.createItem();
								fur.displayName = 'Fur';

							  //  World.room.addItem(roomObj, fur);
							}
							
							entity.wait += wait;

							World.msgPlayer(entity, {msg: 'You skin the ' + corpse.displayName});
						} else {
							World.msgPlayer(entity, {msg: 'You fail to butcher the corpse'});

							entity.wait += wait;
						}
					} else {
						World.msgPlayer(entity, {msg: 'You can only skin animals'});
					}
				} else {
					World.msgPlayer(entity, {msg: 'That isn\'t a corpse'});
				}
			} else {
				World.msgPlayer(entity, {msg: 'There is nothing to skin'});
			}
		} else {
			World.msgPlayer(entity, {msg: 'You can\'t skin anything right now'});
		}
	} else {
		World.msgPlayer(entity, {msg: 'Skin what exactly?'});
	}
};
