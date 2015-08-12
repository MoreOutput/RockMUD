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
	loadTemplates = function (templateType, fn) {
		var tmpArr = [];

		if (tempType === 'messages') {
			loadFileSet('./templates/messages', fn);
		} else {
			loadFileSet('./templates/objects', fn);
		}
	},
	loadDefaultArea = function (fn) {
		return fn();
	};

	world.io = null;
	world.races = []; // Race JSON definition is in memory
	world.classes = []; // Class JSON definition is in memory
	world.areas = []; // Loaded areas
	world.players = []; // Loaded players
	world.time = null;
	world.itemTemplates = [];
	world.mobTemplates = [];
	world.messageTemplates = [];

	loadTime(function(err, time){
		loadRaces(function(err, races) {
			loadClasses(function(err, classes) {
				loadTemplates('messsages', function(err, msgTemplates) {
					world.time = time;
					world.races = races;
					world.classes = classes;
					//world.messageTemplates = msgTemplates;
					console.log(world);
					return world;
				});
			});
		});
	});
};

World.prototype.setup = function(socketIO, cfg, fn) {
	this.io = socketIO;

	var Character = require('./character').character,
	Cmds = require('./commands').cmd,
	Skills = require('./skills').skill,
	Room = require('./rooms').room,
	Ticks = require('./src/ticks');

	return fn(Character, Cmds, Skills);
};

World.prototype.getPlayableRaces = function(fn) {
	var world,
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
