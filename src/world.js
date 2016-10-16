/*
* Working with game-wide data. Areas, races, classes and game time
*/
'use strict';
var fs = require('fs'),
World = function() {},
Character,
Cmds,
Skills,
Spells,
Room;

World.prototype.setup = function(socketIO, cfg, fn) {
	var world = this,
	loadAreas = function(fn) {
		var i = 0,
		path = './areas/',
		areas = [];

		fs.readdir(path, function(err, areaNames) {
			areaNames.forEach(function(areaName, i) {
				var area = require('.' + path + areaName.toLowerCase().replace(/ /g, '_'));

				area.itemType = 'area';

				areas.push(area);
			});

			return fn(areas);
		});
	},
	loadTime = function (fn) {
		fs.readFile('./templates/time.json', function (err, r) {
			return fn(err, JSON.parse(r));
		});
	},
	loadRaces = function (fn) {
		var tmpArr = [],
		path = './races/';

		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile(path + fileName, function (err, messageTmp) {
					tmpArr.push(JSON.parse(messageTmp));

					if (i === fileNames.length - 1) {
						return fn(err, tmpArr);
					}
				});
			});
		});
	},
	loadClasses = function (fn) {
		var tmpArr = [],
		path = './classes/';
	
		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile(path + fileName, function (err, messageTmp) {
					tmpArr.push(JSON.parse(messageTmp));

					if (i === fileNames.length - 1) {
						return fn(err, tmpArr);
					}
				});
			});
		});
	},
	loadTemplates = function (fn) {
		var tmpArr = [],
		path = './templates/';
	
		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile(path + fileName, function (err, tmp) {
					var tmp = JSON.parse(tmp);

					tmp.fileName = fileName.replace(/.json/g, '');

					tmpArr.push(tmp);
	
					if (i === fileNames.length - 1) {
						return fn(err, tmpArr);
					}
				});
			});
		});
	},
	loadAI = function(fn) {
		var path = './ai/';

		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				world.ai[fileName.replace('.js', '')] = require('.' + path + fileName);

				if (i === fileNames.length - 1) {
					return fn(err);
				}
			});
		});
	};

	world.dice = require('./dice').roller;
	world.io = null; // Websocket object, Socket.io
	world.races = []; // Race JSON definition is in memory
	world.classes = []; // Class JSON definition is in memory
	world.areas = []; // Loaded areas
	world.players = []; // Loaded players
	world.time = null; // Current Time data
	world.itemTemplate = {};
	world.mobTemplate = {};
	world.roomTemplate = {};
	world.areaTemplate = {};
	world.ai = {};
	world.motd = '';

	// Initial game loading, embrace callback hell!
	loadAreas(function(areas) {
		loadTime(function(err, time) {
			loadRaces(function(err, races) {
				loadClasses(function(err, classes) {
					loadTemplates(function(err, templates) {
						loadAI(function() {
							var area,
							i = 0,
							j;

							fs.readFile('./help/motd.html', 'utf-8', function (err, html) {
								if (err) {
									throw err;
								}

								world.motd = '<div class="motd">' + html + '</div>';
							});

							world.areas = areas;
							world.time = time;
							world.races = races;
							world.classes = classes;
							world.templates = templates;							

							world.areaTemplate = world.getTemplate('area');
							world.itemTemplate = world.getTemplate('item');
							world.mobTemplate = world.getTemplate('entity');
							world.roomTemplate = world.getTemplate('room');

							Character = require('./character').character;
							Cmds = require('./commands').cmd;
							Skills = require('./skills').skills;
							Spells = require('./spells').spells;
							Room = require('./rooms').room;

							world.io = socketIO;
							world.config = cfg;
							
							for (i; i < world.areas.length; i += 1) {
								area = world.areas[i];

								world.setupArea(area);
							}

							i = 0;

							for (i; i < world.areas.length; i += 1) {
								area = world.areas[i];

								if (area.afterLoad) {
									area.afterLoad();
								}
							}

							world.ticks = require('./ticks');

							return fn(Character, Cmds, Skills);
						});
					});
				});
			});
		});
	});
};

