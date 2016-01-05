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
						return fn(err, tmpArr);
					}
				}
			});
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

		if (tempType === 'messages') {
			loadFileSet('./templates/messages/', fn);
		} else if (tempType === 'area') {
			fs.readFile('./templates/objects/area.json', function (err, r) {
				return  fn(err, JSON.parse(r));
			});
		} else if (tempType === 'mob') {
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
		loadFileSet('./ai/', function(err, tempArr) {
			return fn();
		})
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
	world.messageTemplates = []; // Templates that merge with various message types
	world.ai = {};

	// embrace callback hell
	loadTime(function(err, time) {
		loadRaces(function(err, races) {
			loadClasses(function(err, classes) {
				loadTemplates('messages', function(err, msgTemplates) {
					loadTemplates('area', function(err, areaTemplate) {
						loadTemplates('mob', function(err, mobTemplate) {
							loadTemplates('item', function(err, itemTemplate) {
								loadAI(function() {
									world.time = time;
									world.races = races;
									world.classes = classes;
									world.messageTemplates = msgTemplates;
									world.areaTemplate = areaTemplate;
									world.itemTemplate = itemTemplate;
									world.mobTemplate = mobTemplate;

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
	Skills = require('./skills').skill,
	Room = require('./rooms').room,
	Ticks = require('./ticks');

	this.io = socketIO;
	this.dice = require('./dice').roller;

	return fn(Character, Cmds, Skills);
};

World.prototype.getPlayableRaces = function(fn) {
	var world = this,
	playableRaces = [];

	world.races.forEach(function(race, i) {
		if (race.playable === true) {
			playableRaces.push (race);
		}

		if (world.races.length - 1 === i) {
			return fn(playableRaces);
		}
	});
};

World.prototype.getPlayableClasses = function(fn) {
	var world = this;

	if (world.classes.length !== 0) {
		return fn(world.classes);
	} else {
		fs.readdir('./classes', function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile('./classes/' + fileName, function (err, classObj) {
					classObj = JSON.parse(classObj);

					if (classObj.playable) {
						world.classObj.push({
							name: classObj.name
						});
					}

					if (i === fileNames.length - 1) {
						return fn(world.classes);
					}
				});
			});
		});
	}
};

World.prototype.getAI = function(aiObj, fn) {
	var world = this,
	i = 0;
	
	if (world.ai[aiObj.module]) {
		return fn(world.ai[aiObj.module]);
	} else {
		return fn(null);
	}
};

World.prototype.getRace = function(raceName, fn) {
	if (raceName) {
		fs.readFile('./races/' + raceName + '.json', function (err, race) {
			return fn(JSON.parse(race));
		});
	} else {
		return fn(null);
	}
};

World.prototype.getClass = function(className, fn) {
	if (className) {
		fs.readFile('./classes/' + className + '.json', function (err, classObj) {
			return fn(JSON.parse(classObj));
		});
	} else {
		return fn(null);
	}
};

World.prototype.getObjectTemplate = function(tempName, fn) {
	var world = this;
};

World.prototype.getMessageTemplate = function(tempName, fn) {
	var world = this;
};

// This needs to look like getItems() for returning a player obj based on room
World.prototype.getPlayersByRoomId = function(roomId, fn) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.roomid === roomId) {
			arr.push(world.io.sockets.connected[player.sid].player);
		}
	}

	return fn(arr);
};

World.prototype.getPlayerBySocket = function(socketId, fn) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.sid === socketId) {
			return fn(world.io.sockets.connected[player.sid].player);
		}
	}

	return fn(null);
};

World.prototype.getPlayerByName = function(playerName, fn) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.name.toLowerCase() === playerName.toLowerCase()) {
			return fn(world.io.sockets.connected[player.sid].player);
		}
	}

	return fn(null);
};

World.prototype.getPlayersByArea = function(areaName, fn) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.area === areaName) {
			arr.push(world.io.sockets.connected[player.sid].player);
		}
	}

	return fn(arr);
};

/*
* Area and item setup on boot
*/

World.prototype.rollItems = function(itemArr, fn) {
	var world = this,
	diceMod,
	refId = Math.random().toString().replace('0.', 'item-'),
	i = 0;

	for (i; i < itemArr.length; i += 1) {
		(function(item, index) {
			var chanceRoll = world.dice.roll(1, 20);

			item.refId = refId += index;

			if (!item.displayName) {
				item.displayName = 'a ' + item.short;
			}

			world.extend(item, world.itemTemplate, function(item) {
				var i = 0,
				ai; // ai module

				if (chanceRoll === 20) {
					item.diceNum += 1;
					item.diceSides += 2;
				} else if (chanceRoll > 18) {
					item.diceNum += 1;
				} else if (chanceRoll === 1 && item.diceNum > 1) {
					item.diceNum -= 1
					item.weight += 2;
				}

				if (item.behaviors.length > 0) {
					for (i; i < item.behaviors.length; i += 1) {
						ai = item.behaviors[i];

						world.getAI(ai, function(behavior) {
							world.extend(item, behavior, function() {
								itemArr[index] = item;
							});
						});
					}
				} else {
					itemArr[index] = item;
				}

				if (index === itemArr.length - 1) {
					return fn(itemArr);
				}
			});
		}(itemArr[i], i));
	}
}
// Rolls values for Mobs, including their equipment
World.prototype.rollMobs = function(mobArr, fn) {
	var world = this,
	diceMod, // Added to all generated totals 
	refId = Math.random().toString().replace('0.', 'mob-'),
	i = 0;

	for (i; i < mobArr.length; i += 1) {
		(function(mob, index) {
			mob.refId = refId += index;

			if (!mob.displayName) {
				mob.displayName = mob.name[0].toUpperCase() + mob.name.slice(1);
			}

			world.extend(mob, world.mobTemplate, function(mob) {
				world.getRace(mob.race, function(raceObj, err) {
					world.extend(mob, raceObj, function(mob, err) {
						world.getClass(mob.charClass, function(classObj, err) {
							world.extend(mob, classObj, function(mob, err) {
								var i = 0,
								ai; // ai module

								mob.str += world.dice.roll(4, 6) - (mob.size * 3) + 2;
								mob.dex += world.dice.roll(4, 6) - (mob.size * 3) + 2;
								mob.int += world.dice.roll(4, 6) - (mob.size * 3) + 2;
								mob.wis += world.dice.roll(4, 6) - (mob.size * 3) + 2;
								mob.con += world.dice.roll(4, 6) - (mob.size * 3) + 2;
								mob.isPlayer = false;

								if (!mob.hp) {
									mob.hp = (50 * (mob.level + 1));
									mob.chp = mob.hp;
								}

								if (!mob.mana) {
									mob.mana = 50 * 8 +  mob.int;
									mob.cmana = mob.mana;
								}

								if (!mob.mv) {
									mob.mv = 50* 9 +  mob.dex;
									mob.cmv = mob.mv;
								}


								if (mob.behaviors.length > 0) {
									for (i; i < mob.behaviors.length; i += 1) {
										ai = mob.behaviors[i];

										world.getAI(ai, function(behavior) {
											world.extend(mob, behavior, function() {
												mobArr[index] = mob;
											});
										});
									}
								} else {
									mobArr[index] = mob;
								}

								if (index === mobArr.length - 1) {
									return fn(mobArr);
								}
							});
						});
					});
				});
			});
		}(mobArr[i], i));
	}
};

World.prototype.loadArea = function(areaName, fn) {
	var world = this;

	world.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area, true);
		} else {
			fs.readFile('./areas/' + areaName.toLowerCase() + '.json', function (err, area) {
				var i = 0,
				room,
				mob,
				item;

				area = JSON.parse(area);

				for (i; i < area.rooms.length; i += 1) {
					(function(room) {
						world.rollMobs(room.monsters, function(mobs) {
							world.rollItems(room.items, function(items) {
								if (i === area.rooms.length) {
									world.areas.push(area);
									return fn(area, false);
								}
							});
						});
					}(area.rooms[i]))
				}
			});
		}
	});
};

