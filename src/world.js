/*
* Working with game-wide data. Areas, races, classes and game time
*/
'use strict';
var fs = require('fs'),
World = function() {};

World.prototype.setup = function(socketIO, cfg, fn) {
	var world = this,
	loadAreas = function(fn) {
		var path = './areas/',
		areas = [];

		if (!world.dataDriver || !world.dataDriver.loadAreas) {
			fs.readdir(path, function(err, areaNames) {
				areaNames.forEach(function(areaName, i) {
					var area,
					areaId;

					if (areaName[0] !== '.'
						&& areaName.indexOf('#') === -1
						&& areaName.indexOf('omit_') === -1) {
						areaId = areaName.toLowerCase().replace(/ /g, '_').replace('.js', '');

						area = require('.' + path + areaId + '.js');
						area.id = areaId;
						area.itemType = 'area';

						areas.push(area);
					}
				});

				return fn(areas);
			});
		} else {
			fs.readdir(path, function(err, areaFileNames) {
				var areaIds = [];

				if (!err) {
					areaFileNames.forEach(function(fileName, i) {
						if (fileName.indexOf('.js') !== -1
							&& fileName[0] !== '.'
							&& fileName.indexOf('#') === -1
							&& fileName.indexOf('omit_') === -1) {
							areaIds.push(fileName.replace('.js', ''));
						}
					});
				}

				world.dataDriver.loadAreas(function(areas) {
					var unsavedAreas = [];

					if (areas.length) {
						areas.forEach(function(area, i) {
							var foundMatch = false;

							if (areaIds.indexOf(area.id) !== -1) {
								foundMatch = true;
							}

							if (!foundMatch) {
								unsavedAreas.push(area.id);
							}
						});
					} else {
						unsavedAreas = areaIds;
					}

					areas.forEach(function(area, i) {
						var newArea = require('.' + path + area.id + '.js'),
						prop;

						for (prop in newArea) {
							if (area[prop] === undefined || typeof newArea[prop] === 'function') {
								area[prop] = area[prop];
							}
						}
					});

					if (unsavedAreas.length) {
						unsavedAreas.forEach(function(unsavedAreaId, i) {
							var area = require('.' + path + unsavedAreaId + '.js');

							if (area.persistence === true) {
								area.id = unsavedAreaId;
								area.itemType = 'area';

								if (world.dataDriver && world.dataDriver.saveArea) {
									world.dataDriver.saveArea(area, function(savedArea) {
										if (savedArea) {
											areas.push(savedArea);
										}
									});
								}
							} else {
								areas.push(area);
							}
						});
					}

					return fn(areas);
				});
			});
		}
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
				tmpArr.push(JSON.parse(fs.readFileSync(path + fileName)));

				if (i === fileNames.length - 1) {
					return fn(err, tmpArr);
				}
			});
		});
	},
	loadClasses = function (fn) {
		var tmpArr = [],
		path = './classes/';
	
		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				tmpArr.push(JSON.parse(fs.readFileSync(path + fileName)));

				if (i === fileNames.length - 1) {
					return fn(err, tmpArr);
				}
			});
		});
	},
	loadTemplates = function (fn) {
		var tmpArr = [],
		path = './templates/';

		fs.readdir(path, function(err, fileNames) {
			fileNames.forEach(function(fileName, i) {
				var tmp = JSON.parse(fs.readFileSync(path + fileName));

				tmp.template = fileName.replace(/.json/g, '');
				
				world[tmp.template + 'Template'] = tmp;

				if (i === fileNames.length - 1) {
					return fn(err, tmpArr);
				}
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
	},
	loadCommands = function(fn) {
		var path = './src/commands/';

		fs.readdir(path, function(err, fileNames) {
			if (!err && fileNames.length > 1) {
				fileNames.forEach(function(fileName, i) {
					if (fileName !== 'commands.js') {
						world.commands[fileName.replace('.js', '')] = require('.' + path + fileName);

						if (i === fileNames.length - 1) {
							return fn(err);
						}
					}
				});
			} else {
				return fn(err);
			}
		});
	},
	loadSpells = function(fn) {
		var path = './src/spells/';

		fs.readdir(path, function(err, fileNames) {
			if (!err && fileNames.length > 1) {
				fileNames.forEach(function(fileName, i) {
					if (fileName !== 'spells.js') {
						world.spells[fileName.replace('.js', '')] = require('.' + path + fileName);

						if (i === fileNames.length - 1) {
							return fn(err);
						}
					}
				});
			} else {
				return fn(err);
			}
		});
	},
	loadSkills = function(fn) {
		var path = './src/skills/';

		fs.readdir(path, function(err, fileNames) {
			if (!err && fileNames.length > 1) {
				fileNames.forEach(function(fileName, i) {
					if (fileName !== 'skills.js') {
						world.skills[fileName.replace('.js', '')] = require('.' + path + fileName);

						if (i === fileNames.length - 1) {
							return fn(err);
						}
					}
				});
			} else {
				return fn(err);
			}
		});
	};

	world.races = []; // Race JSON definition is in memory
	world.classes = []; // Class JSON definition is in memory
	world.areas = []; // Loaded areas
	world.players = []; // Loaded players
	world.cmds = []; // current command queue, processed in ticks module
	world.battles = [] // current battle queue -- each item here is the meta data for upcoming combat messages
	world.time = null; // Current Time data
	world.itemTemplate;
	world.entityTemplate;
	world.roomTemplate;
	world.areaTemplate;
	world.exitTemplate;
	world.ai = {};
	world.motd = '';
	world.quests = []; // array of all game quests built from loaded areas
	world.persistenceDriver;
	world.io = socketIO;
	world.config = cfg;
	// without a driver game data is persisted in memory only.
	world.dataDriver = null; 
	// without a driver player data is saved as a flat file to the players folder
	world.playerDriver = null;
	world.character = require('./character');
	world.commands = require('./commands/commands');
	world.skills = require('./skills/skills');
	world.spells = require('./spells/spells');
	world.room = require('./rooms');
	world.combat = require('./combat')
	world.dice = require('./dice');
	world.battleLock = 0;
	world.aiLock = false;

	if (world.config.persistence && world.config.persistence.data) {
		world.dataDriver = require(world.config.persistenceDriverDir + world.config.persistence.data.driver + '.js')(world.config.persistence.data);
	}

	if (world.config.persistence && world.config.persistence.player) {
		if (world.dataDriver && world.config.persistence.player === world.config.persistence.data) {
			world.playerDriver = world.dataDriver;
		} else {
			world.playerDriver = require(world.config.persistenceDriverDir + world.config.persistence.player.driver + '.js')(world.config.persistence.player);
		}
	}

	loadCommands(function(err) {
		loadSpells(function(err) {
			loadSkills(function(err) {
				loadAreas(function(areas) {
					loadTime(function(err, time) {
						loadRaces(function(err, races) {
							loadClasses(function(err, classes) {
								loadTemplates(function(err, templates) {
									loadAI(function() {
										var area,
										i = 0;

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

										for (i; i < world.areas.length; i += 1) {
											world.extend(world.areas[i], JSON.parse(JSON.stringify(world.areaTemplate)), function(err, area) {
												if (area.quests && area.quests.length) {
													world.quests = world.quests.concat(area.quests);
												}

												world.setupArea(area, function(err, area) {
													area.extended = true;
													if (i === world.areas.length - 1) {	
														i = 0;

														for (i; i < world.areas.length; i += 1) {
															if (world.areas[i].afterLoad && !world.areas[i].preventAfterLoad) {
																world.areas[i].afterLoad();
															}
														}

														if (world.config.preventTicks === false) {
															world.ticks = require('./ticks');
														}

														return fn();
													}
												});
											});
										}
									});
								});
							});
						});
					});
				});
			});
		});
	});
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
	var playableRaces = this.getPlayableRaces(),
	i = 0;

	for (i; i < playableRaces.length; i += 1) {
		if (playableRaces[i].name.toLowerCase() === raceName.toLowerCase()) {
			return true;
		}
	}

	return false;
};

World.prototype.isPlayableClass = function(className) {
	var playableClasses = this.getPlayableClasses(),
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

World.prototype.getPlayersByArea = function(areaId) {
	var world = this,
	arr = [],
	player,
	i = 0;

	if (areaId.id) {
		areaId = areaId.id;
	}

	for (i; i < world.players.length; i += 1) {
		player = world.players[i];

		if (player.area === areaId) {
			arr.push(player);
		}
	}

	return arr;
};

/*
* Area and item setup on boot
*/
World.prototype.rollItem = function(item, area, room, callback) {
	var world = this,
	chanceRoll = world.dice.roll(1, 20),
	prop,
	i = 0;

	item.refId = world.createRefId(item);

	if (!item.id) {
		item.id = item.refId;
	}

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

	item.area = area.id;
	item.roomid = room.id;

	if (!item.originatingArea) {
		item.originatingArea = area.id;
	}

	for (prop in item) {
		if (item[prop] === 'function' && !item.hasEvents) {
			item.hasEvents = true;
		}
	}

	if (item.behaviors) {
		world.setupBehaviors(item, area, room, function(err, item) {
			return callback(err, item);
		});
	} else {
		return callback(false, item);
	}
};

World.prototype.createItem = function() {
	var item = JSON.parse(JSON.stringify(this.itemTemplate));
	item.refId = this.createRefId(item);

	return item;
};

// Rolls values for Mobs, including their equipment
World.prototype.rollMob = function(mob, area, room, callback) {
	var world = this,
	prop,
	raceObj,
	classObj;

	mob.refId = world.createRefId(mob);

	if (!mob.id) {
		mob.id = mob.refId;
	}

	if (!mob.race) {
		mob.race = 'animal';
	}

	raceObj = world.getRace(mob.race);

	if (mob.charClass) {
		classObj = world.getClass(mob.charClass);
	} else {
		classObj = {};
	}

	mob.hp += (10 * (mob.level + 1)) + world.dice.roll(mob.level, mob.level);

	if (!mob.mana) {
		mob.mana = 50 * 8 + mob.int;
	} else {
		mob.mana += (mob.level + world.dice.roll(1, mob.int));
	}

	if (!mob.mv) {
		mob.mv = 50 * 9 + mob.dex;
	} else {
		mob.mv += (mob.level + world.dice.roll(1, mob.dex));
	}

	world.extend(mob, JSON.parse(JSON.stringify(raceObj)), function(err, mob) {
		world.extend(mob, JSON.parse(JSON.stringify(classObj)), function(err, mob) {
			if (Array.isArray(mob.name)) {
				mob.name = mob.name[world.dice.roll(1, mob.name.length) - 1];
			}

			if (Array.isArray(mob.lastname)) {
				mob.lastname = mob.lastname[world.dice.roll(1, mob.lastname.length) - 1];
			}

			if (!mob.displayName) {
				mob.displayName = mob.name[0].toUpperCase() + mob.name.slice(1);
			} else if (Array.isArray(mob.displayName)) {
				mob.displayName = mob.displayName[world.dice.roll(1, mob.displayName.length) - 1];
			}

			if (!mob.combatName) {
				mob.combatName = 'the ' + mob.displayName;
			}

			if (Array.isArray(mob.short)) {
				mob.short = mob.short[world.dice.roll(1, mob.short.length) - 1];
			}

			if (Array.isArray(mob.long)) {
				mob.long = mob.long[world.dice.roll(1, mob.long.length) - 1];
			}

			if (!mob.capitalShort && mob.short) {
				mob.capitalShort = world.capitalizeFirstLetter(mob.short);
			}

			if (!mob.possessivePronoun) {
				mob.possessivePronoun = world.character.getPossessivePronoun(mob);
			}

			if (!mob.personalPronoun) {
				mob.personalPronoun = world.character.getPersonalPronoun(mob);
			}

			if (mob.rollStats) {
				mob.str += 10;
				mob.int += 10;
				mob.wis += 10;
				mob.dex += 10;
				mob.con += 10;
	
				mob.baseStr = mob.str;
				mob.baseDex = mob.dex;
				mob.baseInt = mob.int;
				mob.baseWis = mob.wis;
				mob.baseCon = mob.con;
			}

			mob.isPlayer = false;
			mob.roomid = room.id;
			mob.area = area.id;

			if (!mob.originatingArea) {
				mob.originatingArea = mob.area;
			}

			mob.chp = mob.hp;

			mob.cmana = mob.mana;

			mob.cmv = mob.mv;

			mob.ac = world.dice.getAC(mob);
			
			if (!mob.gold && mob.gold !== 0) {
				mob.gold = world.dice.roll(1, mob.level + 1);
			}

			for (prop in mob) {
				if (mob[prop] === 'function' && !mob.hasEvents) {
					mob.hasEvents = true;
				}
			}

			if (mob.behaviors) {
				world.setupBehaviors(mob, area, room, function(err, mob) {
					return callback(err, mob);
				});
			} else {
				return callback(false, mob);
			}
		});
	});
};

World.prototype.setupArea = function(area, callback) {
	var i = 0,
	world = this,
	setup = function() {
		for (i; i < area.rooms.length; i += 1) {
			world.extend(area.rooms[i], JSON.parse(JSON.stringify(world.roomTemplate)), function(err, room) {
				if (area.titleStyleClass) {
					room.titleStyleClass = area.titleStyleClass;
				}
				
				world.setupRoom(area, room, function(error, area, room) {
					room.extended = true;

					if (i === area.rooms.length - 1) {
						callback(false, area);
					}
				});
			});
		}
	};

	for (i; i < area.messages.length; i += 1) {
		if (!area.messages[i].random && area.messages[i].random !== false) {
			area.messages[i].random = true;
		}
	}

	i = 0;

	if (!area.beforeLoad || area.preventBeforeLoad) {
		setup();
	} else if (typeof area.beforeLoad === 'function' && !area.preventBeforeLoad) {
		area.beforeLoad(function(err) {
			if (!err) {
				setup();
			}
		});
	}
}

World.prototype.setupRoom = function(area, room, callback) {
	var i = 0,
	world = this;

	room.area = area.id;

	if (room.monsters.length) {
		for (i; i < room.monsters.length; i += 1) {
			world.extend(room.monsters[i], JSON.parse(JSON.stringify(world.entityTemplate)), function(err, mob) {
				mob.area = area.id;

				world.setupMob(mob, area, room, function(err, mob) {
					mob.extended = true;

					if (err) {
						return callback(err, mob);
					}

					if (i === room.monsters.length - 1) {
						i = 0;

						if (room.items.length) {
							for (i; i < room.items.length; i += 1) {
								world.extend(room.items[i], JSON.parse(JSON.stringify(world.itemTemplate)), function(err, item) {
									item.area  = area.id;

									world.setupItem(item, area, room, function(err, item) {
										item.extended = true;

										if (i ===  room.items.length - 1) {
											i = 0;

											if (room.exits.length) {
												for (i; i < room.exits.length; i += 1) {
													world.extend(room.exits[i], JSON.parse(JSON.stringify(world.exitTemplate)), function(err, exit) {
														if (!exit.area) {
															exit.area = room.area;
														}

														if (i === room.exits.length - 1) {
															if (room.behaviors.length) {
																world.setupBehaviors(room, area, room, function(err, room) {
																	return callback(false, area, room);
																});
															} else {
																return callback(false, area, room);
															}
														}
													});
												}
											} else {
												if (room.behaviors.length) {
													world.setupBehaviors(room, area, room, function(err, room) {
														return callback(false, area, room);
													});
												} else {
													return callback(false, area, room);
												}
											}
										}
									});
								});
							}
						} else {
							i = 0;
							 
							if (room.exits.length) {
								for (i; i < room.exits.length; i += 1) {
									world.extend(room.exits[i], JSON.parse(JSON.stringify(world.exitTemplate)), function(err, exit) {
										if (!exit.area) {
											exit.area = room.area;
										}

										if (i === room.exits.length - 1) {
											if (room.behaviors.length) {
												world.setupBehaviors(room, area, room, function(err, room) {
													return callback(false, area, room);
												});
											} else {
												return callback(false, area, room);
											}
										}
									});
								}
							} else {
								if (room.behaviors) {
									world.setupBehaviors(room, area, room, function(err, room) {
										return callback(false, area, room);
									});
								} else {
									return callback(false, area, room);
								}
							}
						}
					}
				});
			});
		}
	} else {
		if (room.items.length) {
			for (i; i < room.items.length; i += 1) {
				world.extend(room.items[i], JSON.parse(JSON.stringify(world.itemTemplate)), function(err, item) {
					item.area = area.id;

					world.setupItem(item, area, room, function(err, item) {
						item.extended = true;

						if (i ===  room.items.length - 1) {
							i = 0;

							if (room.exits.length) {
								for (i; i < room.exits.length; i += 1) {
									world.extend(room.exits[i], JSON.parse(JSON.stringify(world.exitTemplate)), function(err, exit) {
										if (!exit.area) {
											exit.area = room.area;
										}

										if (i === room.exits.length - 1) {
											callback(false, area, room);
										}
									});
								}
							} else {
								callback(false, area, room);
							}
						}
					});
				});
			}
		} else {
			i = 0;

			if (room.exits.length) {
				for (i; i < room.exits.length; i += 1) {
					world.extend(room.exits[i], JSON.parse(JSON.stringify(world.exitTemplate)), function(err, exit) {
						if (!exit.area) {
							exit.area = room.area;
						}

						if (i === room.exits.length - 1) {
							if (room.behaviors.length) {
								world.setupBehaviors(room, area, room, function(err, room) {
									return callback(false, area, room);
								});
							} else {
								return callback(false, area, room);
							}
						}
					});
				}
			} else {
				if (room.behaviors.length) {
					world.setupBehaviors(room, area, room, function(err, room) {
						return callback(false, area, room);
					});
				} else {
					return callback(false, area, room);
				}
			}
		}
	}
};

World.prototype.setupMob = function(mob, area, room, callback) {
	var i = 0,
	world = this;

	world.rollMob(mob, area, room, function(err, mob) {
		if (err) {
			return callback(error, mob);
		}

		if (mob.items.length) {
			for (i; i < mob.items.length; i += 1) {
				world.extend(mob.items[i], JSON.parse(JSON.stringify(world.itemTemplate)), function(err, item) {
					item.area = mob.area;
	
					world.setupItem(item, area, room, function(err, item) {
						item.extended = true;

						if (err) {
							return callback(err, item);
						}

						if (i ===  mob.items.length - 1) {
							return callback(false, mob);
						}
					});
				});
			}
		} else {
			callback(false, mob);
		}
	});
};

World.prototype.setupExit = function(exit, callback) {
	var i = 0,
	world = this;

	callback(false, exit);
};

World.prototype.setupItem = function(item, area, room, callback) {
	var world = this;


	if (!item.items || !item.items.length) {
		world.rollItem(item, area, room, function(error, item) {
			if (error) {
				return callback(error, item);
			}

			callback(false, item)
		});
	} else if (item.items && item.items.length) {		
		world.rollItem(item, area, room, function(error, item) {
			var i = 0,
			innerItem;

			for (i; i < item.items.length; i += 1) {
				innerItem = item.items[i];

				world.extend(innerItem, JSON.parse(JSON.stringify(world.itemTemplate)), function(err, innerItem) {
					world.setupItem(innerItem, area, room, callback);
				});
			}
		});
	}

	callback(false, item);
};

World.prototype.createRefId = function(gameEntity) {
	return  Math.random().toString().replace('0.', gameEntity.itemType + '-');
}

World.prototype.getArea = function(areaId) {
	var i = 0;

	for (i; i < this.areas.length; i += 1) {
		if (this.areas[i].id === areaId || this.areas[i].name.toLowerCase() === areaId.toLowerCase()) {
			return this.areas[i];
		}
	}

	return null;
};

World.prototype.reloadArea = function(area) {
	var world = this,
	newArea;

	delete require.cache[require.resolve('../areas/' + area.id)];

	newArea = require('../areas/' + area.id  + '.js');

	world.extend(newArea, JSON.parse(JSON.stringify(world.areaTemplate)), function(err, newArea) {
		world.setupArea(newArea, function(err, newArea) {
			var i = 0;

			newArea.id = area.id;
			newArea.extended = true;

			for (i; i < world.areas.length; i += 1) {
				if (world.areas[i].id === newArea.id) {

					world.areas[i] = newArea;
				}
			}
		});
	});
};

World.prototype.getRoomObject = function(areaId, roomId) {
	var world = this,
	area,
	i = 0;

	if (areaId.id) {
		area = areaId;
	} else {
		area = world.getArea(areaId);
	}
	
	if (area) {
		for (i; i < area.rooms.length; i += 1) {
			if (roomId === area.rooms[i].id) {
				return area.rooms[i];
			}
		}
	}

	return null;
};

World.prototype.getEntityByRefId = function(refId, areaId) {
	var world = this,
	searchEntities = function(area) {
		var j = 0;

		for (j; j < area.rooms.length; j += 1) {
			var room = area.rooms[j];
			var k = 0;

			for (k; k < room.monsters.length; k += 1) {
				var mob = room.monsters[k];

				if (mob.refId === refId) {
					return mob;
				}
			}

			k = 0

			for (k; k < room.playersInRoom.length; k += 1) {
				var player = room.playersInRoom[k];

				if (player.refId === refId) {
					return player;
				}
			}
		}
	},
	i = 0;

	if (!areaId) {
		for (i; world.areas.length; i += 1) {
			var area = world.areas[i];
			var entity = searchEntities(area);

			if (entity) {
				return entity;
			}
		}
	} else {
		return searchEntities(world.getArea(areaId));
	}

	return null;
};

World.prototype.getAllItemsFromArea = function(areaId) {
	var world = this,
	area,
	i = 0,
	playerItems,
	mobItems,
	roomItems,
	itemArr = [];

	if (areaId.id) {
		area = areaId.id;
	} else {
		area = world.getArea(areaId)
	}

	itemArr = itemArr.concat(world.getAllMobItemsFromArea(area));
	itemArr = itemArr.concat(world.getAllPlayerItemsFromArea(area));
	itemArr = itemArr.concat(world.getAllRoomItemsFromArea(area));

	return itemArr;
};

World.prototype.getAllMonstersFromArea = function(areaId) {
	var world = this,
	area,
	i = 0,
	mobArr = [];

	if (areaId.id) {
		area = areaId;
	} else {
		area = world.getArea(areaId)
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].monsters.length > 0) {
			mobArr = mobArr.concat(area.rooms[i].monsters);
		}
	}

	return mobArr;
};

World.prototype.getAllPlayersFromArea = function(areaId) {
	var area,
	i = 0,
	playerArr = [];

	if (areaId.id) {
		area = areaId;
	} else {
		area = this.getArea(areaId);
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].playersInRoom.length > 0) {
			playerArr = playerArr.concat(area.rooms[i].playersInRoom);
		}
	}

	return playerArr;
};