World.prototype.getTemplate = function(fileName) {
	var i = 0,
	j;

	for (i; i < this.templates.length; i += 1) {
		if (this.templates[i].fileName === fileName) {
			return this.templates[i];
		}
	}

	return false;
};

World.prototype.getPlayableRaces = function() {
	var world = this,
	playableRaces = [],
	i = 0;

	for (i; i < world.races.length; i += 1) {
		if (world.races[i].playable === true) {
			playableRaces.push(world.races[i]);
		}
	}

	return playableRaces;
};

World.prototype.getPlayableClasses = function() {
	var world = this,
	playableClasses = [],
	i = 0;

	for (i; i < world.classes.length; i += 1) {
		if (world.classes[i].playable === true) {
			playableClasses.push(world.classes[i]);
		}
	}

	return playableClasses;
};

World.prototype.isPlayableRace = function(raceName) {
	var world = this,
	playableRaces = this.getPlayableRaces(),
	i = 0;

	for (i; i < playableRaces.length; i += 1) {
		if (playableRaces[i].name.toLowerCase() === raceName.toLowerCase()) {
			return true;
		}
	}

	return false;
};

World.prototype.isPlayableClass = function(className) {
	var world = this,
	playableClasses = this.getPlayableClasses(),
	i = 0;

	for (i; i < playableClasses.length; i += 1) {
		if (playableClasses[i].name.toLowerCase() === className.toLowerCase()) {
			return true;
		}
	}

	return false;
};

World.prototype.getAI = function(aiObj) {
	var world = this;

	if (!aiObj.module) {
		aiObj = {module: aiObj};
	}
	
	if (world.ai[aiObj.module]) {
		return world.ai[aiObj.module];
	} else {
		return false;
	}
};

World.prototype.getRace = function(raceName) {
	var world = this,
	i = 0;

	for (i; i < world.races.length; i += 1) {
		if (world.races[i].name.toLowerCase() === raceName) {
			return world.races[i];
		}
	}

	return null;
};

World.prototype.getClass = function(className) {
	var world = this,
	i = 0;

	for (i; i < world.classes.length; i += 1) {
		if (world.classes[i].name.toLowerCase() === className) {
			return world.classes[i];
		}
	}

	return null;
};

World.prototype.getPlayerBySocket = function(socketId) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.sid === socketId) {
			return player;
		}
	}

	return false;
};

World.prototype.getPlayerByName = function(playerName) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.name.toLowerCase() === playerName.toLowerCase()) {
			return player;
		}
	}

	return false;
};

World.prototype.getPlayersByArea = function(areaName) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.area === areaName) {
			arr.push(player);
		}
	}

	return arr;
};

/*
* Area and item setup on boot
*/