World.prototype.getRoomObject = function(areaName, roomId, fn) {
	var world = this,
	i = 0;

	world.loadArea(areaName, function(area) {
		for (i; i < area.rooms.length; i += 1) {
			if (roomId === area.rooms[i].id) {
				return fn(area.rooms[i]);
			}
		}
	});
};

World.prototype.getAllMonstersFromArea = function(areaName, fn) {
	var world = this;

	world.loadArea(areaName, function(area) {
		var i = 0,
		mobArr = [];

		for (i; i < area.rooms.length; i += 1) {
			if (area.rooms[i].monsters.length > 0) {
				mobArr = mobArr.concat(area.rooms[i].monsters);
			}
		}

		return fn(mobArr);
	});
};

World.prototype.getAlItemsFromArea = function(areaName, fn) {
	var world = this;

	world.loadArea(areaName, function(area) {
		var i = 0,
		itemArr = [];

		for (i; i < area.rooms.length; i += 1) {
			if (area.rooms[i].items.length > 0) {
				itemArr = itemArr.concat(area.rooms[i].items);
			} else {
				break;
			}
		}

		return fn(itemArr);
	});
};

World.prototype.checkArea = function(areaName, fn) {
	var i = 0;

	for (i; this.areas.length; i += 1) {
		if (this.areas[i].name === areaName) {
			return fn(true, this.areas[i]);
		}
	}

	return fn(false);
};