World.prototype.getAllRoomItemsFromArea = function(areaId) {
	var world = this,
	area,
	i = 0,
	itemArr = [];


	if (areaId.name) {
		area = areaId;
	} else {
		area = world.getArea(areaId)
	}

	for (i; i < area.rooms.length; i += 1) {
		if (area.rooms[i].items.length > 0) {
			itemArr = itemArr.concat(area.rooms[i].items);
		}
	}

	return itemArr;
};

World.prototype.getAllMonsterItemsFromArea = function(areaId) {
	var world = this,
	area,
	i = 0,
	monsters,
	itemArr = [];

	if (areaId.name) {
		area = areaId;
	} else {
		area = world.getArea(areaId)
	}

	monsters = world.getAllMonstersFromArea(area);

	for (i; i < monsters.length; i += 1) {
		if (monsters[i].items.length > 0) {
			itemArr = itemArr.concat(monsters[i].items);
		}
	}

	return itemArr;
};

World.prototype.getAllPlayerItemsFromArea = function(areaId) {
	var world = this,
	area,
	i = 0,
	players,
	itemArr = [];

	if (areaId.id) {
		areaId = area.id;
	}

	players = world.getPlayersByArea(areaId);

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
		noPrompt: true,
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

	if (!target.chp && target.chp !== 0) {
		target.chp = 0;
	}

	if (!target.cmana && target.cmana !== 0) {
		target.cmana = 0;
	}

	if (!target.cmv && target.cmv !== 0) {
		target.cmv = 0;
	}

	prompt = '<div class="col-md-12"><div class="cprompt"><strong><'
		+ player.chp + '/'  + player.hp + '<span class="red">hp</span>><'
		+ player.cmana + '/'  + player.mana + '<span class="blue">m</span>><'
		+ player.cmv + '/'  + player.mv +'<span class="warning">mv</span>></strong>';

	if (this.config.allAdmin || player.role === "admin") {
		prompt += '<' + player.wait + 'w>';
	}

	prompt += '</div></div>';
	
	return prompt;
};