World.prototype.rollItems = function(itemArr, roomid, area) {
	var world = this,
	diceMod,
	refId = Math.random().toString().replace('0.', 'item-'),
	i = 0;

	for (i; i < itemArr.length; i += 1) {
		if (itemArr[i].spawn && itemArr[i].spawn > 1 ) {
			itemArr[i].spawn -= 1;
			itemArr.push(JSON.parse(JSON.stringify(itemArr[i])));
		}

		(function(item, index) {
			var chanceRoll = world.dice.roll(1, 20),
			prop;
	
			item.refId = refId += index;
			
			item = world.extend(item, JSON.parse(JSON.stringify(world.itemTemplate)));

			if (Array.isArray(item.name)) {
				item.name = item.name[world.dice.roll(1, item.name.length) - 1];
			}	
			
			if (!item.displayName) {
				item.displayName = item.name[0].toUpperCase() + item.name.slice(1);
			} else if (Array.isArray(item.displayName)) {
				item.displayName = item.displayName[world.dice.roll(1, item.displayName.length) - 1];
			}

			if (Array.isArray(item.short)) {
				item.short = item.short[world.dice.roll(1, item.short.length) - 1];
			}

			if (Array.isArray(item.long)) {
				item.long = item.long[world.dice.roll(1, item.long.length) - 1];
			}

			if (chanceRoll === 20) {
				item.diceNum += 1;
				item.diceSides += 1;
				item.diceMod += 1;
			} else if (chanceRoll > 18) {
				item.diceNum += 1;
			} else if (chanceRoll === 1 && item.diceNum > 1) {
				item.diceNum -= 1
				item.weight += 2;
			}
			
			item.area = area.name;
			item.roomid = roomid;

			if (item.behaviors.length > 0) {
				item = world.setupBehaviors(item);

				itemArr[index] = item;
			} else {
				itemArr[index] = item;
			}

			if (item.items) {
				world.rollItems(item.items, roomid, area);
			}
			
			for (prop in item) {
				if (item[prop] === 'function' && !item.hasEvents) {
					//item.hasEvents = true;
				}
			}

			if (item.onRolled) {
				item.onRolled(item);
			}
		}(itemArr[i], i));
	}
};

// Rolls values for Mobs, including their equipment
World.prototype.rollMobs = function(mobArr, roomid, area) {
	var world = this,
	diceMod,
	refId = Math.random().toString().replace('0.', 'entity-'),
	i = 0;

	for (i; i < mobArr.length; i += 1) {
		if (mobArr[i].spawn && mobArr[i].spawn > 1 ) {
			mobArr[i].spawn -= 1;
			mobArr.push(JSON.parse(JSON.stringify(mobArr[i])));
		}

		(function(mob, index) {
			var raceObj,
			j = 0,
			prop,
			classObj;

			mob.refId = refId += index;
		
			raceObj = world.getRace(mob.race);

			classObj = world.getClass(mob.charClass);
			
			mob = world.extend(mob, JSON.parse(JSON.stringify(world.mobTemplate)));		
			mob = world.extend(mob, JSON.parse(JSON.stringify(raceObj)));
			mob = world.extend(mob, JSON.parse(JSON.stringify(classObj)));

			if (!mob.id) {
				mob.id = refId;
			}

			if (Array.isArray(mob.name)) {
				mob.name = mob.name[world.dice.roll(1, mob.name.length) - 1];
			}

			if (!mob.displayName) {
				mob.displayName = mob.name[0].toUpperCase() + mob.name.slice(1);
			} else if (Array.isArray(mob.displayName)) {
				mob.displayName = mob.displayName[world.dice.roll(1, mob.displayName.length) - 1];
			}
		
			if (Array.isArray(mob.short)) {
				mob.short = mob.short[world.dice.roll(1, mob.short.length) - 1];
			}
		
			if (Array.isArray(mob.long)) {
				mob.long = mob.long[world.dice.roll(1, mob.long.length) - 1];
			}

			if (!mob.prefixStatusMsg) {
				if (mob.long) {
					mob.prefixStatusMsg = mob.long;
				} else {
					mob.prefixStatusMsg = world.capitalizeFirstLetter(mob.short);
				}
			}

			if (!mob.ownershipMsg) {
				if (mob.displayName[mob.displayName.length - 1].toLowerCase() === 's') {
					mob.ownershipMsg = mob.displayName + '\'';
				} else {
					mob.ownershipMsg = mob.displayName + 's';
				}
			}	

			if (mob.rollStats) {
				mob.baseStr += world.dice.roll(3, 6) - (mob.size.value * 3) + mob.str;
				mob.baseDex += world.dice.roll(3, 6) - (mob.size.value * 3) + mob.dex;
				mob.baseInt += world.dice.roll(3, 6) - (mob.size.value * 3) + mob.int;
				mob.baseWis += world.dice.roll(3, 6) - (mob.size.value * 3) + mob.wis;
				mob.baseCon += world.dice.roll(3, 6) - (mob.size.value * 3) + mob.con;
				
				mob.str = mob.baseStr;
				mob.dex = mob.baseDex;
				mob.int = mob.baseInt;
				mob.wis = mob.baseWis;
				mob.con = mob.baseCon;
			}
	
			mob.isPlayer = false;
			mob.roomid = roomid;
			mob.area = area.name;

			if (!mob.hp) {
				if (mob.level > 5) {
					mob.hp = (15 * (mob.level + 1));
				} else {
					mob.hp = (30 * (mob.level + 1));
				}
			} else {
				mob.hp += (mob.level + world.dice.roll(1, mob.con/4));
			}
			
			mob.chp = mob.hp;

			if (!mob.mana) {
				mob.mana = 50 * 8 + mob.int;
			} else {
				mob.mana += (mob.level + world.dice.roll(1, mob.int));
			}

			mob.cmana = mob.mana;

			if (!mob.mv) {
				mob.mv = 50 * 9 + mob.dex;
				mob.cmv = mob.mv;
			} else {
				mob.mv += (mob.level + world.dice.roll(1, mob.dex));
			}

			mob.cmv = mob.mv;

			if (mob.gold > 0) {
				mob.gold += world.dice.roll(1, 8);
			}

			if (mob.items.length) {
				world.rollItems(mob.items, roomid, area);	
			}

			if (mob.behaviors.length > 0) {
				mob = world.setupBehaviors(mob);

				mobArr[index] = mob;
			} else {
				mobArr[index] = mob;
			}
		
			for (prop in mob) {
				if (mob[prop] === 'function' && !mob.hasEvents) {
					//mob.hasEvents = true;
				}
			}

			if (mob.onRolled) {
				mob.onRolled(mob);
			}
		}(mobArr[i], i));
	}
};