World.prototype.motd = function(s, fn) {
	fs.readFile('./templates/messages/motd.json', function (err, data) {
		if (err) {
			throw err;
		}
	
		s.emit('msg', {msg : '<div class="motd">' + JSON.parse(data).motd + '</div>', res: 'logged'});
	
		return fn();
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

World.prototype.msgPlayer = function(target, msgObj, fn) {
	var world = this,
	newMsg = {},
	s;

	if (target.player) {
		s = target;
		target = target.player;
	} else if (target.sid) {
		s = world.io.sockets.connected[target.sid];
	}

	if (target.isPlayer) {
		if (s) {
			s.emit('msg', msgObj);

			if (!msgObj.noPrompt) {
				world.prompt(target);
			}
		}
	}
	
	if (typeof fn === 'function') {
		return fn(s);
	}
}

// Emit a message to all a given rooms players
World.prototype.msgRoom = function(roomObj, msgObj, fn) {
	var world = this,
	i = 0,
	s;

	for (i; i < roomObj.playersInRoom.length; i += 1) {
		s = world.io.sockets.connected[roomObj.playersInRoom[i].sid];

		if (s.player && s.player.name !== msgObj.playerName) {
			world.msgPlayer(s, msgObj);
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
};

// Emit a message to all the players in an area
World.prototype.msgArea = function(areaName, msgObj, fn) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		if ( (!msgObj.randomPlayer || msgObj.randomPlayer === false)
			|| (msgObj.randomPlayer === true && world.dice.roll(1,10) > 6) ) {

			s = world.io.sockets.connected[world.players[i].sid];

			if (s.player.name !== msgObj.playerName && s.player.area === areaName) {
				world.msgPlayer(s, msgObj);
			}
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
};

// Emit a message to all the players in the
World.prototype.msgWorld = function(target, msgObj, fn) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		s = world.io.sockets.connected[world.players[i].sid];

		if (s.player && s.player.name !== msgObj.playerName) {

			world.msgPlayer(s, msgObj);
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
};

// target arrayName itemToMatch fn -> updates and returns target and items
// array itemToMatch fn -> returns found items
World.prototype.search = function(searchArr, command, fn) {
	var msgPatt,
	matches = [],
	results,
	item,
	i = 0;

	if (command.msg.length >= 3) {
		msgPatt = new RegExp(command.msg);

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

		if (results) {
			return fn(results);
		} else {
			return fn(false);
		}
	} else {
		return fn(false);
	}
};

/*
	RockMUD extend(target, obj2, callback);
	
	Target gains all properties from obj2 that arent in the current object, all numbers are added together
*/
World.prototype.extend = function(target, obj2, fn) {
	var prop;

	if (obj2) {
		for (prop in obj2) {
			if (target[prop]) {
				if (target[prop].isArray) {
					target[prop] = obj2[prop];
				} else if ( !isNaN(target[prop]) ) {
					target[prop] += obj2[prop];
				}
			} else {
				target[prop] = obj2[prop];
			}
		}
	}

	return fn(target);
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

module.exports.world = new World();
