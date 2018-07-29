'use strict';
var fs = require('fs'),
World = require('./world');

// time, saved to time.json every 12 hours
setInterval(function() {
	var i = 0,
	areaMsg,
	players,
	monsters,
	processAffectDecay = function(entity) {
		var i = 0,
		affLen = entity.affects.length,
		affect;

		for (i; i < affLen; i += 1) {
			affect = entity.affects[i];
			
			if (affect.decay !== -1) {
				if (affect.decay > 0) {
					affect.decay -= 1;
				} else {
					if (affect.decayMsg) {
						World.msgPlayer(entity, {msg: affect.decayMsg});
					}

					World.removeAffect(entity, affect.id);
				}
			}
		}
	};

	World.time.minute += 1;

	if (World.time.minute === 60) {
		World.time.minute = 1;
		World.time.hour += 1;
	}

	if (World.time.hour === World.time.month.hoursInDay) {
		World.time.hour = 1;
		World.time.day += 1;
		World.time.month.day += 1;
	}

	if (World.time.hour === World.time.month.hourOfLight && World.time.minute === 1) {
		World.time.isDay = true;

		areaMsg = 'The sun appears over the horizon.';

		if (World.areas.length) {
			for (i; i < World.areas.length; i += 1) {
				(function(area, areaIndex) {
					World.processEvents('onDay', area);

					World.msgArea(area.id, {
						msg: areaMsg
					});

					monsters = World.getAllMonstersFromArea(area);

					monsters.forEach(function(monster, i) {
						var roomObj = World.getRoomObject(area, monster.roomid);

						if (monster.chp >= 1) {
							World.processEvents('onDay', monster, roomObj);
							World.processEvents('onDay', monster.items, roomObj);

							processAffectDecay(monster);
						}
					});

					players = World.getAllPlayersFromArea(area);

					players.forEach(function(player, i) {
						var roomObj = World.getRoomObject(area, player.roomid);

						if (player.chp >= 1) {
							World.processEvents('onDay', player, roomObj);
							World.processEvents('onDay', player.items, roomObj);

							processAffectDecay(player);
						}
					});
				}(World.areas[i], i));
			}	
		}
	} else if (World.time.hour === World.time.month.hourOfNight && World.time.minute === 1) {
		World.time.isDay = false;

		areaMsg = 'The sun fades fully from view as night falls.';

		if (World.areas.length) {
			for (i; i < World.areas.length; i += 1) {
				(function(area, areaIndex) {
					World.processEvents('onNight', area);

					World.msgArea(area.id, {
						msg: areaMsg
					});

					monsters = World.getAllMonstersFromArea(area);

					monsters.forEach(function(monster, i) {
						var roomObj = World.getRoomObject(area, monster.roomid);

						if (monster.chp >= 1) {
							World.processEvents('onNight', monster, roomObj);
							World.processEvents('onNight', monster.items, roomObj);

							processAffectDecay(monster);
						}
					});

					players = World.getAllPlayersFromArea(area);

					players.forEach(function(player, i) {
						var roomObj = World.getRoomObject(area, player.roomid);

						if (player.chp >= 1) {
							World.processEvents('onNight', player, roomObj);
							World.processEvents('onNight', player.items, roomObj);

							processAffectDecay(player);
						}
					});
				}(World.areas[i], i));
			}
		}
	}

	i = 0;

	if (areaMsg) {
		for (i; i < World.areas.length; i += 1) {
			if (World.areas[i].messages.length) {
				World.msgArea(World.areas[i].name, {
					msg: areaMsg
				});
			}
		}
	}

	if (World.time.month.day > World.time.month.days) {
		World.time.month = World.time.months[0];
	}
}, 1275);

// wait-state removal
setInterval(function() {
	var i = 0,
	player;

	if (World.players.length > 0) {
		for (i; i < World.players.length; i += 1) {
			player = World.players[i];

			if (player.position === 'sleeping' ||
				player.position === 'resting' ||
				player.position === 'standing') {
				if (player.wait > 0) {
					player.wait -= 1;
				} else {
					player.wait = 0;
				}
			}
		}
	}
}, 2000);

// Area respawn. If the area is not empty the respawnTick property on the area object increments by one
// areas with players 'in' them respawn every X ticks; where X is the value of
// area.respawnOn (default is 3 -- 12 minutes). A respawnOn value of 0 prevents respawn.
// areas do not update if someone is fighting
setInterval(function() {
	var playersInArea,
	area,
	i = 0,
	refresh = true;

	for (i; i < World.areas.length; i += 1) {
		area = World.areas[i];
		playersInArea = World.getPlayersByArea(World.areas[i].id);
		
		if (playersInArea.length) {
			refresh = false;
		} else if (!area.preventRespawn) {
			if (World.dice.roll(1, 4) > 1) {
				if (area.respawnOn > area.respawnTick) {
					area.respawnTick += 1;
				}

				if (area.respawnTick >= area.respawnOn) {
					area.respawnTick = 0;

					if (refresh) {
						if (!area.persistence) {
							World.reloadArea(area);
						} else if (World.dataDriver && World.dataDriver.saveArea) {
							World.dataDriver.saveArea(area);
						}
					}
				}
			}
		}
	}
}, 120000); // 2 minutes