World.prototype.setupArea = function(area) {
	var world = this,
	exitObj,
	i = 0,
	j;
	
	if (!area.wasExtended) {
		area = world.extend(area, JSON.parse(JSON.stringify(world.areaTemplate)));	
	}

	for (i; i < area.messages.length; i += 1) {
		if (!area.messages[i].random && area.messages[i].random !== false) {
			area.messages[i].random = true;
		}
	}

	i = 0;

	if (area.beforeLoad) {
		area.beforeLoad();
	}

	for (i; i < area.rooms.length; i += 1) {
		j = 0;
	
		if (!area.wasExtended) {
			area.rooms[i] = world.extend(area.rooms[i], JSON.parse(JSON.stringify(world.roomTemplate)));
			
			if (!area.rooms[i].area) {
				area.rooms[i].area = area.name;
			}
		}
		
		for (j; j < area.rooms[i].exits.length; j += 1) {
			exitObj = area.rooms[i].exits[j];

			if (!exitObj.area) {
				exitObj.area = area.name;
			}

			if (!exitObj.affects) {
				exitObj.affects = [];
			}
		}

		world.rollMobs(area.rooms[i].monsters, area.rooms[i].id, area);
		world.rollItems(area.rooms[i].items, area.rooms[i].id, area);
		
		if (area.rooms[i].monsters) {
			area.monsters = world.shuffle(area.rooms[i].monsters);
		}
	}

	area.wasExtended = true;

	return area;
};

World.prototype.getAreaByName = function(areaName) {
	var i = 0;

	for (i; i < this.areas.length; i += 1) {
		if (this.areas[i].name.toLowerCase() === areaName.toLowerCase()) {
			return this.areas[i];
		}
	}

	return null;
};

World.prototype.reloadArea = function(area) {
	var world = this,
	newArea,
	i = 0;

	newArea = world.setupArea(require('../areas/' + area.id), false);

	for (i; i < world.areas.length; i += 1) {
		if (world.areas[i].id === newArea.id) {
			world.areas[i] = newArea;
		}		
	}

	require.cache[require.resolve('../areas/' + area.id)] = null;

	return newArea;
};