World.prototype.getQuest = function(logId) {
	var i = 0,
	len = this.quests.length;
	
	for (i; i < len; i += 1) {
		if (this.quests[i].id === logId) {
			return this.quests[i];
		}
	}
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

	if (!msgObj.name) {
		name = target.displayName;
	} else {
		name = msgObj.name;
	}

	if (target) {
		if (s && s.readyState === 1) {
			msgObj.msgType = 'msg';

			if (!msgObj.onlyPrompt && typeof msgObj.msg !== 'function' && msgObj.msg) {
				baseMsg = msgObj.msg;

				if (!canSee && msgObj.darkMsg) {
					msgObj.msg = msgObj.darkMsg
				}

				msgObj.msg = '<div class="col-md-12 ' + msgObj.styleClass  + '">' + msgObj.msg + '</div>';
				
				if (prompt) {
					msgObj.msg += prompt;
				}

				s.send(JSON.stringify(msgObj));

				msgObj.msg = baseMsg;
			} else if (typeof msgObj.msg === 'function') {
				msgObj.msg(target, function(send, msg) {
					baseMsg = msgObj.msg;

					if (!canSee && msgObj.darkMsg) {
						msgObj.msg = msgObj.darkMsg;
					}

					msgObj.msg = '<div class="col-md-12 ' + msgObj.styleClass  + '">' + msg + '</div>';
					
					if (prompt) {
						msgObj.msg += prompt;
					}

					if (send) {
						s.send(JSON.stringify(msgObj));
					}
					
					msgObj.msg = baseMsg;
				}, target);
			} else {
				msgObj.msg = prompt;

				s.send(JSON.stringify(msgObj));
			}
		}
	} else {
		s.send('msg', msgObj);
	}
};

