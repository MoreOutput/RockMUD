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
				fs.readFile(path + fileName, function (err, messageTmp) {
					tmpArr.push(JSON.parse(messageTmp));

					if (i === fileNames.length - 1) {
						return fn(err, tmpArr);
					}
				});
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
	loadDefaultArea = function (fn) {
		return fn();
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

	// embrace callback hell
	loadTime(function(err, time) {
		loadRaces(function(err, races) {
			loadClasses(function(err, classes) {
				loadTemplates('messages', function(err, msgTemplates) {
					loadTemplates('area', function(err, areaTemplate) {
						loadTemplates('mob', function(err, mobTemplate) {
							loadTemplates('item', function(err, itemTemplate) {
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
};

World.prototype.setup = function(socketIO, cfg, fn) {
	var Character = require('./character').character,
	Cmds = require('./commands').cmd,
	Skills = require('./skills').skill,
	Room = require('./rooms').room,
	Ticks = require('./ticks');

	this.io = socketIO;

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

World.prototype.getRace = function(raceName, fn) {
	fs.readFile('./races/' + raceName + '.json', function (err, race) {
		return fn(JSON.parse(race));
	});
};

World.prototype.getClass = function(className, fn) {
	fs.readFile('./classes/' + className + '.json', function (err, classObj) {
		return fn(JSON.parse(classObj));
	});
};

World.prototype.getObjectTemplate = function(tempName, fn) {
	var world = this;
};

World.prototype.getMessageTemplate = function(tempName, fn) {
	var world = this;
};

// This needs to look like getItems() for returning a player obj based on room
World.prototype.getPlayersByRoomID = function(roomID, fn) {
	var world = this,
	arr = [],
	player,
	i = 0;

	for (i; i < world.players.length; i += 1) {
		player = world.io.sockets.connected[players[i].sid].player;

		if (player.roomid === roomID) {
			arr.push(player);
		}
	}

	return fn(arr);
};

World.prototype.loadArea = function(areaName, fn) {
	var world = this;

	world.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area, true);
		} else {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				area = JSON.parse(area);

				world.areas.push(area);
				
				return fn(area, false);
				
				area.rooms.forEach(function(roomObj, i) {
					roomObj.monsters.forEach(function(mob, i) {
						room.rollMob(mob, function(rolledMob) {
							roomObj.monsters[i] = rolledMob;
						});
					});
				});
            });
		}
	});
};

World.prototype.getRoomObject = function(area, roomId, fn) {
    var i = 0;

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].id === roomId) {
            return fn(area.rooms[i]);
		} 
	}
};

World.prototype.checkArea = function(areaName, fn) {
    this.areas.forEach(function(area, i) {
		if (area.name === areaName) {
			return fn(true, area);
		}
	});

	return fn(false);
};

World.prototype.motd = function(s, fn) {	
	fs.readFile('./templates/messages/motd.json', function (err, data) {
		if (err) {
			throw err;
		}
	
		s.emit('msg', {msg : JSON.parse(data).motd, res: 'logged', styleClass: 'motd'});
	
		return fn();
	});
};

World.prototype.msgPlayer = function(target, msgObj, fn) {
	var world = this,
	s;

	// enables us to pass in a socket directly
	if (!target.player && target.sid) {
		 s = world.io.sockets.socket(target.sid);
	} else {
		s = target;
	}

	s.emit('msg', msgObj);

	if (typeof fn === 'function') {
		return fn(s);
	}
}

// Emit a message to all the rooms players
World.prototype.msgRoom = function(roomObj, msgObj, fn) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		s = world.io.sockets.connected[world.players[i].sid];

		if (s.player.name !== msgOpt.playerName && s.player.roomid === roomObj.roomid) {
			world.msgPlayer(s, {
				msg: msgOpt.msg,
				styleClass: 'room-msg'
			});
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
		s = world.io.sockets.connected[world.players[i].sid];

		if (s.player.name !== msgOpt.playerName && s.player.area === areaName) {
			world.msgPlayer(s, {
				msg: msgOpt.msg,
				styleClass: 'area-msg'
			});
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
};


/*
	RockMUD extend(target, obj2, callback);
	
	Target gains all properties from obj2 that arent in the current object, all numbers/dice rolls are added together.
	This function is used heavily in item initalzation; as to merge in templates.

	So:
	
	X = {itemType: 'weapon', dice: '2d4+1'};
	// reverse copies Y into X
	Y = {
		template: {itemType: 'template', dice: '+1', slot: 'hands'}, // World.getTemplate() also works
		reverse: false,
		addValues: true // add numners, false just uses templates.
	};

	World.extend(X, Y, function(rolledItem) {
		rolledItem, an instance of item X, now looks like:
		{
			itemType: 'weapon',
			dice: '2d4+2',
			slot: 'hands'
		}
	});
*/
World.prototype.extend = function(target, options, fn) {
	for (prop in obj2) {
		if (target[prop]) {
			target[prop] += obj2[prop];
		} else {
			target[prop] = obj2[prop];
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

// return an array of numbers of length @number and between 0 - @arr.length
World.prototype.generateRandomNumbers = function(number, arr) {
	var i = 0,
	resultArr = [],
	randomNum = 0;

	for (i; i < number; i += 1) {
		randomNum = Math.random() * (arr.length - 0);

		resultArr.push(randomNum);
	}

	return resultArr;
};

module.exports.world = new World();
