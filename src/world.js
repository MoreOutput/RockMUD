/*
* Working with game-wide data. Areas, Races, Classes and in-game Time
* This can be considered the entry point of the application.
*/
'use strict';
var fs = require('fs'),
World = function() {
	var world = this,
	loadFileSet = function(path, fn) {
		var tmpArr = [];

		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				if (path.indexOf('/ai') === -1) {
					fs.readFile(path + fileName, function (err, messageTmp) {
						tmpArr.push(JSON.parse(messageTmp));

						if (i === fileNames.length - 1) {
							return fn(err, tmpArr);
						}
					});
				} else {
					world.ai[fileName.replace('.js', '')] = require('.' + path + fileName);

					if (i === fileNames.length - 1) {
						return fn(err);
					}
				}
			});
		});
	},
	loadAreas = function(fn) {
		var i = 0,
		path = './areas/',
		areas = [];

		fs.readdir(path, function(err, areaNames) {
			areaNames.forEach(function(areaName, i) {
				areas.push(require('.' + path + areaName.toLowerCase()));
			});

			return fn(areas);
		});
	},
	loadTime = function (fn) {
		fs.readFile('./time.json', function (err, r) {
			return  fn(err, JSON.parse(r));
		});
	},
	loadRaces = function (fn) {
		loadFileSet('./races/', fn);
	},
	loadClasses = function (fn) {
		loadFileSet('./classes/', fn);
	},
	/*
	Two Types of Templates Message and Object:
		Message - String conversion via World.i18n()
		Object - Auto combined with any object with the same 'itemType', addional templates defined in an objects template property
	*/
	loadTemplates = function (tempType, fn) {
		var tmpArr = [];

		if (tempType === 'mob') {
			fs.readFile('./templates/objects/entity.json', function (err, r) {
				return  fn(err, JSON.parse(r));
			});
		} else {
			fs.readFile('./templates/objects/item.json', function (err, r) {
				return  fn(err, JSON.parse(r));
			});
		}
	},
	loadAI = function(fn) {
		loadFileSet('./ai/', function(err) {
			return fn();
		});
	};

	world.io = null; // Websocket object, Socket.io
	world.races = []; // Race JSON definition is in memory
	world.classes = []; // Class JSON definition is in memory
	world.areas = []; // Loaded areas
	world.players = []; // Loaded players
	world.time = null; // Current Time data
	world.itemTemplate = {};
	world.areaTemplate = {};
	world.mobTemplate = {};
	world.ai = {};
	world.motd = '';

	// embrace callback hell!
	loadAreas(function(areas) {
		loadTime(function(err, time) {
			loadRaces(function(err, races) {
				loadClasses(function(err, classes) {
					loadTemplates('area', function(err, areaTemplate) {
						loadTemplates('mob', function(err, mobTemplate) {
							loadTemplates('item', function(err, itemTemplate) {
								loadAI(function() {
									fs.readFile('./templates/html/motd.html', 'utf-8', function (err, html) {
											if (err) {
											throw err;
										}
									
										world.motd = '<div class="motd">' + html + '</div>';
									});

									world.areas = areas;
									world.time = time;
									world.races = races;
									world.classes = classes;
									world.areaTemplate = areaTemplate;
									world.itemTemplate = itemTemplate;
									world.mobTemplate = mobTemplate;
									
									world.areas.forEach(function(area) {
										var i = 0;

										for (i; i < area.rooms.length; i += 1) {
											world.rollMobs(area.rooms[i].monsters, area.rooms[i].id);
											world.rollItems(area.rooms[i].items, area.rooms[i].id);
										}
									});

									world.time.isDay = true;

									world.ticks = require('./ticks');

									return world;
								});
							});
						});
					});
				});
			});
		});
	});
};

World.prototype.setup = function(socketIO, cfg, fn) {
	var Character = require('./character').character,
	Cmds = require('./commands').cmd,
	Skills = require('./skills').skills,
	Spells = require('./spells').spells,
	Room = require('./rooms').room;

	this.io = socketIO;
	this.dice = require('./dice').roller;

	return fn(Character, Cmds, Skills);
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

World.prototype.getAI = function(aiObj) {
	var world = this;
	
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

World.prototype.getObjectTemplate = function(tempName, fn) {
	var world = this;
};

World.prototype.getMessageTemplate = function(tempName, fn) {
	var world = this;
};

// This needs to look like getItems() for returning a player obj based on room
World.prototype.getPlayersByRoomId = function(roomId) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.roomid === roomId) {
			arr.push(player);
		}
	}

	return arr;
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