World.prototype.getRoomObject = function(areaName, roomId) {
	var world = this,
	area,
	i = 0;

	if (areaName.id) {
		area = areaName;
	} else {
		area = world.getAreaByName(areaName);
	}
	
	if (area) {
		for (i; i < area.rooms.length; i += 1) {
			if (roomId === area.rooms[i].id) {
				return area.rooms[i];
			}
		}
	}

	return false;
};

World.prototype.getAllItemsFromArea = function(areaName) {
	var world = this,
	area,
	i = 0,
	playerItems,
	mobItems,
	roomItems,
	itemArr = [];

	if (areaName.name) {
		area = areaName;
	} else {
		area = world.getAreaByName(areaName)
	}

	itemArr = itemArr.concat(world.getAllMobItemsFromArea(area));
	itemArr = itemArr.concat(world.getAllPlayerItemsFromArea(area));
	itemArr = itemArr.concat(world.getAllRoomItemsFromArea(area));

	return itemArr;
};

World.prototype.getAllMonstersFromArea = function(areaName) {
	var world = this,
	area,
	i = 0,
	mobArr = [];

	if (areaName.name) {
		area = areaName;
	} else {
		area = world.getAreaByName(areaName)
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].monsters.length > 0) {
			mobArr = mobArr.concat(area.rooms[i].monsters);
		}
	}

	return mobArr;
};

World.prototype.getAllPlayersFromArea = function(areaName) {
	var area,
	i = 0,
	playerArr = [];

	if (areaName.name) {
		area = areaName;
	} else {
		area = this.getAreaByName(areaName);
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].playersInRoom.length > 0) {
			playerArr = playerArr.concat(area.rooms[i].playersInRoom);
		}
	}

	return playerArr;
};

World.prototype.getAllRoomItemsFromArea = function(areaName) {
	var world = this,
	area,
	i = 0,
	itemArr = [];


	if (areaName.name) {
		area = areaName;
	} else {
		area = world.getAreaByName(areaName)
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].items.length > 0) {
			itemArr = itemArr.concat(area.rooms[i].items);
		}
	}

	return itemArr;
};

World.prototype.getAllMonsterItemsFromArea = function(areaName) {
	var world = this,
	area,
	i = 0,
	monsters,
	itemArr = [];

	if (areaName.name) {
		area = areaName;
	} else {
		area = world.getAreaByName(areaName)
	}

	monsters = world.getAllMonstersFromArea(area);

	for (i; i < monsters.length; i += 1) {
		if (monsters[i].items.length > 0) {
			itemArr = itemArr.concat(monsters[i].items);
		}
	}

	return itemArr;
};

World.prototype.getAllPlayerItemsFromArea = function(areaName) {
	var world = this,
	area,
	i = 0,
	players,
	itemArr = [];

	if (areaName.name) {
		areaName = area.name;
	}

	players = world.getPlayersByArea(areaName);

	for (i; i < players.length; i += 1) {
		if (players[i].items.length > 0) {
			itemArr = itemArr.concat(players[i].items);
		}
	}

	return itemArr;
};

World.prototype.sendMotd = function(s) {
	this.msgPlayer(s, {
		msg : this.motd,
		evt: 'onLogged'
	});
};

World.prototype.prompt = function(target) {
	var player,
	prompt;

	if (target.player) {
		player = target.player;
	} else {
		player = target;
	}

	prompt = '<div class="col-md-12"><div class="cprompt"><strong><' 
		+ player.chp + '/'  + player.hp + '<span class="red">hp</span>><' 
		+ player.cmana + '/'  + player.mana + '<span class="blue">m</span>><' 
		+ player.cmv + '/'  + player.mv +'<span class="yellow">mv</span>></strong></div>';

	if (player.role === 'admin') {
		prompt += '<' + player.wait + 'w>';
	}

	prompt += '</div>';
	
	return prompt;
};

