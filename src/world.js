/*
* Working with game-wide data. Areas, Races, Classes and in-game Time
*/
'use strict';

var fs = require('fs'),
Room,
Character,
Cmds,
Skills,
World = function() {
	var world = this;
	world.io = null;
	world.races = [];
	world.classes = [];
	world.areas = []; // Loaded areas
	world.players = []; // Loaded players
	world.time = fs.readFile('./time.json');

	fs.readFile('./time.json', function (err, r) {
		world.time = JSON.parse(r);
	});	

	fs.readFile('./templates/messages/combat.json', function (err, r) {
		world.itemTemplates = JSON.parse(r);
	});

	return world;
};

World.prototype.setup = function(socketIO, cfg, fn) {
	this.io = socketIO;

	Character = require('./character').character;
	Cmds = require('./commands').cmd;
	Skills = require('./skills').skil;
	Room = require('./rooms').room;

	return fn(Character, Cmds, Skills);
};

World.prototype.getPlayableRaces = function(fn) {
	var world = this;

	if (world.races.length !== 0) {
		return fn(world.races);
	} else {
		fs.readdir('./races', function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				fs.readFile('./races/' + fileName, function (err, race) {
					race =  JSON.parse(race);

					if (race.playable) {
						world.races.push({
							name: race.name
						});
					}

					if (i === fileNames.length - 1) {
						return fn(world.races);
					}
				});
			});
		});
	}
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

World.prototype.getTemplate = function(tempType, tempName, fn) {

};	

World.prototype.loadArea = function(areaName, fn) {
	var world = this;

	world.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area, true);
		} else {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				area = JSON.parse(area);

                console.log(area);

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

World.prototype.getRoomObject = function(areaName, roomId, fn) {
	var world = this,
	getRoomFromArea = function(area) {
		var i = 0;
		for (i; i < area.rooms.length; i += 1) {
			if (area.rooms[i].id === roomId) {
				Room.getPlayersByRoomID(roomId, function(playersInRoom) {
					area.rooms[i].playersInRoom = playersInRoom;
                    return fn(area.rooms[i]);
				});
			} 
		}
	};

	world.checkArea(areaName, function(fnd, area) {
        if (fnd) {
			return fn(getRoomFromArea(area));
	    }
    });
};

World.prototype.checkArea = function(areaName, fn) {
    console.log('Looking for' + areaName);
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

/*
	obj2 is merged into obj1.
	
	combine:
		true (default): By default any matching properties with numbers are added together,
		any matched array properties are merged, any slot with the value null in obj2
		will be removed from obj1, and any slot in obj2 with the value of -1 will be set to 0.
		
		false: All matching properties result in obj2 values (overrides obj1)
*/
World.prototype.mergeObjects = function(obj1, obj2, combine, fn) {

}

module.exports.world = new World();