// decay timer, affects all items with decay, decayLight
// if an item with decay (not decayLight) reaches zero it goes away
// if an item with decayLight reaches zero it goes out. Printing a generic message unless an onDestroy event is found
// if onDestroy is found then the programmer should return a message
// fires onDecay, onDecayLight, onDestroy
// simple msg override in the form of decayMsg, decayLightMsg and lightFlickerMsg -- so you can avoid unneeded onDestroy
setInterval(function() {
	var i = 0,
	j,
	mobs,
	rooms,
	processItemDecay = function(obj) {
		var j = 0,
		decayMsg,
		lightFlickerMsg,
		lightDecayMsg,
		item;

		for (j; j < obj.items.length; j += 1) {
			item = obj.items[j];

			// Roll a dice to slow down decay for items found in player inventories
			if (item.decay >= 0 && World.dice.roll(1, 20) > 15) {
				if (item.decay && item.decay >= 1) {
					item.decay -= 1;

					// Level reduction for rotting corpses
					if (obj.itemType === 'corpse' && obj.level >= 2) {
						obj.level -= 1;
					}
				} else if (item.decay === 0) {
					obj.items.splice(j, 1);

					if (!item.decayMsg) {
						decayMsg = item.short + ' rots into nothing.';
					} else {
						decayMsg = item.short + ' ' + item.decayMsg;
					}

					if (obj.playersInRoom) {
						World.msgRoom(obj, {
							msg: decayMsg,
							styleClass: 'blue'
						});
					} else if (obj.isPlayer) {
						World.msgPlayer(obj, {
							msg: decayMsg,
							styleClass: 'blue'
						});
					}
				}
			}

			// light decay
			if (item.equipped && item.light && item.decayLight !== -1) {
				if (item.lightDecay >= 1) {
					item.lightDecay -= 1;

					if (World.dice.roll(1, 4) >= 2 && item.lightDecay !== 1) {
						if (!item.lightFlickerMsg) {
							lightFlickerMsg = 'The light from ' + item.short +' flickers.';
						} else {
							lightFlickerMsg = item.displayName + ' ' + item.lightFlickerMsg;
						}

						World.msgPlayer(obj, {
							msg: lightFlickerMsg,
							styleClass: 'yellow'
						});
					}
				} else if (item.lightDecay === 0) {
					if (!item.lightDecayMsg) {
						lightDecayMsg = 'The light from ' + item.short +' goes out!';
					} else {
						lightDecayMsg = item.displayName + ' ' + item.lightDecayMsg;
					}

					World.msgPlayer(obj, {
						msg: lightDecayMsg,
						className: 'yellow'
					});
				}
			}
		}
	};

	// decay player items
	if (World.dice.roll(1, 20) < 15) {
		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				if (World.players[i].items) {
					processItemDecay(World.players[i]);
				}
			}
		}
	}

	// decay room items
	if (World.dice.roll(1, 20) < 18) {
		i = 0;

		for (i; i < World.areas.length; i += 1) {
			rooms = World.areas[i].rooms;

			if (rooms) {
				j = 0;

				for (j; j < rooms.length; j += 1) {
					if (!rooms[j].preventDecay && rooms[j].items) {
						processItemDecay(rooms[j]);
					}
				}
			} 
		}
	}

	/*
	// decay mob items
	if (World.dice.roll(1, 20) < 10) {
		if (World.players.length > 0) {
			i = 0;

			for (i; i < World.areas.length; i += 1) {
				mobs = World.getAllMonstersFromArea(World.areas[i]);

				if (mobs) {
					j = 0;

					for (j; j < mobs.length; j += 1) {
						if (!mobs[j].preventItemDecay && mobs[j].items) {
							processItemDecay(mobs[j]);
						}
					}
				}
			}
		}
	}
	*/
}, 245000); // 4.5 minutes