World.prototype.msgPlayer = function(target, msgObj, canSee) {
	var s,
	prompt,
	prependName = false,
	appendName = false,
	name = '',
	darkMsg = false,
	baseMsg;

	if (canSee !== false) {
		canSee = true;
	}

	if (target.player) {
		s = target;
		target = target.player;
	} else if (target.isPlayer) {
		s = target.socket;
	} else if (!target.area) {
		s = target;
	}
	
	if (!msgObj.noPrompt) {
		prompt = this.prompt(target);
	}

	if (!msgObj.styleClass) {
		msgObj.styleClass = '';
	}

	if (msgObj.appendName) {
		appendName = true;
	}

	if (msgObj.prependName) {
		prependName = true;
	}

	if (!msgObj.name) {
		name = target.displayName;
	} else {
		name = msgObj.name;
	}

	if (target) {
		if (s) {
			if (!msgObj.onlyPrompt && typeof msgObj.msg !== 'function' && msgObj.msg) {
				baseMsg = msgObj.msg;	

				if (!canSee && msgObj.darkMsg) {
					msgObj.msg = msgObj.darkMsg
				} else {
					if (prependName) {
						msgObj.msg = name + ' ' + msgObj.msg;
					}

					if (appendName) {
						msgObj.msg += ' ' + name;
					}
				}

				msgObj.msg = '<div class="col-md-12 ' + msgObj.styleClass  + '">' + msgObj.msg + '</div>';
				
				if (prompt) {
					msgObj.msg += prompt;
				}
					
				s.emit('msg', msgObj);
				
				msgObj.msg = baseMsg; 
			} else if (typeof msgObj.msg === 'function') {
				msgObj.msg(target, function(send, msg) {
					baseMsg = msgObj.msg;

					if (!canSee && msgObj.darkMsg) {
						msgObj.msg = msgObj.darkMsg;
					}

					if (prependName) {
						msgObj.msg = name + ' ' + msgObj.msg;
					}

					if (prependName) {
						msgObj.msg += ' ' + name;
					}

					msgObj.msg = '<div class="col-md-12 ' + msgObj.styleClass  + '">' + msg + '</div>';
					
					if (prompt) {
						msgObj.msg += prompt;
					}

					if (send) {
						s.emit('msg', msgObj);
					}
					
					msgObj.msg = baseMsg;
				}, target);
			} else {
				s.emit('msg', {
					msg: prompt
				});
			}
		}
	} else {
		s.emit('msg', msgObj);
	}
};

// Emit a message to all a given rooms players
World.prototype.msgRoom = function(roomObj, msgObj) {
	var world = this,
	i = 0,
	j = 0,
	canSee = true,
	omitMatch = false,
	s;

	if (!Array.isArray(msgObj.playerName)) {
		for (i; i < roomObj.playersInRoom.length; i += 1) {
			s = roomObj.playersInRoom[i].socket;

			if (msgObj.checkSight) {
				canSee = Character.canSee(s.player, roomObj);
			}

			if (s && s.player.name !== msgObj.playerName && s.player.roomid === roomObj.id 
				&& s.player.area === roomObj.area) {
				
				world.msgPlayer(s, msgObj, canSee);
			}
		}
	} else {
		for (i; i < roomObj.playersInRoom.length; i += 1) {
			s = roomObj.playersInRoom[i].socket;

			if (msgObj.checkSight) {
				canSee = Character.canSee(s.player, roomObj);
			}

			if (s && s.player.roomid === roomObj.id && s.player.area === roomObj.area) {
				j = 0;
				omitMatch = false;
			
				for (j; j < msgObj.playerName.length; j += 1) {
					if (msgObj.playerName[j] === s.player.name) {
						omitMatch = true;
					}
				}
				
				if (omitMatch === false) {
					world.msgPlayer(s, msgObj, canSee);
				}
			}
		}
	}
};

