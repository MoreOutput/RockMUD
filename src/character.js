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
		{msg: ' is bleeding all over the place and looks nearly dead!', percentage: 0},
		{msg: ' is bleeding profusely.', percentage: 10},
		{msg: ' has some major cuts and brusies.', percentage: 20},
		{msg: ' has some large cuts and looks exhausted!', percentage: 30},
		{msg: ' has some minor cuts and brusies.', percentage: 40},
		{msg: ' is tired and bruised.', percentage: 50},
		{msg: ' is hurt and showing signs of fatigue.', percentage: 60},
		{msg: ' is looking tired and wounded.', percentage: 70},
		{msg: ' is barely wounded.', percentage: 80},
		{msg: ' is in great shape.', percentage: 90},
		{msg: ' still seems in perfect health!', percentage: 95},
		{msg: ' is in perfect health!', percentage: 100}
	];
};

Character.prototype.login = function(r, s, fn) {
	var name = r.msg.replace(/_.*/,'').toLowerCase();
	
	if (r.msg.length > 2) {
		if  (/^[a-z]+$/g.test(r.msg) === true && /[`~@#$%^&*()-+={}[]|]+$/g.test(r.msg) === false) {
			fs.stat('./players/' + name + '.json', function (err, stat) {
				if (err === null) {
					return fn(name, s, true);
				} else {
					return fn(name, s, false);
				}
			});
		} else {
			return s.emit('msg', {msg : '<b>Invalid Entry</b>. Enter your name:', res: 'login', styleClass: 'enter-name'});
		}
	} else {
		s.emit('msg', {
			msg: 'Invalid name choice, must be more than two characters.',
			res: 'login',
			styleClass: 'error'
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

Character.prototype.getPassword = function(s, fn) {
	var character = this;
	s.emit('msg', {msg: 'What is your password: ', res: 'enterPassword'});

	s.on('password', function (r) {
		if (r.msg.length > 7) {
			character.hashPassword(s.player.salt, r.msg, 1000, function(hash) {
				var roomObj;

				if (s.player.password === hash) {
					if (character.addPlayer(s)) {
						World.sendMotd(s);
						
						roomObj = World.getRoomObject(s.player.area, s.player.roomid);
						roomObj.playersInRoom.push(s.player);
						
						fn(s);
					} else {
						if (msg === undefined) {
							s.emit('msg', {msg: 'Error logging in, please retry.'});

							return s.disconnect();
						} else {
							s.emit('msg', {msg: msg, res: 'end'});
						}
					}
				} else {
					s.emit('msg', {msg: 'Wrong! You are flagged after 5 incorrect responses.', res: 'enterPassword'});
					return s.emit('msg', {msg: 'What is your password: ', res: 'enterPassword'});
				}
			});
		} else {
			s.emit('msg', {msg: 'Password has to be over eight characters.', res: 'enterPassword'});
			return s.emit('msg', {msg: 'What is your password: ', res: 'enterPassword'});
		}
	});
};

// Add a player reference object to the players array
Character.prototype.addPlayer = function(s) {
	var i = 0,
	x = null;

	for (i; i < World.players.length; i += 1) {
		if (s.player.name === World.players[i].name) {
			return false;
		}
	}
	
	World.players.push(s.player);

	return true;
};

// A New Character is saved
Character.prototype.create = function(r, s, fn) { 
	var character = this,
	socket;

	s.player.displayName = s.player.name[0].toUpperCase() + s.player.name.slice(1);
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
	s.player.baseStr += 10 + s.player.str;
	s.player.baseInt += 10 + s.player.int;
	s.player.baseWis += 10 + s.player.wis;
	s.player.baseCon += 10 + s.player.con;
	s.player.baseDex += 10 + s.player.dex;
	s.player.settings = {
		autosac: false,
		autoloot: true,
		autocoin: true,
		wimpy: {enabled: false, hp: 0},
		channels: {
			blocked: ['flame']
		}
	};

	socket = s.player.socket;

	s.player = character.rollStats(s.player);

	s.player.mv = s.player.cmv;
	s.player.mana = s.player.cmana;
	s.player.hp = s.player.chp;
	s.player.str = s.player.baseStr;
	s.player.int += s.player.baseInt;
	s.player.wis += s.player.baseWis;
	s.player.con += s.player.baseCon;
	s.player.dex += s.player.baseDex;

	character.generateSalt(function(salt) {
		s.player.salt = salt;

		character.hashPassword(salt, s.player.password, 1000, function(hash) {
			s.player.password = hash;
			s.player.socket = null;

			fs.writeFile('./players/' + s.player.name + '.json', JSON.stringify(s.player, null, 4), function (err) {
				var i = 0,
				roomObj;

				if (err) {
					throw err;
				}

				s.player.socket = socket;
				s.player.saved = new Date();
			
				if (character.addPlayer(s)) {
					s.leave('creation'); // No longer creating the character so leave the channel and join the game
					s.join('mud');

					World.sendMotd(s);

					if (!Cmds) {
						Cmds = require('./commands').cmd;				
					}
					
					Cmds.look(s.player);

					fn(s);
				} else {
					s.emit('msg', {msg: 'Error logging in, please retry.'});

					s.disconnect();
				}
			});
		});
	});
};

// Rolling stats for a new character
Character.prototype.rollStats = function(player) {
	var i = 0,
	j = 0,
	raceKey, // property of the race defines in raceList
	classKey; // property of the class defines in classList
	
	for (i; i < World.races.length; i += 1) {// looking for race
		if (World.races[i].name.toLowerCase() === player.race.toLowerCase()) { // found race
			for (raceKey in player) {
				if (raceKey in World.races[i] && raceKey !== 'name') { // found, add in stat bonus
					if (isNaN(World.races[i][raceKey])) {
						player[raceKey] = World.races[i][raceKey];
					} else {
						player[raceKey] += World.races[i][raceKey];
					}
				}
			}
		}
	}

	for (j; j < World.classes.length; j += 1) { // looking through classes
		if (World.classes[j].name.toLowerCase() === player.charClass.toLowerCase()) { // class match found
			for (classKey in player) {
				if (classKey in World.classes[j] && classKey !== 'name') {
					if (!World.classes[j][classKey].isArray) {
						if (!isNaN(World.classes[j][classKey])) {
							player[classKey] += World.classes[j][classKey];
						} else {
							player[classKey] = World.classes[j][classKey];
						}
					} else {
						player[classKey].push(World.classes[j][classKey]);
					}
				} 
			}
		}
	}

	player.carry = player.str * 10;
	player.ac = World.dice.getDexMod(player) + 2;
	
	return player;
};

Character.prototype.newCharacter = function(r, s, fn) {
	var character = this,
	i = 0,
	str = '',
	races = World.getPlayableRaces(),
	classes = World.getPlayableClasses();

	for (i; i < races.length; i += 1) {
		str += '<li class="race-list-'+ races[i].name + '">' + races[i].name + '</li>';

		if	(races.length - 1 === i) {
			s.emit('msg', {
				msg: s.player.name + ' is a new character! There are three steps until ' + s.player.name + 
				' is saved. The <strong>first step</strong> is to select a race: <ul>' + str +
				'</ul><p class="tip">You can learn more about each race by typing help race name</p>',
				res: 'selectRace',
				styleClass: 'race-selection'
			});		

			s.on('raceSelection', function (r) { 
				var cmdArr = r.msg.split(' ');

				r.cmd = cmdArr[0].toLowerCase();
				r.msg = cmdArr.slice(1).join(' ');
	
				character.raceSelection(r, s, function(r, s, fnd) {
					if (fnd) {
						i = 0;
						str = '';
						s.player.race = r.cmd;

						for (i; i < classes.length; i += 1) {
							str += '<li>' + classes[i].name + '</li>';

							if	(classes.length - 1 === i) {
								s.emit('msg', {
									msg: 'Great, <strong>two more steps to go!</strong> Now time to select a class for ' + s.player.name +
									'. Pick one of the following: <ul>' + 
									str + '</ul>', 
									res: 'selectClass', 
									styleClass: 'race-selection'
								});
								
								s.on('classSelection', function(r) {
									r.msg = r.msg.toLowerCase();

									character.classSelection(r, function(fnd) {
										if (fnd) {
											s.player.charClass = r.msg;
											
											s.emit('msg', {
												msg: s.player.name + ' is a ' + s.player.charClass + '! <strong>One more step before ' + s.player.name + 
												' is saved</strong>. Please define a password (8 or more characters):', 
												res: 'createPassword', 
												styleClass: 'race-selection'
											});
								
											s.on('setPassword', function(r) {
												if (r.msg.length > 7) {
													s.player.password = r.msg;
													character.create(r, s, fn);
												} else {
													s.emit('msg', {msg: 'Password should be longer', styleClass: 'error' });
												}
											});
										} else {
											s.emit('msg', {msg: 'That class is not on the list, please try again', styleClass: 'error' });
										}
									}); 
								});
							}
						}
					} else if (!fnd && r.cmd !== 'help') {
						s.emit('msg', {msg: 'That race is not on the list, please try again', styleClass: 'error' });
					}
				});
			});
		}
	}
};

Character.prototype.raceSelection = function(r, s, fn) {
	var i = 0,
	races = World.getPlayableRaces(),
	helpTxt;

	if (r.cmd !== 'help') {
		for (i; i < races.length; i += 1) {
			if (r.cmd === races[i].name.toLowerCase()) {
				return fn(r, s, true);
			}
		}

		return fn(r, s, false);
	} else {
		fs.readFile('./help/' + r.msg + '.html', 'utf-8', function (err, data) {
			if (!err) {
				s.emit('msg', {msg: data, styleClass: 'cmd-help' });

				return fn(r, s, false);
			} else {
				s.emit('msg', {msg: 'No help file found for this race.', styleClass: 'error' });

				return fn(r, s, false);
			}
		});
	}
};

Character.prototype.classSelection = function(r, fn) {
	var i = 0,
	classes = World.getPlayableClasses();

	for (i; i < classes.length; i += 1) {
		if (r.msg === classes[i].name.toLowerCase()) {
			return fn(true)
		}
	}

	return fn(false);
};

Character.prototype.save = function(player, fn) {
	var character = this,
	socket = player.socket;

	player.saved = new Date().toString();

	if (player.opponent) {
		player.opponent = null;;
	};

	player.socket = null;

	fs.writeFile('./players/' + player.name.toLowerCase() + '.json', JSON.stringify(player, null, 4), function (err) {
		player.socket = socket;
		
		if (err) {
			return World.msgPlayer(player, {msg: 'Error saving character.'});
		} else {
			return fn(player);
		}
	});
};

Character.prototype.hpRegen = function(target) {
	var conMod = World.dice.getConMod(target),
	total;

	// unless the charcter is a fighter they have 
	// a 10% chance of skipping hp regen

	if (target.chp < target.hp && target.thirst < 5 && target.hunger < 6) {
		total = World.dice.roll(conMod, 4);

		if (target.position === 'sleeping') {
			conMod += 3;
		}

		if (target.thirst >= 3 || target.hunger >= 3) {
			conMod -= 1;
		}

		if (!conMod) {
			conMod = 1;
		}

		total = total + target.level;

		target.chp += total;

		if (target.chp > target.hp) {
			target.chp = target.hp;
		}
	}
};

Character.prototype.manaRegen = function(target) {
	var intMod = World.dice.getIntMod(target),
	chanceMod = World.dice.roll(1, 10),
	total;

	if (target.cmana < target.mana && target.thirst < 5 && target.hunger < 6) {
		total = World.dice.roll(intMod, 8);
		// unless the charcter is a mage they have 
		// a 10% chance of skipping mana regen
		if (target.charClass === 'mage' || (target.charClass !== 'mage' && chanceMod > 1)) {
			if (target.position === 'sleeping') {
				intMod += 2;
			}

			if (target.thirst >= 3 || target.hunger >= 3) {
				intMod -= 1;
			}

			if (!intMod) {
				intMod = World.dice.roll(1, 2) - 1;
			}

			total = total + target.level;

			target.cmana += total;

			if (target.cmana  > target.mana ) {
				target.cmana  = target.mana ;
			}
		}
	}
};

Character.prototype.mvRegen = function(target) {
	var dexMod = World.dice.getDexMod(target),
	total;

	// unless the charcter is a thief they have 
	// a 10% chance of skipping move regen

	if (target.cmv < target.mv && target.thirst < 5 && target.hunger < 6) {
		total = World.dice.roll(dexMod, 8);

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

/*
* Returns all items that meet the query criteria, could be optimized if your
* slots are consistent.
*/
Character.prototype.getSlotsWithWeapons = function(player) {
	var i = 0,
	weapons = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item !== null 
			&& player.eq[i].item.itemType === 'weapon') {
			weapons.push(player.eq[i]);
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

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item !== null 
			&& player.eq[i].item.itemType === 'light' && player.eq[i].item.decay >= 1) {
			lights.push(player.eq[i]);
		}
	}

	return lights;
};

// All keys in the characters inventory
Character.prototype.getKeys = function(player) {
	var i = 0,
	lights = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item !== null 
			&& player.eq[i].item.itemType === 'light' && player.eq[i].item.decay >= 1) {
			lights.push(player.eq[i]);
		}
	}

	return lights;
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
		slot: 'hands'
	};
};

Character.prototype.getContainer = function(player, command) {
	var char = this,
	containers = char.getContainers(player),
	i = 0;

	for (i; i < containers.length; i += 1) {
		if (containers[i].name.indexOf(command.input)) {
			return containers[i];
		}
	}

	return false;
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

// returns a skill object in player.skills
Character.prototype.getSkill = function(player, skillId) {
	var i = 0;

	for (i; i < player.skills.length; i += 1) {
		if (player.skills[i].id === skillId) {
			return player.skills[i];
		}
	}

	return false;
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
		if (player.eq[i].item && player.eq[i].item.refId === item.refId) {
			player.eq[i].item = null;
		}
	}
	
	this.removeStatMods(player, item);

	World.msgPlayer(player, {
		msg: 'You stopped using a ' + item.short + '.'
	});
};

Character.prototype.getItem = function(player, command) {
	var i = 0,
	newArr = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].name.toLowerCase().indexOf(command.arg) !== -1) {
			return player.items[i];
		}
	}

	return false;
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
	roomObj = World.getRoomObject(target.area, target.roomId);

	weapon.equipped = true;
	
	slot.item = weapon;

	this.addStatMods(target, weapon);

	World.msgPlayer(target, {
		msg: 'You wield a ' + weapon.short + ' in your ' + slot.name + '.'
	});
};

Character.prototype.wearShield = function(target, shield) {
	var slot = this.getEmptyWeaponSlot(target);

	shield.equipped = true;
	
	slot.item = shield;

	this.addStatMods(target, shield);

	World.msgPlayer(target, {
		msg: 'You begin defending yourself with a ' + shield.short + '.'
	});
};

Character.prototype.wearLight = function(target, light) {
	var slot = this.getEmptyWeaponSlot(target);

	light.equipped = true;

	slot.item = light;

	this.addStatMods(target, light);

	if (slot.item.decay > 0) {
		World.msgPlayer(target, {
			msg: 'A ' + light.short + ' shines brightly as you hold it.'
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You being holding a ' + light.short + ' but it is burned out.'
		});
	}
};

Character.prototype.wearArmor = function(target, armor) {
	var slot = this.getSlot(target, armor.slot);

	if (slot) {
		armor.equipped = true;
		
		slot.item = armor;
		
		World.msgPlayer(target, {
			msg: 'You wear a ' + armor.short + ' on your ' + slot.name + '.'
		});
	} else {
		return false;
	}
};

Character.prototype.wearFloating = function(target, floating) {
		
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

Character.prototype.canSee = function(player, roomObj, light) {
	var canSee = player.sight,
	hasDarkvision = this.getAffect(player, 'darkvision');
		
	if (hasDarkvision && player.sight
		|| (player.sight && World.time.isDay && !roomObj.light)
	   	|| (player.sight && roomObj.light === true) ) {
		canSee = true;
	} else {
		canSee = false
	}
	
	return canSee;
};

Character.prototype.createCorpse = function(player) {
	player.level = 1;
	player.short = 'rotting corpse of a ' + player.name;
	player.decay = 1;
	player.itemType = 'corpse';
	player.corpse = true;
	player.weight = player.weight - 1;
	player.chp = 0;
	player.hp = 0;
	player.cmana = 0;
	player.mana = 0;
	player.cmv = 0;
	player.mv = 0;
};

Character.prototype.getLoad = function(s) {
	var load = Math.round((s.player.str + s.player.con / 4) * 10);
	
	return load;
};

Character.prototype.level = function(s, fn) {

};

Character.prototype.useSkill = function() {

};

// Add in gear modifiers and return the updated object
Character.prototype.calculateGear = function() {

};

module.exports.character = new Character();