World.prototype.rollItems = function(itemArr, roomid) {
	var world = this,
	diceMod,
	refId = Math.random().toString().replace('0.', 'item-'),
	i = 0;

	for (i; i < itemArr.length; i += 1) {
		(function(item, index) {
			var chanceRoll = world.dice.roll(1, 20),
			i = 0,
			aiName,
			itemName,
			behavior;

			item.refId = refId += index;
			
			item = world.extend(item, world.itemTemplate);

			if (!item.displayName) {
				if (Array.isArray(item.displayName)) {
					if (Array.isArray(item.displayName)) {
						itemName = item.displayName[world.dice.roll(1, item.displayName.length) - 1];
					} else {
						itemName = item.displayName;
					}
				} else {	
					if (Array.isArray(item.short)) {
						itemName = item.short[world.dice.roll(1, item.short.length) - 1];
					} else {
						itemName = item.short;
					}
				}

				item.short = itemName;
				item.displayName = itemName;
			}

			if (Array.isArray(item.long)) {
				item.long = item.long[world.dice.roll(1, item.long.length) - 1];		
			}

			if (chanceRoll === 20) {
				item.diceNum += 1;
				item.diceSides += 2;
			} else if (chanceRoll > 18) {
				item.diceNum += 1;
			} else if (chanceRoll === 1 && item.diceNum > 1) {
				item.diceNum -= 1
				item.weight += 2;
			}

			item.roomid = roomid;

			if (item.behaviors.length > 0) {
				for (i; i < item.behaviors.length; i += 1) {
					aiName = item.behaviors[i];

					behavior = world.getAI(aiName);

					item = world.extend(item, behavior);

					itemArr[index] = item;
				}
			} else {
				itemArr[index] = item;
			}

			if (item.items) {
				world.rollItems(item.items);
			}
		}(itemArr[i], i));
	}
}
// Rolls values for Mobs, including their equipment
World.prototype.rollMobs = function(mobArr, roomid) {
	var world = this,
	diceMod, // Added to all generated totals 
	refId = Math.random().toString().replace('0.', 'mob-'),
	i = 0;

	for (i; i < mobArr.length; i += 1) {
		if (mobArr[i].spawn && mobArr[i].spawn > 1 ) {
			mobArr[i].spawn -= 1;
			mobArr.push(JSON.parse(JSON.stringify(mobArr[i])));
		}

		(function(mob, index) {
			var raceObj,
			i = 0,
			aiName,
			mobName,
			behavior,
			classObj;

			mob.refId = refId += index;

			mob = world.extend(mob, world.mobTemplate);
			
			raceObj = world.getRace(mob.race);
			mob = world.extend(mob, raceObj);

			classObj = world.getClass(mob.charClass);
			mob = world.extend(mob, classObj);

			if (!mob.displayName) {
				if (Array.isArray(mob.name)) {
					mobName = mob.name[world.dice.roll(1, mob.name.length) - 1];
				} else {
					mobName = mob.name;
				}

				mob.name = mobName;

				mob.displayName = mobName[0].toUpperCase() + mobName.slice(1);
			} else {
				if (Array.isArray(mob.displayName)) {
					mob.displayName = mob.displayName[world.dice.roll(1, mob.displayName.length) - 1];
				}
			}
		
			if (Array.isArray(mob.short)) {
				mob.short = mob.short[world.dice.roll(1, mob.short.length) - 1];		
			}

			if (Array.isArray(mob.long)) {
				mob.long = mob.long[world.dice.roll(1, mob.long.length) - 1];		
			}
			
			mob.str += world.dice.roll(3, 6) - (mob.size.value * 3) + 2;
			mob.dex += world.dice.roll(3, 6) - (mob.size.value * 3) + 2;
			mob.int += world.dice.roll(3, 6) - (mob.size.value * 3) + 2;
			mob.wis += world.dice.roll(3, 6) - (mob.size.value * 3) + 2;
			mob.con += world.dice.roll(3, 6) - (mob.size.value * 3) + 2;
			mob.isPlayer = false;
			mob.roomid = roomid;

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

			if (mob.behaviors.length > 0) {
				for (i; i < mob.behaviors.length; i += 1) {
					aiName = mob.behaviors[i];

					behavior = world.getAI(aiName)
					
					mob = world.extend(mob, behavior);
					mobArr[index] = mob;
				}
			} else {
				mobArr[index] = mob;
			}
		}(mobArr[i], i));
	}
};

World.prototype.setupArea = function(area) {
	var world = this,
	i = 0;

	for (i; i < area.rooms.length; i += 1) {
		world.rollMobs(area.rooms[i].monsters, area.rooms[i].id);
		world.rollItems(area.rooms[i].items, area.rooms[i].id);
	}

	return area;
};

World.prototype.getAreaByName = function(areaName) {
	var world = this,
	i = 0;

	for (i; i < world.areas.length; i += 1) {
		if (world.areas[i].name.toLowerCase() === areaName.toLowerCase()) {
			return world.areas[i];
		}
	}

	return null;
};

World.prototype.reloadArea = function(area) {
	var world = this,
	newArea,
	i = 0;

	newArea = world.setupArea(require('../areas/' + area.name.toLowerCase()));

	for (i; i < area.rooms.length; i +=1) {
		if (area.rooms[i].playersInRoom) {
			newArea.rooms[i].playersInRoom = area.rooms[i].playersInRoom;
		}
	}
	
	require.cache[require.resolve('../areas/' + area.name.toLowerCase())] = null;

	return newArea;
};

World.prototype.getRoomObject = function(areaName, roomId) {
	var world = this,
	area = world.getAreaByName(areaName),
	i = 0;

	for (i; i < area.rooms.length; i += 1) {
		if (roomId === area.rooms[i].id) {
			return area.rooms[i];
		}
	}
};