// Emit a message to all the players in an area
World.prototype.msgArea = function(areaName, msgObj) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		if ((!msgObj.randomPlayer || msgObj.randomPlayer === false)
			|| (msgObj.randomPlayer === true && world.dice.roll(1,10) > 6)) {

			s = world.players[i].socket;
			
			if (s.player.name !== msgObj.playerName && s.player.area === areaName) {
				world.msgPlayer(s, msgObj);
			}
		}
	}
};

// Emit a message to all the players in the
World.prototype.msgWorld = function(target, msgObj) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		s = world.players[i].socket;

		if (world.players[i].name !== msgObj.playerName) {
			world.msgPlayer(s, msgObj);
		}
	}
};

// convenience function for searching a given array and return an item based 
// on on a given command object. Matches against objects name property
World.prototype.search = function(arr, itemType, command) {
	var canSearch = true,
	matchedIndexes = [],
	result = false,
	i = 0;

	if (!command) {
		command = itemType;
		itemType = false;
	}
	
	if (command.arg) {
		if (!itemType) {
			for (i; i < arr.length; i += 1) {
				if (arr[i].name && arr[i].name.toLowerCase().indexOf(command.arg) !== -1) {
					matchedIndexes.push(i);
				}
			}
		} else {		
			for (i; i < arr.length; i += 1) {
				if (arr[i].itemType === itemType && arr[i].name.toLowerCase().indexOf(command.arg) !== -1) {
					matchedIndexes.push(i);
				}
			}
		}

		if (matchedIndexes) {
			if (matchedIndexes.length > 1 && command.number > 1) {
				i = 0;

				for (i; i < matchedIndexes.length; i += 1) {
					if ((i + 1) === command.number) {
						result = arr[matchedIndexes[i]];
					}
				}
			} else {
				result = arr[matchedIndexes[0]];
			}
		}
	}

	return result;
};

World.prototype.setupBehaviors = function(gameEntity) {
	var prop,
	behavior,
	behaviorObj,
	i = 0,
	j = 0;

	if (gameEntity.behaviors) {		
		for (i; i < gameEntity.behaviors.length; i += 1) {
			behavior = this.getAI(gameEntity.behaviors[i]),
			behaviorObj = {};

			for (prop in behavior) {
				if (typeof behavior[prop] !== 'function' && !gameEntity[prop]) {
					 behaviorObj[prop] = behavior[prop]; 
				}
			}

			if (behaviorObj) {
				gameEntity = this.extend(gameEntity, behaviorObj);
			}
		}
	}

	i = 0;

	if (gameEntity.items) {
		for (j; j < gameEntity.items; j =+ 1) {
			if (gameEntitiy.items[j].behaviors) {
				for (i; i < gameEnitity.items[j].behaviors.length; i += 1) {
					behavior = this.getAI(gameEntity.items[j].behaviors[i]);
					behaviorObj = {};

					for (prop in behavior) {
						if (typeof behavior[prop] !== 'function' && !gameEntity.items[j][prop]) {
							 behaviorObj[prop] = behavior[prop]; 
						}
					}

					if (behaviorObj) {
						gameEntity.items[j] = this.extend(gameEntity.items[j], behaviorObj);
					}
				}
			}	
		}
	}

	return gameEntity;
};

World.prototype.sanitizeBehaviors = function(gameEntity) {
	var prop,
	behavior,
	i = 0,
	j = 0;

	if (gameEntity.behaviors) {
		for (i; i < gameEntity.behaviors.length; i += 1) {
			behavior = this.getAI(gameEntity.behaviors[i]);

			if (behavior) {
				for (prop in behavior) {
					if (gameEntity[prop]) {
						delete gameEntity[prop];
					}
				}
			}
		}
	}

	i = 0;

	if (gameEntity.items) {
		for (j; j < gameEntity.items; j =+ 1) {
			if (gameEntity.items[j].behaviors) {
				for (i; i < gameEntity.items[j].behaviors.length; i += 1) {
					behavior = this.getAI(gameEntity.items[j].behaviors[i]);
	
					if (behavior) {
						for (prop in behavior) {
							if (gameEntity.items[j][prop]) {
								delete gameEntity.items[j][prop];
							}
						}
					}
				}
			}	
		}
	}

	for (prop in gameEntity) {
		if (typeof gameEntity[prop] === 'function') {
			delete gameEntity[prop];	
		}
	}

	return gameEntity;
};