// Emit a message to all a given rooms players
World.prototype.msgRoom = function(roomObj, msgObj) {
	var world = this,
	i = 0,
	j = 0,
	canSee = true,
	omitMatch = false,
	player,
	s;

	if (!Array.isArray(msgObj.playerName)) {
		for (i; i < roomObj.playersInRoom.length; i += 1) {
			player = roomObj.playersInRoom[i];
			s = roomObj.playersInRoom[i].socket;

			if (msgObj.checkSight) {
				canSee = world.character.canSee(player, roomObj);
			}

			if (s && player.name !== msgObj.playerName && player.roomid === roomObj.id 
				&& player.area === roomObj.area) {
				
				world.msgPlayer(s, msgObj, canSee);
			}
		}
	} else {
		for (i; i < roomObj.playersInRoom.length; i += 1) {
			player = roomObj.playersInRoom[i];
			s = roomObj.playersInRoom[i].socket;

			if (msgObj.checkSight) {
				canSee = world.character.canSee(player, roomObj);
			}

			if (s && player.roomid === roomObj.id && player.area === roomObj.area) {
				j = 0;
				omitMatch = false;
			
				for (j; j < msgObj.playerName.length; j += 1) {
					if (msgObj.playerName[j] === player.name) {
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
World.prototype.msgArea = function(areaId, msgObj) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		if ((!msgObj.randomPlayer || msgObj.randomPlayer === false)
		|| (msgObj.randomPlayer === true && world.dice.roll(1,10) > 6)) {
			s = world.players[i].socket;

			if (s.player.name !== msgObj.playerName && s.player.area === areaId) {
				world.msgPlayer(s, msgObj);
			}
		}
	}
};

// Emit a message to all the players in the game
World.prototype.msgWorld = function(msgObj) {
	var world = this,
	i = 0,
	s;

	for (i; i < world.players.length; i += 1) {
		s = world.players[i].socket;

		if (world.players[i].name !== msgObj.playerName && world.players[i].creationStep === 0) {
			world.msgPlayer(s, msgObj);
		}
	}
};

// convenience function for searching a given array and return an item based 
// on on a given command object. Matches against objects name and displayName properties
World.prototype.search = function(arr, itemType, returnArr, command) {
	var patternStr = '',
	canSearch = true,
	matchedIndexes = [],
	result = false,
	pattern,
	wordArr,
	i = 0,
	j = 0,
	fnd = false;

	if (arguments.length === 3) {
		command = returnArr;
		returnArr = false;
	}

	if (!command) {
		command = itemType;
		itemType = false;
	}

	if (command.arg) {
		if (!itemType) {
			for (i; i < arr.length; i += 1) {
				wordArr = arr[i].name.toLowerCase().split(' ');

				j = 0;

				fnd = false;

				for (j; j < wordArr.length; j += 1) {
					pattern = new RegExp(command.arg);

					if (fnd === false && pattern.test(wordArr[j]) 
					|| (pattern.test(arr[i].displayName.toLowerCase()) || pattern.test(arr[i].name.toLowerCase()) )  && matchedIndexes.indexOf(i) === -1) {
						fnd = true;

						matchedIndexes.push(i);
					}
				}
			}
		} else {
			for (i; i < arr.length; i += 1) {
				wordArr = arr[i].name.toLowerCase().split(' ');

				j = 0;

				fnd = false;
			
				for (j; j < wordArr.length; j += 1) {
					pattern = new RegExp('^' + command.arg);

					if (fnd === false && arr[i].itemType === itemType && pattern.test(wordArr[j]) 
					|| (pattern.test(arr[i].displayName.toLowerCase()) || pattern.test(arr[i].name.toLowerCase())) && matchedIndexes.indexOf(i) === -1) {
						fnd = true;

						matchedIndexes.push(i);
					}
				}
			}
		}

		if (matchedIndexes) {
			if (!returnArr) {
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
		} else {
				result = [];

				i = 0;

				for (i; i < matchedIndexes.length; i += 1) {
					result.push(arr[matchedIndexes[i]]);
				}
			}
		}
	}

	return result;
};

World.prototype.setupBehaviors = function(gameEntity, area, room, callback) {
	var world = this,
	len = gameEntity.behaviors.length,
	i = 0;

	if (gameEntity.behaviors.length) {
		for (i; i < len; i += 1) {
			world.extend(gameEntity.behaviors[i], world.getAI(gameEntity.behaviors[i]), function(err, extendedBehavior) {
				return callback(false, gameEntity);
			});
		}
	} else {
		return callback(false, gameEntity);
	}
};

World.prototype.sanitizeBehaviors = function(gameEntity) {
	var prop,
	behavior,
	i = 0,
	j = 0;

	if (gameEntity.behaviors) {
		for (i; i < gameEntity.behaviors.length; i += 1) {
			behavior = gameEntity.behaviors[i];

			if (behavior) {
				for (prop in behavior) {
					if (prop !== 'module') {
						delete behavior[prop];
					}
				}
			}
		}
	}

	i = 0;
	j = 0;
	
	if (gameEntity.items) {
		for (j; j < gameEntity.items; j =+ 1) {
			if (gameEntity.items[j].behaviors) {
				for (i; i < gameEntity.items[j].behaviors.length; i += 1) {
					behavior = gameEntity.items[j].behaviors[i];

					if (behavior) {
						for (prop in behavior) {
							if (prop !== 'module') {
								delete behavior[prop];
							}
						}
					}
				}
			}	
		}
	}

	return gameEntity;
};

World.prototype.isSafeCommand = function(command) {
	var str = command.cmd + ' ' + command.msg;

	return !(/<[a-z/][\s\S]*>/i.test(str));
}

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

World.prototype.lowerCaseFirstLetter = function(str) {
	return str[0].toLowerCase() + str.slice(1);
};

// Creates json representation of area
World.prototype.saveArea = function(areaId) {
	var area,
	j = 0,
	i = 0;

	if (areaId.id) {
		area = areaId;
	} else {
		area = this.getArea(areaId);
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

World.prototype.extend = function(extendObj, readObj, callback) {
	var propCnt,
	cnt = 0,
	prop,
	prop2;

	propCnt = Object.keys(readObj).length;

	if (extendObj && readObj && propCnt) {
		for (prop in readObj) {
			if (extendObj.hasOwnProperty(prop)) {
				if (Array.isArray(extendObj[prop]) && Array.isArray(readObj[prop]) && extendObj[prop].length === 0) {
					extendObj[prop] = extendObj[prop].concat(readObj[prop]);
				} else if (typeof extendObj[prop] !== 'string'
					&& !isNaN(extendObj[prop])
					&& !isNaN(readObj[prop])
					&& typeof extendObj[prop] !== 'boolean') {
					extendObj[prop] += readObj[prop];
				} else if (prop === 'size' || prop === 'recall') {
					extendObj[prop] = readObj[prop];
				} else if (typeof extendObj[prop] === 'object'
					&& typeof readObj[prop] === 'object') {
					for (prop2 in readObj[prop]) {
						if (extendObj[prop][prop2] === undefined) {
							extendObj[prop][prop2] = readObj[prop][prop2];
						}
					}
				} else if (typeof extendObj[prop] === 'string'
					&& typeof readObj[prop] === 'string'
					&& readObj[prop] !== '' && extendObj[prop] === '') {
					extendObj[prop] = readObj[prop];
				}
			} else {
				extendObj[prop] = readObj[prop];
			}

			cnt += 1;

			if (cnt === propCnt) {
				return callback(false, extendObj);
			}
		}
	} else {
		return callback(false, extendObj);
	}
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

World.prototype.isInvisible = function(obj) {
	var i = 0;

	for (i; i < obj.affects.length; i += 1) {
		if (obj.affects[i].affect === 'invis') {
			return true;
		}
	}

	return false;
};

World.prototype.isHidden = function(obj) {
	var i = 0;

	if (obj.affects.length) {
		for (i; i < obj.affects.length; i += 1) {
			if (obj.affects[i].affect === 'hidden') {
				return true;
			}
		}

		return false;
	} else {
		return false;
	}
};


World.prototype.getAffect = function(obj, affectId) {
	var i = 0;

	for (i; i < obj.affects.length; i += 1) {
		if (obj.affects[i].id === affectId) {
			return obj.affects[i];
		}
	}

	return false;
};

World.prototype.removeAffect = function(obj, affectName) {
	var i = 0;

	for (i; i < obj.affects.length; i += 1) {
		if (obj.affects[i].id === affectName) {
			if (Object.keys(obj.affects[i].modifiers).length) {
				this.character.removeMods(obj, obj.affects[i].modifiers);
			}
			
			obj.affects.splice(i, 1);

			return true;
		}
	}

	return false;
};

World.prototype.addAffect = function(obj, affect) {
	if (Object.keys(affect.modifiers).length) {
		this.character.applyMods(obj, affect.modifiers);
	}
	
	obj.affects.push(affect);

	return true;
};

World.prototype.addCommand = function(cmdObj, entity) {
	cmdObj.entity = entity;

	this.cmds.push(cmdObj);
};

World.prototype.processEvents = function(evtName, gameEntity, roomObj, param, param2) {
	var i = 0,
	j = 0,
	allTrue = true,
	behavior,
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

			if (gameEntity.behaviors.length) {
				j = 0;
				
				for (j; j < gameEntity.behaviors.length; j += 1) {
					behavior = gameEntity.behaviors[j];

					if (behavior[evtName]
						&& !gameEntity['prevent' + this.capitalizeFirstLetter(evtName)]
						&& !behavior['prevent' + this.capitalizeFirstLetter(evtName)]) {
						allTrue = behavior[evtName](behavior, gameEntity, roomObj, param, param2);
					}
				}
			}
		}
	}

	return allTrue;
};

module.exports = new World();