World.prototype.getAllMonstersFromArea = function(areaName) {
	var world = this,
	area = world.getAreaByName(areaName),
	i = 0,
	mobArr = [];

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].monsters.length > 0) {
			mobArr = mobArr.concat(area.rooms[i].monsters);
		}
	}

	return mobArr;
};

World.prototype.getAlItemsFromArea = function(areaName) {
	var world = this,
	area = world.getAreaByName(areaName),
	i = 0,
	itemArr = [];

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].items.length > 0) {
			itemArr = itemArr.concat(area.rooms[i].items);
		}
	}

	return itemArr;
};

World.prototype.sendMotd = function(s) {
	s.emit('msg', {msg : this.motd, res: 'logged'});
};

World.prototype.prompt = function(target) {
	var player,
	prompt;

	if (target.player) {
		player = target.player;
	} else {
		player = target;
	}

	prompt = '<' + player.chp + '/'  + player.hp + '<span class="red">hp</span>><' +
		player.cmana + '/'  + player.mana + '<span class="blue">m</span>><' + 
		player.cmv + '/'  + player.mv +'<span class="yellow">mv</span>>';

	if (player.role === 'admin') {
		prompt += '<' + player.wait + 'w>';
	}

	if (player) {
		return this.msgPlayer(target, {
			msg: prompt,
			styleClass: 'cprompt',
			noPrompt: true
		});
	}
};

World.prototype.msgPlayer = function(target, msgObj) {
	var world = this,
	newMsg = {},
	s;

	if (target.player) {
		s = target;
		target = target.player;
	} else if (target.isPlayer) {
		s = target.socket;
	}

	if (target.isPlayer) {
		if (s) {
			if (typeof msgObj.msg !== 'function') {
				s.emit('msg', msgObj);
			} else {
				msgObj.msg(function(send, msg) {
					msgObj.msg = msg;
					
					if (send) {
						s.emit('msg', msgObj);
					}
				}, target );
			}

			if (!msgObj.noPrompt) {
				world.prompt(target);
			}
		}
	}
}

// Emit a message to all a given rooms players
World.prototype.msgRoom = function(roomObj, msgObj) {
	var world = this,
	i = 0,
	s;
	
	for (i; i < roomObj.playersInRoom.length; i += 1) {
		s = world.players[i].socket;
		
		if (s.player && s.player.name !== msgObj.playerName && s.player.roomid === roomObj.id) {
			world.msgPlayer(s, msgObj);
		}
	}
};

// Emit a message to all the players in an area
World.prototype.msgArea = function(areaName, msgObj) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		if ( (!msgObj.randomPlayer || msgObj.randomPlayer === false)
			|| (msgObj.randomPlayer === true && world.dice.roll(1,10) > 6) ) {

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

		if (s.player && s.player.name !== msgObj.playerName) {
			world.msgPlayer(s, msgObj);
		}
	}
};

// target arrayName itemToMatch fn -> updates and returns target and items
// array itemToMatch fn -> returns found items
World.prototype.search = function(searchArr, command) {
	var msgPatt,
	matches = [],
	results,
	item,
	i = 0;

	if (!command.input) {
		msgPatt = new RegExp(command.arg.toLowerCase());
	} else {
		msgPatt = new RegExp(command.input.toLowerCase());
	}

	for (i; i < searchArr.length; i += 1) {
		if (searchArr[i].item) {
			item = searchArr[i].item;
		} else {
			item = searchArr[i];
		}

		if (item && msgPatt.test(item.name.toLowerCase()) ) {
			matches.push(searchArr[i]);
		}
	}

	if (matches) {
		if (matches.length > 1 && command.number > 1) {
			i = 0;
			for (i; i < matches.length; i += 1) {
				if (command.number - 1 === i) {
					results = matches[i];
				}
			}
		} else {
			results = matches[0];
		}
	}

	return results;
};

/*
	RockMUD extend(target, obj2, callback);
	Target gains all properties from obj2 that arent in the current object, all numbers are added together
*/
World.prototype.extend = function(target, obj2) {
	var prop;

	if (obj2 && target) {
		for (prop in obj2) {
			if (target[prop]) {
				if (target[prop].isArray && ob2[prop].isArray) {
					target[prop] = target[prop].concat(obj2[prop]);
				} else if (!isNaN(target[prop])) {
					target[prop] += obj2[prop];
				}
			} else {
				target[prop] = obj2[prop];
			}
		}
	}
	
	return target;
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
}

World.prototype.processEvents = function(itemToProcess, player, roomObj, eventName, fn) {
	var isArr = Array.isArray(itemToProcess),
	i = 0;

	if (isArr) {
		for (i; i < itemToProcess.length; i += 1) {
			if (itemToProcess[i][eventName]) {
				itemToProcess[i][eventName](player, roomObj);
			}
		}
	} else {
		if (itemToProcess && itemToProcess[eventName]) {
			itemToProcess[eventName](player, roomObj);
		}
	}

	return fn(player, roomObj);
};

module.exports.world = new World();
