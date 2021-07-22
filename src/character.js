/*
* Characters.js controls everything dealing with a 'Character' which includes in game creatures
* No in game commands are defiend here; Commands.js does share some function names with this module,
* see: save().
*/
'use strict';

var fs = require('fs');
var crypto = require('crypto');
var World;
var Character = function (newWorld) {
	World = newWorld;

	this.statusReport = [
		{msg: ' is <span class="red">bleeding all over the place</span> and looks <strong>nearly dead!</strong>', percentage: 0},
		{msg: ' is <span class="red">bleeding</span> profusely.', percentage: 10},
		{msg: ' has some <strong class="yellow">major cuts and brusies.</strong>', percentage: 20},
		{msg: ' has some <strong>large cuts and looks exhausted!</strong>', percentage: 30},
		{msg: ' has some minor cuts and brusies.', percentage: 40},
		{msg: ' is tired and bruised.', percentage: 50},
		{msg: ' is hurt and showing <span class="grey">signs of fatigue</span>.', percentage: 60},
		{msg: ' is looking tired and wounded.', percentage: 70},
		{msg: ' is barely wounded.', percentage: 80},
		{msg: ' has a few minor scratches.', percentage: 85},
		{msg: ' is in great shape.', percentage: 90},
		{msg: ' seems in perfect health!', percentage: 95},
		{msg: ' is in <span class="green">perfect health</span>!', percentage: 100},
		{msg: ' is in <span class="green">amazing health</span>!', percentage: 200}
	];
};

