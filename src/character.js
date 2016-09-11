/*
* Characters.js controls everything dealing with a 'Character' which includes in game creatures.
* No in game commands are defiend here; Commands.js does share some function names with this module, 
* see: save().
*/
'use strict';
var fs = require('fs'),
crypto = require('crypto'),
Room = require('./rooms').room,
World = require('./world').world,
Cmds,
Character = function () {
	this.statusReport = [
		{msg: ' is <span class="red">bleeding all over the place</span> and looks nearly dead!', percentage: 0},
		{msg: ' is <span class="red">bleeding</span> profusely.', percentage: 10},
		{msg: ' has some major cuts and brusies.', percentage: 20},
		{msg: ' has some large cuts and looks exhausted!', percentage: 30},
		{msg: ' has some minor cuts and brusies.', percentage: 40},
		{msg: ' is tired and bruised.', percentage: 50},
		{msg: ' is hurt and showing <span class="grey">signs of fatigue</span>.', percentage: 60},
		{msg: ' is looking tired and wounded.', percentage: 70},
		{msg: ' is barely wounded.', percentage: 80},
		{msg: ' is in great shape.', percentage: 90},
		{msg: ' still seems in perfect health!', percentage: 95},
		{msg: ' is in <span class="green">perfect health</span>!', percentage: 100}
	];
};

