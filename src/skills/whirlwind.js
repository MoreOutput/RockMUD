/*
* Melee area attack
* Has a chance to miss some targets, based on train
* Begins combat with all targets
* 
* Combat skills must output a Skill Profile Object
*/
'use strict'
module.exports = function(skillObj, player, roomObj, command, World) {
	var weaponSlots,
	i = 0,
	strMod = World.dice.getStrMod(player),
	damage = 0,
	opponent,
	skillOutput,
	rollDamage = function(opponent) {
		// factor in weapon damage
		return World.dice.roll(1, player.level + 1) + strMod + player.damroll + 1;
	};

	if (!roomObj) {
		roomObj = World.getRoomObject(player.area, player.roomid);
	}

	if (roomObj.monsters.length) {
		if (player.position === 'standing') {
			if (!player.fighting) {
				World.addCommand({
					cmd: 'alert',
					msg: '<strong>You begin to spin wildly...</strong>',
					noPrompt: true,
					styleClass: 'player-hit warning'
				}, player);
			}

			var defenders = [];
			var skills  = [];

			if (skillObj.train > 75 && World.dice.roll(1, 100) <= skillObj.train) {
				for (i; i < roomObj.monsters.length; i += 1) {
					opponent = roomObj.monsters[i];

					damage = rollDamage(opponent);

					skillOutput = World.combat.createSkillProfile(player, skillObj);
					skillOutput.defenderMods.chp = -damage;
					skillOutput.defenderRefId = opponent.refId;

					if (World.dice.roll(1,2) === 1) {
						skillOutput.winMsg = '<strong class="red">The ferocity of your Whirlwind hits  ' + opponent.short + ' so hard their head nearly comes off!</strong>';
					} else {
						skillOutput.winMsg = '<strong class="yellow">Your Whirlwind slices through  ' + opponent.short + ', spilling its guts onto the ground.</strong>';
					}

					if (i === 0) {
						skillOutput.msgToAttacker = 'You spin around the room slashing at everything and hitting ' + opponent.name +'! (' + damage + ')';
					} else {
						skillOutput.msgToAttacker = 'Your Whirlwind also hits ' + opponent.name +'! (' + damage + ')';
					}
					
					skillOutput.msgToDefender =  player.displayName + ' spins around the room slashing at you with murderous intent!';
					skillOutput.msgToRoom = player.displayName + ' spins around the room wildly slashing at everyone!';
					skillOutput.attackerMods.wait += 4;

					defenders.push(opponent);

					skills.push(skillOutput);
				}

				World.combat.processMultiSkill(player, defenders, skills);
			} else {
				skillOutput = World.combat.createSkillProfile(player, skillObj);

				if (!player.fighting) {
					skillOutput.attackerMods.wait += 3;
					skillOutput.msgToAttacker = 'You begin to turn and stumble. Your whirlwind attempt fails!';

					World.character.applyMods(player, skillOutput.attackerMods);
		
					World.addCommand({
						cmd: 'alert',
						msg: skillOutput.msgToAttacker,
						styleClass: 'warning'
					}, player);
				} else {
					skillOutput.attackerMods.wait += 3;

					for (i; i < roomObj.monsters.length; i += 1) {
						let skillObj = {}
						opponent = roomObj.monsters[i];
	
						skillOutput = World.combat.createSkillProfile(player, skillObj);
	
						damage = rollDamage(opponent);
	
						skillOutput = World.combat.createSkillProfile(player, skillObj);
						skillOutput.defenderMods.chp = -damage;
						skillOutput.winMsg = '<span class="red">Won with Whirlwind!</span>';
						skillOutput.msgToAttacker = 'You spin around the room slashing at everything and hitting ' + opponent.name +'! (' + damage + ')';
						skillOutput.msgToDefender = 'You spin around the room slashing at everything and hitting ' + opponent.name +'! (' + damage + ')';
						skillOutput.msgToRoom = player.displayName + ' spins around the room slashing at everyone!';
						skillOutput.attackerMods.wait += 3;
	
						defenders.push(opponent);
						skills.push(skillOutput);
					}
	
					World.combat.processMultiSkill(player, defenders, skills);
				}
			}
		}
	} else {
		skillOutput = World.combat.createSkillProfile(player, skillObj);
		skillOutput.attackerMods.wait += 2;
		skillOutput.msgToAttacker = 'You spin around like an idiot. There is no one here.';
		
		World.character.applyMods(player, skillOutput.attackerMods);
	
		World.addCommand({
			cmd: 'alert',
			msg: skillOutput.msgToAttacker,
			styleClass: 'warning'
		}, player);
	}
};