Character.prototype.login = function(r, s, fn) {
	var character = this,
	name = r.msg.replace(/_.*/,'').toLowerCase();

	if (r.msg.length > 2) {
		if  (/^[a-z]+$/g.test(r.msg) === true && /[`~@#$%^&*()-+={}[]|]+$/g.test(r.msg) === false) {
			character.read(name, function(err, r) {
				var i = 0;

				if (!err) {
					for (i; i < World.players.length; i += 1) {
						if (World.players[i].name.toLowerCase() === name) {
							World.msgPlayer(World.players[i], {
								msg: 'Relogging....',
								styleClass: 'error',
								noPrompt: true
							});

							World.players[i].socket.terminate();

							s.player = World.players[i];

							s.player.refId = World.createRefId(s.player);
						}
					}

					// TODO: the socket/player references are intentional
					// TODO: but it may be better to remove the player reference from the socket
					// TODO: could just keep the ID and do a socket lookup?
					s.player = r;

					s.player.displayName = s.player.name.charAt(0).toUpperCase() + s.player.name.slice(1);

					if (s.player.lastname !== '') {
						s.player.lastname = s.player.lastname.charAt(0).toUpperCase() + s.player.lastname.slice(1);
					}

					s.player.connected = true;
					s.player.socket = s;
					s.player.refId = World.createRefId(s.player);
					s.player.logged = false;
					s.player.verifiedPassword = false;
					s.player.verifiedName = false;
					s.player.wait = 0;

					if (s.player.chp <= 0) {
						s.player.chp = 1;
					}

					return fn(s, true);
				} else {
					return fn(s, false);
				}
			});
		} else {
			return World.msgPlayer(s, {
				msg : '<b>Invalid Entry</b>. Name: ',
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
	this.read(name, function (err, r) {
		if (err) {
			throw err;
		}

		s.player = r;

		s.player.displayName = s.player.name.charAt(0).toUpperCase() + s.player.name.slice(1);

		if (s.player.lastname !== '') {
			s.player.lastname = s.player.lastname = s.player.lastname.charAt(0).toUpperCase() + s.player.lastname.slice(1);
		}

		s.player.connected = true;
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

	if (command.cmd && command.cmd.length > 7) {
		character.hashPassword(s.player.salt, command.cmd, 1000, function(hash) {
			var roomObj,
			areaObj;

			if (s.player.password === hash) {
				if (character.addPlayer(s)) {
					roomObj = World.getRoomObject(s.player.area, s.player.roomid);
					areaObj = World.getArea(s.player.area);

					World.setupBehaviors(s.player, areaObj, roomObj, function(err, player) {
						if (err) {
							return fn(err, player);
						}

						s.player = player;

						World.sendMotd(s);

						if (roomObj) {
							roomObj.playersInRoom.push(s.player);
						} else {
							// if the players last room cannot be found just set them back at their recall
							roomObj = World.getRoomObject(s.player.recall.area, s.player.recall.roomid);

							s.player.area = s.player.recall.area;
							s.player.roomid = s.player.recall.roomid;

							roomObj.playersInRoom.push(s.player);
						}
	
						fn(s);
					});
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
			this.removePlayer(s.player);
		}
	}

	World.players.push(s.player);

	return true;
};

Character.prototype.removePlayer = function(player) {
	var i = 0,
	j = 0,
	roomObj;

	for (i; i < World.players.length; i += 1) {
		if (player.name === World.players[i].name) {
			roomObj = World.getRoomObject(player.area, player.roomid);

			World.players.splice(i, 1);

			if (roomObj.playersInRoom.length) {
				for (j; j < roomObj.playersInRoom.length; j += 1) {
					if (roomObj.playersInRoom[j].name === player.name) {
						roomObj.playersInRoom.splice(j, 1);
					}
				}
			}
		}
	}
};

// A New Character is rolled and saved
Character.prototype.create = function(s) {
	var character = this,
	raceObj,
	classObj,
	socket,
	startingArea;

	if (!Array.isArray(World.config.startingArea)) {
		startingArea = World.config.startingArea;
	} else {
		startingArea = World.config.startingArea[World.dice.roll(1, World.config.startingArea.length) - 1];
	}

	raceObj = World.getRace(s.player.race);

	classObj = World.getClass(s.player.charClass);

	s.player.name = World.capitalizeFirstLetter(s.player.name);
	s.player.gold = 0;

	World.extend(s.player, JSON.parse(JSON.stringify(raceObj)), function(err, player) {
		World.extend(s.player, JSON.parse(JSON.stringify(classObj)), function(err, player) {
			s.player.refId = World.createRefId(s.player);
			s.player.charClass = classObj.name;
			s.player.id = s.player.name;
			s.player.hp += 30;
			s.player.cmana += 5;
			s.player.cmv += 100;
			s.player.isPlayer = true;
			s.player.salt = '';
			s.player.created = new Date();
			s.player.saved = null;
			s.player.role = 'player';
			s.player.area = 'midgaard';
			s.player.roomid = '1';
			s.player.trains += 25;
			s.player.deaths = 0;
			s.player.baseStr += 10 + s.player.str;
			s.player.baseInt += 10 + s.player.int;
			s.player.baseWis += 10 + s.player.wis;
			s.player.baseCon += 10 + s.player.con;
			s.player.baseDex += 10 + s.player.dex;
			s.player.mv = s.player.cmv;
			s.player.mana = s.player.cmana;
			s.player.chp = s.player.hp;
			s.player.str = s.player.baseStr;
			s.player.int = s.player.baseInt;
			s.player.wis = s.player.baseWis;
			s.player.con = s.player.baseCon;
			s.player.dex = s.player.baseDex;
			s.player.noFollow = false;
			s.player.noGroup = false;

			s.player.ac = World.dice.getAC(s.player);

			socket = s.player.socket;

			character.generateSalt(function(salt) {
				s.player.salt = salt;
		
				character.hashPassword(salt, s.player.password, 1000, function(hash) {
					s.player.password = hash;
					s.player.socket = null;
					s.player.personalPronoun = character.getPersonalPronoun(s.player);
					s.player.possessivePronoun = character.getPossessivePronoun(s.player);
		
					character.write(s.player.name, s.player, function (err) {
						character.load(s.player.name, s, function(s) {
							var roomObj;
		
							if (err) {
								throw err;
							}
		
							if (character.addPlayer(s)) {
								World.sendMotd(s);
		
								roomObj = World.getRoomObject(s.player.area, s.player.roomid);
								roomObj.playersInRoom.push(s.player);
		
								World.addCommand({
									cmd: 'look',
									roomObj: roomObj
								}, s.player);
							} else {
								World.msgPlayer(s, {
									msg: 'Error logging in. Reconnect and retry.'
								});
		
								s.terminate();
							}
						});
					});
				});
			});
		});
	});
};

Character.prototype.newCharacter = function(s, command) {
	var character = this,
	i = 0;

	if (s.player.creationStep === 1) {
		World.msgPlayer(s, {
			msg: '<p>' + s.player.displayName + ' is a new character! There are three steps until '
				+ s.player.displayName + ' is saved. The <strong>first step</strong> is to '
				+ '<strong class="red">select a race from the list below by typing in the full name</strong>.',
			noPrompt: true
		});

		World.commands.help(s.player, {
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

					World.commands.help(s.player, {
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
						World.commands.help(s, {
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
					World.commands.help(s, {
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
					World.commands.help(s, {
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
	var objToSave;

	if (player.isPlayer && !player.fighting && !player.preventSave) {
		objToSave =	Object.create(null, {});
		objToSave.following = '';
		objToSave.group = [];
		objToSave.followers = [];
		objToSave.fighting = false;
		objToSave.socket = null;
		objToSave.saved = new Date().toString();
		objToSave.behaviors = [];
		objToSave.id = player.id;
		objToSave.refId = player.refId;
		objToSave.name = player.name;
		objToSave.displayName = player.displayName;
		objToSave.lastname = player.lastname;
		objToSave.combatName = player.combatName;
		objToSave.connected = false;
		objToSave.short = player.short;
		objToSave.long = player.long;
		objToSave.description = player.description;
		objToSave.title = player.title;
		objToSave.eq = player.eq;
		objToSave.creationStep = 0;
		objToSave.items = player.items;
		objToSave.role = player.role; 
		objToSave.sex = player.sex;
		objToSave.race = player.race;
		objToSave.charClass = player.charClass;
		objToSave.classAbbr = player.classAbbr;
		objToSave.level = player.level;
		objToSave.exp = player.exp;
		objToSave.expToLevel = player.expToLevel;
		objToSave.position = player.position;
		objToSave.template = player.template;
		objToSave.alignment = player.alignment;
		objToSave.corpse = false;
		objToSave.mainStat = player.mainStat;
		objToSave.chp = player.chp;
		objToSave.hp = player.hp;
		objToSave.cmana = player.cmana;
		objToSave.mana = player.mana;
		objToSave.cmv = player.cmv;
		objToSave.mv = player.mv;
		objToSave.str = player.str;
		objToSave.dex = player.dex;
		objToSave.con = player.con;
		objToSave.wis = player.wis;
		objToSave.int = player.int;
		objToSave.age = player.age;
		objToSave.decay = -1;
		objToSave.baseStr = player.baseStr;
		objToSave.baseWis = player.baseWis;
		objToSave.baseCon = player.baseCon;
		objToSave.baseInt = player.baseInt;
		objToSave.baseDex = player.baseDex;
		objToSave.ac = player.ac;
		objToSave.damroll = player.damroll;
		objToSave.hitroll = player.hitroll;
		objToSave.wait = 0;
		objToSave.magicRes = player.magicRes;
		objToSave.meleeRes = player.meleeRes;
		objToSave.merchant = player.merhant;
		objToSave.poisonRes = player.poisonRes;
		objToSave.detection = player.detection;
		objToSave.knowledge = player.knowledge;
		objToSave.weight = player.weight;
		objToSave.gold = player.gold;
		objToSave.hunger = player.hunger;
		objToSave.maxHunger = player.maxHunger;
		objToSave.thirst = player.thirst;
		objToSave.maxThirst = player.maxThirst;
		objToSave.load = player.load;
		objToSave.handsNoun = player.handsNoun;
		objToSave.visible = player.visible;
		objToSave.area = player.area;
		objToSave.originatingArea = player.originatingArea;
		objToSave.roomid = player.roomid;
		objToSave.recall = player.recall;
		objToSave.reply = '';
		objToSave.noGroup = player.noGroup;
		objToSave.capitalShort = player.capitalShort;
		objToSave.possessivePronoun = player.possessivePronoun;
		objToSave.personalPronoun = player.personalPronoun;
		objToSave.inName = player.inName;
		objToSave.outName = player.outName;
		objToSave.outMessage = player.outMessage;
		objToSave.inMessage = player.inMessage;
		objToSave.trains = player.trains;
		objToSave.skills = player.skills;
		objToSave.racial = player.racial;
		objToSave.hearing = player.hearing;
		objToSave.sight = player.sight;
		objToSave.touch = player.touch;
		objToSave.smell = player.smell;
		objToSave.taste = player.taste;
		objToSave.mute = player.mute;
		objToSave.size = player.size;
		objToSave.log = player.log;
		objToSave.kingdom = player.kingdom;
		objToSave.material = player.material;
		objToSave.itemType = player.itemType;
		objToSave.preventItemDecay = player.preventItemDecay;
		objToSave.preventOnAlive = player.preventOnAlive;
		objToSave.vulnerableTo = player.vulnerableTo;
		objToSave.resistantTo = player.resistantTo;
		objToSave.killed = player.killed;
		objToSave.killedBy = player.killedBy;
		objToSave.lastAttackedBy = player.lastAttackedBy;
		objToSave.autoloot = player.autoloot;
		objToSave.autosac = player.autosac;
		objToSave.trainer = player.trainer;
		objToSave.trainMsg = player.trainMsg;
		objToSave.hasEvents = false;
		objToSave.runOnAliveWhenEmpty = player.runOnAliveWhenEmpty;
		objToSave.fist = player.fist;
		objToSave.isPlayer = player.isPlayer;
		objToSave.logged = false;
		objToSave.password = player.password;
		objToSave.playable = player.playable;
		objToSave.salt = player.salt;
		objToSave.created = player.created;
		objToSave.deaths = player.deaths;
		objToSave.verifiedPassword = player.verifiedPassword;
		objToSave.verifiedName = player.verifiedName;
		objToSave.affects = player.affects;
		
		this.removeAllMods(objToSave);
		
		objToSave.affects = [];

		if (Object.keys(objToSave).length) {
			this.write(objToSave.name.toLowerCase(), objToSave, function(err) {
				if (err) {
					return World.msgPlayer(player, {msg: 'Error saving character. Please let the staff know.'});
				} else {
					if (fn) {
						return fn(player);
					}
				}
			});
		}
	}
};

Character.prototype.hpRegen = function(target) {
	var conMod = World.dice.getConMod(target);
	var total;

	if (target.chp < target.hp && target.thirst < 8 && target.hunger < 9) {
		if (target.position === 'sleeping') {
			conMod += 2;
		}

		if (target.thirst >= 3 || target.hunger >= 3) {
			conMod -= 1;
		}

		if (World.dice.roll(2, 10) === 20) {
			conMod += 1;
		}

		if (conMod > -1) {
			total = World.dice.roll(1, 10) + conMod;
		} else {
			total = 0;
		}

		this.changeHp(target, total);
	}
};

Character.prototype.manaRegen = function(target) {
	var intMod = World.dice.getIntMod(target);
	var chanceMod = World.dice.roll(1, 5);
	var total;

	if (target.cmana < target.mana && target.thirst < 8 && target.hunger < 9) {
		if (target.mainStat === 'int' || chanceMod > 1) {
			if (target.position === 'sleeping') {
				intMod += 2;
			}

			if (target.thirst >= 3 || target.hunger >= 3) {
				intMod -= 1;
			}
			
			if (intMod && World.dice.roll(1, 4) === 1) {
				total = World.dice.roll(1, 2) + 1;
			} else {
				total = 1;
			}

			target.cmana += total;

			if (target.cmana > target.mana ) {
				target.cmana = target.mana;
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
	var conMod = World.dice.getConMod(target),
	total;

	if (target.hunger < target.maxHunger) {
		total = World.dice.roll(1, 12 + conMod);

		if (total > 9 || target.hunger === (target.maxHunger - 1)) {
			target.hunger += 1;
		}

		if (target.hunger > 5) {
			if (World.dice.roll(1, 2) === 1) {
				World.msgPlayer(target, {msg: 'You feel hungry.', styleClass: 'hunger'});
			} else {
				World.msgPlayer(target, {msg: 'Your stomach begins to growl.', styleClass: 'hunger'});
			}
		}
	} else {
		this.changeHp(target, -((World.dice.roll(1, target.level * 2) - conMod) + target.size.value));
		
		World.msgPlayer(target, {msg: 'You are dying of hunger.', styleClass: 'hunger'});
	}
};

Character.prototype.thirst = function(target) {
	var total,
	conMod = World.dice.getConMod(target);

	if (target.thirst < target.maxThirst) {
		total = World.dice.roll(1, 12 + conMod);

		if (total > 9 || target.thirst === (target.maxThirst - 1)) {
			target.thirst += 1;
		}

		if (target.thirst > 5) {
			if (World.dice.roll(1, 2) === 1) {
				World.msgPlayer(target, {msg: 'You are thirsty.', styleClass: 'thirst'});
			} else {
				World.msgPlayer(target, {msg: 'Your lips are parched.', styleClass: 'thirst'});
			}
		}
	} else {
		this.changeHp(target, -((World.dice.roll(1, target.thirst) - conMod) + target.size.value));

		World.msgPlayer(target, {msg: 'You are dying of thirst.', styleClass: 'thirst'});
	}
};

Character.prototype.reduceThirst = function(player, liquid) {
	player.thirst += liquid.modifiers.thirst;

	if (player.thirst < 0) {
		player.thirst = 0;
	}
}

Character.prototype.reduceHunger = function(player, food) {
	player.hunger += food.modifiers.hunger;

	if (player.hunger < 0) {
		player.hunger = 0;
	}
}

// push an item into a players inventory, checks items to ensure a player can use it
Character.prototype.addItem = function(player, item) {
	player.items.push(item);
};

Character.prototype.getItemByRefId = function(player, refId) {
	var i = 0;

	for (i; i < player.items.length; i += 1) {i
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
	item,
	shields = [];

	for (i; i < player.eq.length; i += 1) {
		if (player.eq[i].slot === 'hands' && player.eq[i].item) {
			item = this.getItemByRefId(player, player.eq[i].item);

			if (item.itemType === 'shield') {
				shields.push(item);
			} 
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

Character.prototype.getFood = function(player) {
	var i = 0,
	food = [];

	for (i; i < player.items.length; i += 1) {
		if (player.items[i].itemType === 'food') {
			food.push(player.items[i]);
		}
	}

	return food;
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
// keyId is the id found on exitObj.door
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

Character.prototype.getBehavior = function(player, moduleName) {
	var i = 0,
	len = player.behaviors.length;

	for (i; i < len; i += 1) {
		if (player.behaviors[i].module === moduleName) {
			return player.behaviors[i];
		}
	}

	return false;
}

Character.prototype.hasBehaviorEvent = function(player, eventName) {
	var i = 0,
	len = player.behaviors.length;

	for (i; i < len; i += 1) {
		if (player.behaviors[i][eventName]) {
			return true;
		}
	}

	return false;
}

Character.prototype.getStatsFromItems = function(items, fn) {
	var character = this,
	itemMods = {};


};

Character.prototype.getStatsFromAffects = function(affects, fn) {

};

Character.prototype.getStatsFromEq = function(eq, fn) {

};

Character.prototype.getHitroll = function(entity) {
	return entity.hitroll;
};

Character.prototype.getDamroll = function(entity) {
	return entity.damroll;
};

Character.prototype.getContainer = function(player, command) {
	var i = 0;

	for (i; i <  player.items.length; i += 1) {
		if (player.items[i].itemType === 'container' && player.items[i].name.toLowerCase().indexOf(command.input) !== -1) {
			return player.items[i];
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
		if (container.items[i].name.toLowerCase().indexOf(command.second) !== -1) {
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

Character.prototype.getBottle = function(player, searchStr) {
	var char = this,
	containers = char.getBottles(player),
	i = 0;

	for (i; i < containers.length; i += 1) {
		if (containers[i].name.indexOf(searchStr) !== -1) {
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
		if (skillName.toLowerCase() === player.skills[i].id.toLowerCase() 
			|| skillName.toLowerCase() === player.skills[i].display.toLowerCase()) {
			return player.skills[i];
		}
	}

	return false;
};

Character.prototype.findSkill = function(player, skillPattern) {
	var i = 0;
	var pattern = new RegExp('^' + skillPattern);
	var skill;

	for (i; i < player.skills.length; i += 1) {
		skill = player.skills[i];

		if (pattern.test(skill.display.toLowerCase())) {
			return player.skills[i];
		}
	}

	return null;
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

Character.prototype.meetsSkillPrereq = function(player, prerequisites) {
	var prop;
	var requiredSkillObj;

	for (prop in prerequisites) {
		if (prop !== 'skill') {
			if (!player[prop] && player[prop] !== 0) {
				return false;
			} else if (prerequisites[prop] > player[prop]) {
				return false;
			}
		} else {
			requiredSkillObj = this.getSkillById(player, prerequisites.skill.id);
			
			if (!requiredSkillObj) {
				return false
			} else {
				if (prerequisites.skill.prop) {
					if (requiredSkillObj[prerequisites.skill.prop] < prerequisites.skill.value) {
						return false;
					}
				}
			}
		}
	}
	
	return true;
};

Character.prototype.addSkill = function(player, skillObj) {
	player.skills.push(skillObj);
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
	
	this.removeMods(player, item.modifiers);

	World.msgPlayer(player, {
		msg: 'You stopped using ' + item.short + '.'
	});
};

Character.prototype.getItemByName = function(entity, name) {
	var i = 0;
	var item;

	for (i; i < entity.items.length; i += 1) {
		item = entity.items[i];

		if (item.displayName.toLowerCase().includes(name)) {
			return item;
		}	
	}	

	return null;
}

Character.prototype.getItem = function(entity, command) {
	return World.search(entity.items, command);
};

Character.prototype.getItems = function(player, command) {
	return World.search(player.items, false, true, command);
};

Character.prototype.getQuests = function(player) {
	var i = 0,
	result = [],
	len = player.log.length;

	for (i; i < len; i += 1) {
		if (player.log[i].type === 'quest') {
			result.push(player.log[i]);
		}
	}

	return result;
};

Character.prototype.getLog = function(player, logId) {
	var i = 0,
	len = player.log.length;

	for (i; i < len; i += 1) {
		if (player.log[i].id === logId) {
			return player.log[i];
		}
	}
};

Character.prototype.addLog = function(player, questId, step, completed, data) {
	var i = 0,
	len = World.quests.length,
	prop;

	for (i; i < len; i += 1) {
		if (World.quests[i].id === questId) {
			player.log.push({
				id: questId,
				type: 'quest', // log item reprents a quest
				completed: false, // if the quest is completed
				step: 1, // step of the quest
				data: World.quests[i].data // ad-hoc quest related info
			});
		}
	}

	this.save(player);
};

Character.prototype.getPersonalPronoun = function(player) {
	if (player.sex === 'male') {
		return 'his';	
	} else if (player.sex === 'female') {
		return 'her';
	} else {
		return 'their';
	}
};

Character.prototype.getPossessivePronoun = function(player) {
	if (player.displayName[player.displayName.length - 1].toLowerCase() === 's') {
		return player.displayName + '\'';
	} else {
		return player.displayName + '\'s';
	}
};

Character.prototype.applyMods = function(player, mods) {
	var prop;

	for (prop in mods) {
		player[prop] += mods[prop];

		if (prop === 'chp') {
			if (player.chp > player.hp) {
				player.chp = player.hp;
			} else if (player.chp < 0) {
				player.chp = 0;
			}
		}

		if (prop === 'cmana') {
			if (player.cmana > player.mana) {
				player.cmana = player.mana;
			} else if (player.cmana < 0) {
				player.cmana = 0;
			}
		}

		if (prop === 'cmv') {
			if (player.cmv > player.mv) {
				player.cmv = player.mv;
			} else if (player.cmv < 0) {
				player.cmv = 0;
			}
		}
	}
};

Character.prototype.removeMods = function(player, mods) {
	var prop;

	for (prop in mods) {
		if (player[prop] !== undefined) {
			player[prop] -= mods[prop];
		}
	}
};


Character.prototype.removeAllMods = function(player) {
	var i = 0;
	var affect;

	for (i; i < player.affects.length; i += 1) {
		affect = player.affects[i];
		if (affect.modifiers) {
			this.removeMods(player, affect.modifiers);
		}
	}
};

Character.prototype.wearWeapon = function(target, weapon, roomObj) {
	var slot = this.getEmptyWeaponSlot(target);
	
	if (!weapon.equipped) {
		if (slot) {
			weapon.equipped = true;

			slot.item = weapon.refId;

			this.applyMods(target, weapon.modifiers);

			World.msgPlayer(target, {
				msg: 'You wield a ' + weapon.displayName + ' in your ' + slot.name.toLowerCase() + '.'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'Your hands are too full to wield a ' + weapon.short + '.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are already wielding ' + weapon.short + '.',
			styleClass: 'error'
		});
	}
};

Character.prototype.wearShield = function(target, shield, roomObj) {
	var slot = this.getEmptyWeaponSlot(target);

	if (!shield.equipped) {
		if (slot) {
			shield.equipped = true;

			slot.item = shield.refId;

			this.applyMods(target, shield.modifiers);

			World.msgPlayer(target, {
				msg: 'You begin defending yourself with a ' + shield.displayName + '.'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t use a ' + shield.short + ' because your hands are full.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are already using ' + shield.short + '.',
			styleClass: 'error'
		});
	}
};

Character.prototype.wearArmor = function(target, armor, roomObj) {
	var slot = this.getSlot(target, armor.slot);
	
	if (!armor.equipped) {
		if (slot) {
			armor.equipped = true;

			slot.item = armor.refId;

			this.applyMods(target, armor.modifiers);

			World.msgPlayer(target, {
				msg: 'You wear a ' + armor.short + ' on your ' + slot.name.toLowerCase() + '.'
			});
		} else {
			return false;
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are already wearing ' + armor.short + '.',
			styleClass: 'error'
		});
	}
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
	var i = 0,
	percentageOfPlayerHp =  ((player.chp/player.hp) * 100);

	for (i; i < this.statusReport.length; i += 1) {
		if (this.statusReport[i].percentage >= percentageOfPlayerHp) {
			return this.statusReport[i];
		}
	}
};

// Can the character see in a given room, also checks player sight property
// if the room is dark, if the player has needed vision skills
// and if its currently dark outside
Character.prototype.canSee = function(player, roomObj) {
	var canSee = player.sight;
	var light;
	var hasDarkvision;

	if (canSee && !roomObj.light && !World.time.isDay) {
		hasDarkvision = World.getAffect(player, 'darkvision');

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
	var corpseDisplayStr = player.short,
	i = 0;

	if (!corpseDisplayStr) {
		corpseDisplayStr = player.displayName;
	}

	for (i; i < player.eq.length; i += 1) {
		player.eq[i].item = "";
	}

	return {
		level: player.level,
		name: 'Corpse of ' + player.displayName,
		short: 'the corpse of ' + corpseDisplayStr,
		capitalShort: 'The corpse of ' + corpseDisplayStr, 
		long: 'The corpse of ' + corpseDisplayStr + ' is lying here on the ground.',
		displayName: player.displayName,
		decay: 10,
		itemType: 'corpse',
		corpse: true,
		chp: 0,
		hp: player.hp,
		cmana: 0,
		mana: player.mana,
		cmv: 0,
		mv: player.mv,
		killedBy: player.killedBy,
		items: player.items,
		race: player.race,
		class: player.charClass,
		refId: player.refId,
		affects: [],
		behaviors: []
	};
};

Character.prototype.canSeeObject = function(player, entity) {
	var canSee = true,
	detectInvis = World.getAffect(player, 'detectInvisibility'),
	detectHide = World.getAffect(player, 'detectHidden'),
	isInvisible = World.isInvisible(entity),
	isHidden = World.isHidden(entity);

	if (entity.affects.length) {
		if (isHidden) {
			canSee = false;

			if (detectHide) {
				canSee = true;
			}
		}

		if (isInvisible && canSee) {
			canSee = false;

			if (detectInvis) {
				canSee = true;
			}
		}
	}

	return canSee;
};

Character.prototype.getMaxCarry = function(player) {
	if (player.mainStat && player.mainStat === 'con') {
		return Math.round((player.str + player.con / 2) * 10 + player.size.value);
	} else  {
		return Math.round((player.str + player.con / 3) * 10 + player.size.value);
	}
};

Character.prototype.ungroup = function(player, entity) {
	player.group.splice(player.group.indexOf(entity), 1);
	entity.group.splice(entity.group.indexOf(player), 1);
};

Character.prototype.checkGrouped = function(entity1, entity2) {
	var result = false;

	entity1.group.forEach(groupMate => {
		if (groupMate.refId === entity2.refId) {
			result = true;
		}
	});

	return result;
};

Character.prototype.changeHp = function(entity, amount) {
	var newTotal;

	if (amount === 0) {
		return;
	}

	if (amount > 0) {
		newTotal = (entity.chp + amount);

		if (newTotal > entity.hp) {
			newTotal = entity.hp;
		}

		entity.chp = newTotal;
	} else if (amount < 0) {
		newTotal = (entity.chp + amount);

		if (newTotal < 0) {
			newTotal = 0;
		}

		entity.chp = newTotal;
	}

	if (entity.chp > entity.hp) {
		entity.chp = entity.hp;
	}
}

Character.prototype.changeMana = function(entity, amount) {
	var newTotal;

	if (amount === 0) {
		return;
	}

	if (amount > 0) {
		newTotal = (entity.cmana + amount);

		if (newTotal > entity.mana) {
			newTotal = entity.mana;
		}

		entity.cmana = newTotal;
	} else if (amount < 0) {
		newTotal = (entity.cmana - amount);

		if (newTotal < 0) {
			newTotal = 0;
		}

		entity.cmana = 0;
	}

	if (entity.cmana > entity.mana) {
		entity.cmana = entity.mana;
	}
}

Character.prototype.changeMove = function(entity, amount) {
	var newTotal;

	if (amount === 0) {
		return;
	}

	if (amount > 0) {
		newTotal = (entity.cmv + amount);

		if (newTotal > entity.mv) {
			newTotal = entity.mv;
		}

		entity.cmv = newTotal;
	} else if (amount < 0) {
		newTotal = (entity.cmv - amount);

		if (newTotal < 0) {
			newTotal = 0;
		}

		entity.cmv = 0;
	}

	if (entity.cmv > entity.mv) {
		entity.cmv = entity.mv;
	}
}

Character.prototype.changeWait = function(entity, amount) {
	var newTotal = (entity.wait + amount);

	if (newTotal < 0) {
		newTotal = 0;
	} 
	
	entity.wait = newTotal;
}

Character.prototype.level = function(player) {
	var mods = World.dice.getMods(player, 0);
	var hpBonus = World.dice.roll(1, 6, mods.con);
	var mvBonus = World.dice.roll(1, 4, mods.dex);
	var manaBonus = 0;
	var newTrains = 4;

	if (player.mainStat === 'wis') {
		newTrains += 1;
	}

	if (player.wisMod > 3) {
		newTrains += 1;
	}

	if (player.intMod > 4) {
		newTrains += 1;
	}
	
	if (player.intMod >= 2) {
		manaBonus = World.dice.roll(1, player.intMod - 1);
	}
 
	if (player.intMod > 2 && player.wisMod > 1) {
		manaBonus += 1;
	}

	if (player.mainStat === 'con' || player.mainStat === 'str') {
		hpBonus += World.dice.roll(1, 4);
		manaBonus = 0;
	}

	if (player.mainStat === 'wis' || player.mainStat === 'int') {
		hpBonus -= 5;
		manaBonus += 1;
	}

	if (player.mainStat === 'dex') {
		hpBonus -= 3;
		mvBonus += World.dice.roll(1, 4);
	}

	if (hpBonus <= 1) {
		hpBonus = World.dice.roll(1, 2);
	}

	player.level += 1;
	player.hp += hpBonus;
	player.mana += manaBonus;
	player.mv += mvBonus;
	player.trains += newTrains;
	player.expToLevel = 1000 * player.level;

	World.msgPlayer(player, {
		msg: 'You have reached level ' + player.level + '. Your efforts result in ' 
			+ hpBonus + ' hp, ' + manaBonus + ' mana, ' + mvBonus + ' movement and '
			+ newTrains + ' new training points.'
	});

	this.save(player);
};

Character.prototype.addExp = function(character, exp) {
	character.exp += exp;
}

// Adjust the core character stats from the worn gear
Character.prototype.calculateGear = function() {

};

// Generalized function to get player object from the fs or driver
Character.prototype.read = function(name, fn) {
	if (!World.playerDriver || !World.playerDriver.savePlayer) {
		fs.readFile('./players/' + name.toLowerCase() + '.json', function (err, r) {
			if (!err) {
				r = JSON.parse(r);

				return fn(false, r);
			} else {
				return fn(err, false);
			}
		});
	} else {
		World.playerDriver.getPlayer(name, function(err, player) {
			return fn(err, player);
		});
	}
};

// Generalized function to save player object or call driver
Character.prototype.write = function(name, obj, fn) {
	if (!World.playerDriver || !World.playerDriver.getPlayer) {
		fs.writeFile('./players/' + name.toLowerCase() + '.json', JSON.stringify(obj, null), function (err) {
			return fn(err, obj);
		});
	} else {
		World.playerDriver.savePlayer(JSON.stringify(obj), function(err, player) {
			return fn(err, player);
		});
	}
};

module.exports = Character;