// Return an array of objects representing possible stat properties on the player object
World.prototype.getGameStatArr = function() {
	return [
		{id: 'str', display: 'Strength'},
		{id: 'wis', display: 'Wisdom'},
		{id: 'int', display: 'Intelligence'},
		{id: 'con', display: 'Constitution'},
		{id: 'dex', display: 'Dexterity'}
	];
};

World.prototype.capitalizeFirstLetter = function(str) {
	return str[0].toUpperCase() + str.slice(1);
};

// Creates json representation of area
World.prototype.saveArea = function(areaName) {
	var area,
	j = 0,
	i = 0;

	if (areaName.name) {
		area = areaName;
	} else {
		area = this.getAreaByName(areaName);
	}

	area = JSON.parse(JSON.stringify(area));

	for (i; i < area.rooms.length; i += 1) {
		area.rooms[i] = this.sanitizeBehaviors(area.rooms[i]);
		
		j = 0;
		
		for (j; j < area.rooms[i].monsters.length; j += 1) {
			area.rooms[i].monsters[j] = this.sanitizeBehaviors(area.rooms[i].monsters[j]);
		}
	}

	
};

World.prototype.extend = function(extendObj, readObj) {
	var prop,
	prop2;

	if (arguments.length === 2) {
		for (prop in readObj) {
			if (extendObj[prop]) {
				if (Array.isArray(extendObj[prop]) && Array.isArray(readObj[prop])) {
					extendObj[prop] = extendObj[prop].concat(readObj[prop]);
				} else if (typeof extendObj[prop] !== 'string' && !isNaN(extendObj[prop]) && !isNaN(readObj[prop])) {
					extendObj[prop] += readObj[prop];
				} else if (prop === 'size' || prop === 'recall')  {
					extendObj[prop] = readObj[prop];
				} else if (typeof extendObj[prop] === 'object' && typeof readObj[prop] === 'object')  {
					for (prop2 in readObj[prop]) {
						this.extend(extendObj[prop][prop2], readObj[prop][prop2]);
					}
				} else {

				}
			} else {
				extendObj[prop] = readObj[prop];
			}
		}
	}
	
	return extendObj;
};

// Shuffle an array
World.prototype.shuffle = function (arr) {
	var i = arr.length - 1,
	j = Math.floor(Math.random() * i),
	temp;

	for (i; i > 0; i -= 1) {
		temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;

		j = Math.floor(Math.random() * i);
	}

	return arr;
};

World.prototype.processEvents = function(evtName, gameEntity, roomObj, param, param2) {
	var i = 0,
	j = 0,
	allTrue,
	gameEntities = [];
	
	if (gameEntity) {
		if (!Array.isArray(gameEntity)) {
			gameEntities = [gameEntity];
		} else {
			gameEntities = gameEntity;
		}

		if (!roomObj) {
			roomObj = false;
		}

		for (i; i < gameEntities.length; i += 1) {
			gameEntity = gameEntities[i];	
			
			if (!gameEntity['prevent' + this.capitalizeFirstLetter(evtName)] || gameEntity.behaviors.length === 0) {
				 if (gameEntity[evtName]) {
					 allTrue = gameEntity[evtName](gameEntity, roomObj, param, param2);
				 }

				for (j; j < gameEntity.behaviors.length; j += 1) {
					if (this.ai[gameEntity.behaviors[j].module][evtName]) {
						allTrue = this.ai[gameEntity.behaviors[j].module][evtName](gameEntity, roomObj, param, param2);
					}
				}
			}

			if (allTrue !== false) {
				allTrue = true;
			}
		}
	}
	
	return allTrue;
};

module.exports.world = new World();