Character.prototype.login = function(r, s, fn) {
	var name = r.msg.replace(/_.*/,'').toLowerCase();
	
	if (r.msg.length > 2) {
		if  (/^[a-z]+$/g.test(r.msg) === true && /[`~@#$%^&*()-+={}[]|]+$/g.test(r.msg) === false) {
			fs.readFile('./players/' + name + '.json', function (err, r) {
				var i = 0;

				if (err === null) {
					for (i; i < World.players.length; i += 1) {
						if (World.players[i].name.toLowerCase() === name) {
							World.msgPlayer(World.players[i], {
								msg: 'Relogging....',
								styleClass: 'error',
								noPrompt: true
							});
							
							World.players[i].socket.disconnect();

							s.player = World.players[i];
						}				
					}

					if (!s.player) {
						s.player = JSON.parse(r);
					}

					s.player.name = s.player.name.charAt(0).toUpperCase() + s.player.name.slice(1);
	
					if (s.player.lastname !== '') {
						s.player.lastname = s.player.lastname.charAt(0).toUpperCase() + s.player.lastname.slice(1);
					}

					s.player.sid = s.id;
					s.player.socket = s;
		
					s.player.logged = false;
					s.player.verifiedPassword = false;
					s.player.verifiedName = false;
					
					return fn(s, true);
				} else {
					return fn(s, false);
				}
			});
		} else {
			return World.msgPlayer(s, {
				msg : '<b>Invalid Entry</b>. Enter your name:', 
				styleClass: 'enter-name',
				noPrompt: true
			});
		}
	} else {
		World.msgPlayer(s, {
			msg: 'Invalid name choice, must be more than two characters.',
			styleClass: 'error',
			noPrompt: true
		});
	}
};

Character.prototype.load = function(name, s, fn) {
	fs.readFile('./players/' + name + '.json', function (err, r) {
		if (err) {
			throw err;
		}
		
		s.player = JSON.parse(r);

		s.player.name = s.player.name.charAt(0).toUpperCase() + s.player.name.slice(1);

		if (s.player.lastname !== '') {
			s.player.lastname = s.player.lastname = s.player.lastname.charAt(0).toUpperCase() + s.player.lastname.slice(1);
		}

		s.player.sid = s.id;
		s.player.socket = s;

		s.player.logged = true;
		s.player.verifiedPassword = true;
		s.player.verifiedName = true;
				
		return fn(s);
	});
};

Character.prototype.hashPassword = function(salt, password, iterations, fn) {
	var hash = password,
	i = 0;
		
	for (i; i < iterations; i += 1) {
		hash = crypto.createHmac('sha512', salt).update(hash).digest('hex');
	}

	return fn(hash);
};

Character.prototype.generateSalt = function(fn) {
	crypto.randomBytes(128, function(ex, buf) {
		if (ex) {
			throw ex;
		}

		fn(buf.toString('hex'));
	});
};

Character.prototype.getPassword = function(s, command, fn) {
	var character = this;

	if (command.cmd.length > 7) {
		character.hashPassword(s.player.salt, command.cmd, 1000, function(hash) {
			var roomObj;

			if (s.player.password === hash) {
				if (character.addPlayer(s)) {
					s.player = World.setupBehaviors(s.player);
					
					World.sendMotd(s);
					
					roomObj = World.getRoomObject(s.player.area, s.player.roomid);

					roomObj.playersInRoom.push(s.player);

					fn(s);
				} else {
					if (r.msg === undefined) {
						World.msgPlayer(s, {
							msg: 'Error logging in, please retry.',
							noPrompt: true
						});

						return s.disconnect();
					} else {
						World.msgPlayer(s, {
							msg: command.cmd,
							noPrompt: true
						});
					}
				}
			} else {
				World.msgPlayer(s, {
					msg: 'Wrong! You are flagged after 5 incorrect responses.',
					noPrompt: true
				});

				return World.msgPlayer(s, {
					msg: 'What is your password: ',
					evt: 'reqPassword',
					noPrompt: true
				});
			}
		});
	} else {
		return World.msgPlayer(s, {
			msg: 'What is your password: ',
			evt: 'reqPassword',
			noPrompt: true
		});
	}
};

// Add a player reference object to the players array
Character.prototype.addPlayer = function(s) {
	var i = 0;

	for (i; i < World.players.length; i += 1) {
		if (s.player.name === World.players[i].name) {
			World.players.splice(i, 1);
		}
	}

	World.players.push(s.player);

	return true;
};

// A New Character is saved
Character.prototype.create = function(s) { 
	var character = this,
	raceObj,
	classObj,
	socket;
	
	raceObj = World.getRace(s.player.race);

	classObj = World.getClass(s.player.charClass);

	s.player = World.extend(s.player, raceObj);
	s.player = World.extend(s.player, classObj);

	s.player.chp += 30;
	s.player.cmana += 5;
	s.player.cmv += 100;
	s.player.isPlayer = true;
	s.player.salt = '';
	s.player.created = new Date();
	s.player.saved = null;
	s.player.role = 'player';
	s.player.area = 'Midgaard';
	s.player.roomid = '1';
	s.player.trains += 25;
	s.player.deaths = 0;
	s.player.baseStr += 12 + s.player.str;
	s.player.baseInt += 12 + s.player.int;
	s.player.baseWis += 12 + s.player.wis;
	s.player.baseCon += 12 + s.player.con;
	s.player.baseDex += 12 + s.player.dex;
	s.player.settings = {
		autosac: false,
		autoloot: true,
		autocoin: true,
		wimpy: 0,
		channels: {
			blocked: ['flame']
		}
	};

	socket = s.player.socket;

	s.player.mv = s.player.cmv;
	s.player.mana = s.player.cmana;
	s.player.hp = s.player.chp;
	s.player.str = s.player.baseStr;
	s.player.int = s.player.baseInt;
	s.player.wis = s.player.baseWis;
	s.player.con = s.player.baseCon;
	s.player.dex = s.player.baseDex;

	character.generateSalt(function(salt) {
		s.player.salt = salt;

		character.hashPassword(salt, s.player.password, 1000, function(hash) {
			s.player.password = hash;
			s.player.socket = null;
			
			fs.writeFile('./players/' + s.player.name + '.json', JSON.stringify(s.player, null), function (err) {
				character.load(s.player.name, s, function(s) {
					var roomObj;

					if (err) {
						throw err;
					}

					if (character.addPlayer(s)) {
						s.leave('creation');
						s.join('mud');

						World.sendMotd(s);

						roomObj = World.getRoomObject(s.player.area, s.player.roomid);

						roomObj.playersInRoom.push(s.player);

						Cmds.look(s.player, {
							roomObj: roomObj
						});
					} else {
						World.msgPlayer(s, {
							msg: 'Error logging in. Reconnect and retry.'
						});

						s.disconnect();
					}
				});
			});
		});
	});
};

// recursive function fired in server.js, checked when a new character is being made
Character.prototype.newCharacter = function(s, command) {
	var character = this,
	i = 0;
	
	if (!Cmds) {
		Cmds = require('./commands').cmd;
	}
	
	if (s.player.creationStep === 1) {
		World.msgPlayer(s, {
			msg: '<p>' + s.player.displayName + ' is a new character! There are three steps until '
				+ s.player.displayName + ' is saved. The <strong>first step</strong> is to '
				+ '<strong class="red">select a race from the list below by typing in the full name</strong>.',
			noPrompt: true
		});
		
		Cmds.help(s.player, {
			msg: 'races',
			noPrompt: true
		});
		
		s.player.creationStep = 2;

		command.firstCall = true;
	}

	switch (s.player.creationStep) {
		case 2:
			if (!command.firstCall) {
				if (World.isPlayableRace(command.cmd)) {
					s.player.creationStep = 3;
					s.player.race = command.cmd;
				
					World.msgPlayer(s, {
						msg: 'Well done ' + s.player.displayName + ' is a ' + s.player.race + '. Now for the '
							+ '<strong>second step</strong>, '
							+ '<strong class="red">select a class from the list below by entering the full name</strong>.',
						noPrompt: true
					});

					Cmds.help(s.player, {
						msg: 'classes',
						noPrompt: true
					});
				} else {
					if (command.cmd !== 'help') {
						World.msgPlayer(s, {
							msg: 'Not a valid race. Type <span class="green">help races</span> to see the full list. '
								+ 'You can also access any help file by typing <span class="yellow">help [subject]</span>',
							noPrompt: true
						});
					} else {
						Cmds.help(s, {
							msg: command.msg,
							noPrompt: true
						});
					}
				}
			}
		
			break;
		case 3:
			if (World.isPlayableClass(command.cmd)) {
				s.player.creationStep = 4;
				s.player.charClass = command.cmd;
				
				World.msgPlayer(s, {
					msg: s.player.displayName + ' is a ' + s.player.charClass
						+ '! <strong>Two more steps before ' + s.player.displayName
						+ ' is saved</strong>. Is ' + s.player.displayName + ' <strong class="red">(m)ale</strong> or <strong class="red">(f)emale</strong>?',
					noPrompt: true,
					styleClass: 'password-request'
				});
			} else {
				if (command.cmd !== 'help') {
					World.msgPlayer(s, {
						msg: 'Not a valid class. Type <span class="red">help classes</span> '
							+ 'to see the full list of playable classes.',
						noPrompt: true
					});
				} else {
					Cmds.help(s, {
						msg: command.msg,
						noPrompt: true
					});
				}
			}

			break;
		case 4:
			if (command.cmd === 'm' || command.cmd === 'f' || command.cmd === 'male' || command.cmd === 'female') {
				s.player.creationStep = 5;

				if (command.cmd[0] === 'm') {
					s.player.sex = 'male';
				} else {
					s.player.sex = 'female';
				}
				
				World.msgPlayer(s, {
					msg: s.player.displayName + ' is a ' + s.player.sex
						+ '! <strong>One more step before ' + s.player.displayName
						+ ' is saved</strong>. Please define a password (<strong class="yellow">8 or more characters</strong>):', 
					evt: 'reqPassword',
					noPrompt: true,
					styleClass: 'password-request'
				});
			} else {
				if (command.cmd !== 'help') {
					World.msgPlayer(s, {
						msg: 'Not a valid sex. Enter male or female to define a sex for ' + s.player.displayName  + '.',
						noPrompt: true
					});
				} else {
					Cmds.help(s, {
						msg: command.msg,
						noPrompt: true
					});
				}
			}

			break;
		case 5:
			if (command.cmd.length > 7) {
				s.player.password = command.cmd;
				s.player.creationStep = 0;

				character.create(s);
			} else {
				World.msgPlayer(s, {
					msg: 'Password should be longer',
					styleClass: 'error',
					evt: 'reqPassword',
					noPrompt: true
				});
			}
		
			break;
		default:
			break;
	};
};

Character.prototype.save = function(player, fn) {
	var character = this,
	socket = player.socket;

	if (player.isPlayer) {
		player.saved = new Date().toString();

 		if (player.opponent) {
			player.opponent = null;
		};

		player.socket = null;

		player = World.sanitizeBehaviors(player);

		fs.writeFile('./players/' + player.name.toLowerCase() + '.json', JSON.stringify(player, null), function (err) {
			player.socket = socket;

			player = World.setupBehaviors(player);

			if (err) {
				return World.msgPlayer(player, {msg: 'Error saving character. Please let the staff know.'});
			} else {
				if (fn) {
					return fn(player);
				}
			}
		});
	} else if (player.persist && World.config.persistence) {
		// saving a world item, which means saving the area it is in
	}
};

Character.prototype.hpRegen = function(target) {
	var conMod = World.dice.getConMod(target) + 1,
	total;

	if (target.chp < target.hp && target.thirst < 8 && target.hunger < 9) {
		if (target.position === 'sleeping') {
			conMod += 3;
		}

		if (target.thirst >= 3 || target.hunger >= 3) {
			conMod -= 1;
		}

		if (!conMod) {
			conMod = 1;
		}

		total = World.dice.roll(conMod, 4) + target.level;

		target.chp += total;

		if (target.chp > target.hp) {
			target.chp = target.hp;
		}
	}
};

Character.prototype.manaRegen = function(target) {
	var intMod = World.dice.getIntMod(target) + 1,
	chanceMod = World.dice.roll(1, 10),
	total;

	if (target.cmana < target.mana && target.thirst < 8 && target.hunger < 9) {
		if (target.mainStat === 'int' || chanceMod > 2) {
			if (target.position === 'sleeping') {
				intMod += 2;
			}

			if (target.thirst >= 3 || target.hunger >= 3) {
				intMod -= 1;
			}

			if (!intMod) {
				intMod = World.dice.roll(1, 2) - 1;
			}
			
			total = World.dice.roll(intMod, 8, target.level/3);

			target.cmana += total;

			if (target.cmana > target.mana ) {
				target.cmana = target.mana ;
			}
		}
	}
};

Character.prototype.mvRegen = function(target) {
	var dexMod = World.dice.getDexMod(target) + 1,
	total;
	
	if (target.cmv < target.mv && target.thirst < 7 && target.hunger < 8) {
		if (target.position === 'sleeping') {
			dexMod += 3;
		} else {
			dexMod += 1;
		}

		if (target.thirst >= 3 || target.hunger >= 3) {
			dexMod -= 1;
		}

		if (!dexMod) {
			dexMod = 1;
		}

		total = World.dice.roll(dexMod, 7) - target.size.value;

		target.cmv += total;

		if (target.cmv > target.mv) {
			target.cmv = target.mv;
		}
	}
};

Character.prototype.hunger = function(target) {
	var character = this,
	conMod = World.dice.getConMod(target),
	total;

	if (target.hunger < 10) {
		total = World.dice.roll(1, 12 + conMod);

		if (total > 9) {
			target.hunger += 1;
		}

		if (target.hunger > 5) {
			target.chp -= Math.round(World.dice.roll(1, 5 + target.hunger) + (target.level - conMod));

			if (target.chp < target.hp) {
				target.chp = 0;
			}

			if (World.dice.roll(1, 2) === 1) {
				World.msgPlayer(target, {msg: 'You feel hungry.', styleClass: 'hunger'});
			} else {
				World.msgPlayer(target, {msg: 'Your stomach begins to growl.', styleClass: 'hunger'});
			}
		}
	} else {
		/*
		Need death before this can be completed

		target.chp -= (World.dice.roll(1, 5 + target.hunger) - conMod) * 2;

		if (target.chp < target.hp) {
			target.chp = 0;
		}
		*/

		World.msgPlayer(target, {msg: 'You are dying of hunger.', styleClass: 'hunger'});
	}
};

Character.prototype.thirst = function(target) {
	var character = this,
	total,
	dexMod = World.dice.getDexMod(target);

	if (target.thirst < 10) {
		total = World.dice.roll(1, 12 + dexMod);

		if (total > 10) {
			target.thirst += 1;
		}

		if (target.thirst > 5) {
			target.chp -= Math.round(World.dice.roll(1, 5 + target.thirst) + (target.level - dexMod));

			if (target.chp < target.hp) {
				target.chp = 0;
			}

			if (World.dice.roll(1, 2) === 1) {
				World.msgPlayer(target, {msg: 'You are thirsty.', styleClass: 'thirst'});
			} else {
				World.msgPlayer(target, {msg: 'Your lips are parched.', styleClass: 'thirst'});
			}
		}
	} else {
		/*
		Need death before this can be completed

		target.chp -= (World.dice.roll(1, 5 + target.hunger) - conMod) * 2;

		if (target.chp < target.hp) {
			target.chp = 0;
		}
		*/

		World.msgPlayer(target, {msg: 'You are dying of thirst.', styleClass: 'thirst'});
	}
};

// Removes experience and gained levels from character
Character.prototype.xpRot = function() {

};

// push an item into a players inventory, checks items to ensure a player can use it
Character.prototype.addItem = function(player, item) {
	player.items.push(item);
};

Character.prototype.getItemByRefId = function(player, refId) {
	var i = 0;

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].refId === refId) {
			return player.items[i]
		}
	}

	return false;
};

/*
* Returns all items that meet the query criteria, could be optimized if your
* slots are consistent.
*/
Character.prototype.getSlotsWithWeapons = function(player) {
	var i = 0,
	weapon,
	weapons = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item !== null) {
			weapon = this.getItemByRefId(player, player.eq[i].item);

			if (weapon.refId === player.eq[i].item) {
				weapons.push(player.eq[i]);
			}
		}
	}

	return weapons;
};

Character.prototype.getWeaponSlots = function(player) {
	var i = 0,
	slots = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands') {
			slots.push(player.eq[i]);
		}
	}

	return slots;
};

Character.prototype.getEmptyWeaponSlot = function(player) {
	var i = 0;

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && !player.eq[i].item) {
			return player.eq[i];
		}
	}

	return false;
};

Character.prototype.getSlotsWithShields = function(player) {
	var i = 0,
	shields = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item 
			&& player.eq[i].item.itemType === 'shield') {
			shields.push(player.eq[i]);
		}
	}

	return shields;
};

Character.prototype.getLights = function(player) {
	var i = 0,
	lights = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].equipped === true && player.items[i].lightDecay > 0) {
			lights.push(player.items[i]);
		}
	}

	return lights;
};

// All keys in the characters inventory
Character.prototype.getKeys = function(player) {
	var i = 0,
	keys = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].isKey) {
			keys.push(player.items[i]);
		}
	}

	return keys;
};

// if a character has a specific key
// keyId is the id found on exitObj.door.id
Character.prototype.getKey = function(player, keyId) {
	var i = 0,
	key;

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].isKey && player.items[i].id === keyId) {
			return player.items[i];
		}
	}

	return false;
};

Character.prototype.getStatsFromItems = function(items, fn) {
	var character = this,
	itemMods = {};


};

Character.prototype.getStatsFromAffects = function(affects, fn) {

};

Character.prototype.getStatsFromEq = function(eq, fn) {

};

Character.prototype.getFist = function(player) {
	return {
		name: 'Fighting with your bare hands!',
		level: player.level,
		diceNum: player.diceNum,
		diceSides: player.diceSides,
		itemType: 'weapon',
		equipped: true,
		attackType: player.attackType,
		weaponType: 'fist',
		material: 'flesh',
		modifiers: {},
		diceMod: 0,
		slot: 'hands',
		short: 'your ' + player.handsNoun + 's'
	};
};

Character.prototype.getContainer = function(player, command) {
	return World.search(player.items, 'container', {arg: command.input});
};

Character.prototype.getContainers = function(player) {
	var i = 0,
	containers = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].itemType === 'container') {
			containers.push(player.items[i]);
		}
	}

	return containers;
};

Character.prototype.addToContainer = function(container, item) {
	container.items.push(item);
};

Character.prototype.getFromContainer = function(container, command) {
	var i = 0;

	for (i; i < container.items.length; i += 1) {
		if (container.items[i].name.toLowerCase().indexOf(command.arg) !== -1) {
			return container.items[i];
		}
	}

	return false;
};

Character.prototype.removeFromContainer = function(container, item) {
	var i = 0,
	newArr = [];

	for (i; i < container.items.length; i += 1) {
		if (container.items[i].refId !== item.refId) {
			newArr.push(container.items[i]);
		}
	}

	container.items = newArr;
};

Character.prototype.getBottle = function(player, command) {
	var char = this,
	containers = char.getBottles(player),
	i = 0;

	for (i; i < containers.length; i += 1) {
		if (containers[i].name.indexOf(command.input) !== -1) {
			return containers[i];
		}
	}

	return false;
};

Character.prototype.getBottles = function(player) {
	var i = 0,
	containers = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].itemType === 'bottle') {
			containers.push(player.items[i]);
		}
	}

	return containers;
};

Character.prototype.addToBottle = function(container, item) {
	container.items.push(item);
};

Character.prototype.getSkill = function(player, skillName) {
	var i = 0;

	for (i; i < player.skills.length; i += 1) {
		if (player.skills[i].id.toLowerCase().indexOf(skillName) !== -1) {
			return player.skills[i];
		}
	}

	return false;
};

Character.prototype.getSkillById = function(player, skillId) {
	var i = 0;

	for (i; i < player.skills.length; i += 1) {
		if (player.skills[i].id === skillId) {
			return player.skills[i];
		}
	}

	return false;
};

Character.prototype.meetsSkillPrepreqs = function(player, skillObj) {
	var prop,
	requiredSkillObj;
	
	if (skillObj.prerequisites) {
		for (prop in skillObj.prerequisites) {
			if (prop !== 'skill') {
				if (!player[prop]) {
					return false;
				} else if (skillObj.prerequisites[prop].toString().indexOf(player[prop]) === -1) {
					return false;
				}
			} else {
				requiredSkillObj = this.getSkillById(player, skillObj.prerequisites.skill.id);
				
				if (!requiredSkillObj) {
					return false
				} else {
					if (skillObj.prerequisites.skill.prop) {
						if (requiredSkillObj[skillObj.prerequisites.skill.prop] >= skillObj.prerequisites.skill.value) {
							return false;
						}
					}
				}
			}
		}
		
		return true;
	} else {
		return true;
	}
};

Character.prototype.removeItem = function(player, item) {
	var i = 0,
	newArr = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].refId !== item.refId) {
			newArr.push(player.items[i]);
		}
	}

	player.items = newArr;
};

Character.prototype.removeEq = function(player, item) {
	var i = 0;

	item.equipped = false;

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].item === item.refId) {
			player.eq[i].item = null;
		}
	}
	
	this.removeStatMods(player, item);

	World.msgPlayer(player, {
		msg: 'You stopped using ' + item.short + '.'
	});
};

Character.prototype.getItem = function(player, command) {
	return World.search(player.items, command);
};

Character.prototype.getItems = function(player, command) {
	var i = 0,
	newArr = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].name.toLowerCase().indexOf(command.arg) !== -1) {
			newArr.push(player.items[i]);
		}
	}

	return newArr;
};

Character.prototype.addStatMods = function(player, item) {
	var prop;

	for (prop in item.modifiers) {
		if (player[prop]) {
			player[prop] += item.modifiers[prop];
		}
	}
};

Character.prototype.removeStatMods = function(player, item) {
	var prop;

	for (prop in item.modifiers) {
		if (player[prop]) {
			player[prop] -= item.modifiers[prop];
		}
	}
}

Character.prototype.wearWeapon = function(target, weapon) {
	var slot = this.getEmptyWeaponSlot(target),
	roomObj;

	if (slot) {
		roomObj = World.getRoomObject(target.area, target.roomId);
		weapon.equipped = true;
	
		slot.item = weapon.refId;

		this.addStatMods(target, weapon);

		World.msgPlayer(target, {
			msg: 'You wield a ' + weapon.displayName + ' in your ' + slot.name.toLowerCase() + '.'
		});
	} else {
		World.msgPlayer(target, {
			msg: 'Your hands are too full to wield a ' + weapon.short + '.'
		});
	}
};

Character.prototype.wearShield = function(target, shield) {
	var slot = this.getEmptyWeaponSlot(target);

	if (slot) {
		shield.equipped = true;
	
		slot.item = shield.refId;

		this.addStatMods(target, shield);

		World.msgPlayer(target, {
			msg: 'You begin defending yourself with a ' + shield.displayName + '.'
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t use a ' + shield.short + ' because your hands are full.'
		});
	}
};

Character.prototype.wearArmor = function(target, armor) {
	var slot = this.getSlot(target, armor.slot);

	if (slot) {
		armor.equipped = true;

		slot.item = armor.refId;
		
		World.msgPlayer(target, {
			msg: 'You wear a ' + armor.short + ' on your ' + slot.name.toLowerCase() + '.'
		});
	} else {
		return false;
	}
};

Character.prototype.removeWeapon = function() {

};

Character.prototype.getSlot = function(target, slotName) {
	var i = 0;

	for (i; i < target.eq.length; i += 1) {
		if (target.eq[i].slot === slotName) {
			return target.eq[i];
		}
	}

	return false;
};

Character.prototype.getEmptyWeaponSlot = function(target) {
	var i = 0;

	for (i; i < target.eq.length; i += 1) {
		if (target.eq[i].slot === 'hands'
			&& !target.eq[i].item) {
			return target.eq[i];
		}
	}

	return false;
};

Character.prototype.getStatusReport = function(player) {
	var i = 0;

	for (i; i < this.statusReport.length; i += 1) {
		if (this.statusReport[i].percentage >= ((player.chp/player.hp) * 100) ) {
			return player, this.statusReport[i];
		}
	}
};

Character.prototype.getAffect = function(player, affectName) {
	var i = 0;

	for (i; i < player.affects.length; i += 1) {
		if (player.affects[i].id === affectName) {
			return player.affects[i];
		}
	}

	return false;
};

Character.prototype.removeAffect = function(player, affectName) {
	var i = 0;

	for (i; i < player.affects.length; i += 1) {
		if (player.affects[i].id === affectName) {
			return player.affects[i];
		}
	}

	return false;
};

Character.prototype.addAffect = function(player) {
	var i = 0;

	for (i; i < player.affects.length; i += 1) {
		if (player.affects[i].id === affectName) {
			player.affects[i].decay += 1;

			return false;
		}
	}

	player.affects.push(affect);
	
	return true;;
};

// Can the character see, checks sight property
// if the room is dark, if the player has needed vision skills
// and if its currently dark outside
Character.prototype.canSee = function(player, roomObj) {
	var canSee = player.sight,
	light,
	hasDarkvision;

	if (canSee && !roomObj.light && !World.time.isDay) {
		hasDarkvision = this.getAffect(player, 'darkvision');

		if (!hasDarkvision) {
			canSee = false;
		}
	}
	
	if (!canSee && player.sight) {
 		light = this.getLights(player)[0];
		
		if (light) {
			canSee = true;
		}
	}

	return canSee;
};

Character.prototype.createCorpse = function(player) {
	player.level = 1;
	player.short = 'rotting corpse of a ' + player.name;
	player.long = 'The ' + player.short + ' is here on the ground';
	player.decay = 1;
	player.itemType = 'corpse';
	player.corpse = true;
	player.chp = 0;
	player.hp = 0;
	player.cmana = 0;
	player.mana = 0;
	player.cmv = 0;
	player.mv = 0;
};

Character.prototype.getMaxCarry = function(player) {
	if (player.mainStat && player.mainStat === 'con') {
		return Math.round((player.str + player.con / 2) * 10 + player.size.value);
	} else  {
		return Math.round((player.str + player.con / 3) * 10 + player.size.value);
	}
};

Character.prototype.level = function(player) {
	var mods = World.dice.getMods(player, 0),
	hpBonus = World.dice.roll(1, 6, mods.con),
	mvBonus = World.dice.roll(1, 4, mods.dex),
	manaBonus = World.dice.roll(1, 4, mods.int),
	newTrains = 4;

	if (player.mainStat === 'wis') {
		newTrains += 1;
	}

	if (player.wisMod > 3) {
		newTrains += 1;
	}

	if (player.intMod > 4) {
		newTrains += 1;
	}
 
	if (player.mainStat === 'con' || player.mainStat === 'str') {
		hpBonus += World.dice.roll(1, 4);
		manaBonus = 0;
	}

	if (player.mainStat === 'wis' || player.mainStat === 'int') {
		hpBonus -= 5;
		manaBonus += World.dice.roll(1, 4);
	}

	if (player.mainStat === 'dex') {
		hpBonus -= 3;
		mvBonus += World.dice.roll(1, 6);	
	}

	player.level += 1;
	player.hp += hpBonus;
	player.mana += manaBonus;
	player.mv += mvBonus;
	player.trains += newTrains;
	player.expToLevel = 1000 * player.level;
	player.exp = 0;

	World.msgPlayer(player, {
		msg: 'You have reached level ' + player.level + '. Your efforts result in ' 
			+ hpBonus + ' hp, ' + manaBonus + ' mana, ' + mvBonus + ' movement and '
			+ newTrains + ' new trains.'
	});

	this.save(player);
};

// Add in gear modifiers and return the updated object
Character.prototype.calculateGear = function() {

};

module.exports.character = new Character();