// AI Ticks and random player save
setInterval(function() {
	var i = 0,
	j = 0,
	cmdObj,
	cmdEntity,
	players,
	monsters,
	cmdArr,
	roomObj;

	if (World.cmds.length || World.dice.roll(1, 2) === 1) {
		for (i; i < World.areas.length; i += 1) {
			if (World.dice.roll(1, 20) === 1) {
				players = World.getAllPlayersFromArea(World.areas[i]);
				monsters = World.getAllMonstersFromArea(World.areas[i]);

				j = 0;

				for (j; j < monsters.length; j += 1) {
					if ((World.areas[i].runOnAliveWhenEmpty || players.length)
						|| (monsters[j].originatingArea !== World.areas[i].id)) {

						roomObj = World.getRoomObject(World.areas[i], monsters[j].roomid);

						if (monsters[j].chp >= 1 && (monsters[j].runOnAliveWhenEmpty || roomObj.playersInRoom.length)) {
							World.processEvents('onAlive', monsters[j], roomObj);
						}
					}
				}

				j = 0;

				for (j; j < players.length; j += 1) {
					roomObj = World.getRoomObject(World.areas[i], players[j].roomid);

					if (players[j].chp >= 1) {
						World.processEvents('onAlive', players[j], roomObj);
					}

					if (players[j].position === 'standing' && !players[j].opponent && World.dice.roll(1, 100) >= 99) {
						World.character.save(players[j]);
					}
				}
			}
		}

		cmdArr = World.cmds.slice();

		World.cmds = [];

		while(cmdArr.length) {
			cmdObj = cmdArr[0];
			cmdEntity = cmdObj.entity;

			cmdObj.entity = null;

			if (cmdEntity.isPlayer && !cmdEntity.connected) {
				cmdEntity.connected = true;
			}

			if (!cmdObj.skill) {
				World.commands[cmdObj.cmd](cmdEntity, cmdObj);
			} else {
				World.skills[cmdObj.cmd](
					cmdObj.skill,
					cmdEntity,
					cmdObj.roomObj,
					cmdObj
				);
			}

			cmdArr.splice(0, 1);
		}
	}
}, 250);

// Combat loop
setInterval(function() {
	var i = 0,
	j = 0,
	battles = [],
	uniqueMap = {},
	battle;

	console.log(World.battleLock, World.battles.length);

	if (World.battleLock === 0 && World.battles.length) {
		World.battleLock = World.battles.length;

		for (i; i < World.battles.length; i += 1) {
			battle = World.battles[i];
			
			if (!uniqueMap[battle.id]) {
				battles = World.combat.getBattlesByRefId(battle.attacker.refId);

				for (j; j < battles.length; j += 1) {
					uniqueMap[battles[j].id] = true;
				}

				console.log('Triggering!');

				World.combat.round(battles);
			}

			
			if (World.battleLock > 0) {
				World.battleLock -= 1;
			}
		}

	}
}, 1850);

setInterval(function() {
	var i = 0,
	msgObj;

	for (i; i < World.areas.length; i += 1) {
		if (typeof World.areas[i].messages === 'function') {
			World.areas[i].messages = World.areas[i].messages(World.areas[i]);
		}

		if (World.areas[i].messages.length) {
			msgObj = World.areas[i].messages[World.dice.roll(1, World.areas[i].messages.length) - 1];

			if (!msgObj.hour) { // check to see if this message can only be sent at a specific game hour
				World.msgArea(World.areas[i].name, {
					msg: msgObj.msg,
					randomPlayer: msgObj.random // this option randomizes who hears the message
				});
			} else if (msgObj.hour === World.time.hour) {
				World.msgArea(World.areas[i].name, {
					msg: msgObj.msg,
					randomPlayer: msg.random // this option randomizes who hears the message
				});
			}
		}
	}
}, 75000);

// Player Regen
setInterval(function() {
	var i = 0;

	if (World.dice.roll(1, 3) <= 2) {
		for (i; i < World.players.length; i += 1) {
			World.character.hpRegen(World.players[i]);
			World.character.manaRegen(World.players[i]);
			World.character.mvRegen(World.players[i]);
		}
	}
}, 32000);

// Hunger and Thirst Tick
setInterval(function() { 
	var i = 0,
	player; 

	for (i; i < World.players.length; i += 1) {
		player = World.players[i];

		World.character.hunger(player);
		World.character.thirst(player);
	}
}, 242000); // 4 minutes

// Saving
setInterval(function() {
	var i = 0,
	player;

	for (i; i < World.players.length; i += 1) {
		player = World.players[i];

		if (player.position.creationStep === 0
			&& player.position === 'standing'
			&& !player.opponent
			&& World.dice.roll(1, 10) > 8) {
			World.character.save(player);
		}
	}
}, 2450000); // 4.5 minutes

// Random mud-wide messages
setInterval(function() {
	var s,
	alerts = [
		'Commands are not case sensitive. Use HELP COMMANDS to see the current command list.',
		'Use the SCAN command to get a quick look at the rooms adjacent to you.',
		'Save your character with the <strong>save</strong> command.',
		'Try the <strong>say</strong> command when you want to send a message to everyone in your current room.'
	];

	if (World.players.length) {
		if (World.dice.roll(1, 3) <= 2) {
			World.msgWorld(false, {
				msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
					+ alerts[World.dice.roll(1, alerts.length) - 1] + '</span></span>'
			});
		}
	}
}, 64000);

// Check for broken connections
setInterval(function() {
	var i = 0,
	player;

	for (i; i < World.players.length; i += 1) {
		player = World.players[i];

		if (!player.connected) {
			return player.socket.terminate();
		}

		player.connected = false;

		player.socket.ping();
	}
}, 32000);