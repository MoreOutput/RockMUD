'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

// time, saved to time.json every 12 hours
setInterval(function() {
	var i = 0,
	areaMsg;

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
	} else if (World.time.hour === World.time.month.hourOfNight && World.time.minute === 1) {
		World.time.isDay = false;

		areaMsg = 'The sun fades fully from view as night falls.';
	}

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
}, 1200);

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
}, 1900);

// If the area is not empty the respawnTick property on the area object increments by one
// areas with players 'in' them respawn every X ticks; where X is the value of
// area.respawnOn (default is 3 -- 12 minutes). A respawnOn value of 0 prevents respawn.
// areas do not update if someone is fighting
setInterval(function() {
	var i = 0,
	j = 0,
	k = 0,
	refresh = true;

	for (i; i < World.areas.length; i += 1) {
		(function(area, index) {
			if (area.respawnOn > 0) {
				area.respawnTick += 1;
			}

			for (j; j < area.rooms.length; j += 1) {
				(function(room, index, roomIndex) {
					if (room.playersInRoom) {
						for (k; k < room.playersInRoom.length; k += 1) {
							if (room.playersInRoom[k].position === 'fighting') {
								refresh = false;
								area.respawnTick -= 1;
							}
						}

						if (World.dice.roll(1, 20) > 18) {
							area.respawnTick -= 1;
						}
					}

					if (World.areas.length - 1 === index 
						&& roomIndex === area.rooms.length - 1) {
						if ((area.respawnTick === area.respawnOn && area.respawnOn > 0 && refresh)) {
							area = World.reloadArea(area);
							area.respawnTick = 0;

							World.areas[index] = area;

							if (area.onReload) {
								area.onReload();
							}
						}
					}
				}(area.rooms[j], index, j));
			}
		}(World.areas[i], i))
	}
}, 240000); // 4 minutes

// decay timer, affects all items with decay, decayLight
// if an item with decay (not decayLight) reaches zero it goes away
// if an item with decayLight reaches zero it goes out. Printing a generic message unless an onDestory event is found
// if onDestory is found then the programmer should return a message
// fires onDecay, onDecayLight, onDestory
// simple msg override in the form of decayMsg, decayLightMsg and lightFlickerMsg
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

					World.msgRoom(obj, {
						msg: decayMsg,
						styleClass: 'blue'
					});
				}
			}

			// light decay
			if (item.equipped && item.light && item.decayLight !== -1) {
				if (item.lightDecay >= 1) {
					item.lightDecay -= 1;

					if (World.dice.roll(1, 4) >= 2 && item.lightDecay !== 1) {
						if (!item.lightFlickerMsg) {
							lightFlickerMsg = 'The light from ' + item.short +' flickers';
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

	// decay room items
	if (World.dice.roll(1, 20) < 18) {
		i = 0;

		for (i; i < World.areas.length; i += 1) {
			rooms = World.areas[i].rooms;

			if (rooms) {
				j = 0;

				for (j; j < rooms.length; j += 1) {
					if (rooms[j].items) {
						processItemDecay(rooms[j]);
					}
				}
			}
		}
	}
}, 245000); // 4.5 minutes

// AI Ticks
setInterval(function() {
	var i = 0,
	j = 0,
	players,
	monsters;

	if (World.areas.length && World.dice.roll(1, 10) > 6) {
		for (i; i < World.areas.length; i += 1) {
			monsters = World.getAllMonstersFromArea(World.areas[i]);

			monsters.forEach(function(monster, i) {
				var roomObj = World.getRoomObject(monster.area, monster.roomid);

				if (monster.chp >= 1) {
					World.processEvents('onAlive', monster, roomObj);
					World.processEvents('onAlive', monster.items, roomObj);
				}
			});

			if (World.dice.roll(1, 10) > 5) {
				players = World.getAllPlayersFromArea(World.areas[i]);

				players.forEach(function(player, i) {
					var roomObj = World.getRoomObject(player.area, player.roomid);

					if (player.chp >= 1) {
						World.processEvents('onAlive', player, roomObj);
						World.processEvents('onAlive', player.items, roomObj);
					}
				});
			}
		}
	}
}, 700);

// Area onAlive check happens once per 30 seconds 
setInterval(function() {
	var i = 0,
	s;

}, 30000); // 30 seconds

setInterval(function() {
	var i = 0,
	msgObj;

	for (i; i < World.areas.length; i += 1) {
		if (typeof World.areas[i].messages === 'function') {
			World.areas[i].messages = World.areas[i].messages();
		}

		if (World.areas[i].messages.length) {
			msgObj = World.areas[i].messages[World.dice.roll(1, World.areas[i].messages.length) - 1];

			if (!msgObj.hour) {
				World.msgArea(World.areas[i].name, {
					msg: msgObj.msg,
					randomPlayer: msgObj.random // this options randomizes who hears the message
				});
			} else if (msgObj.hour === World.time.hour) {
				World.msgArea(World.areas[i].name, {
					msg: msgObj.msg,
					randomPlayer: msg.random // this options randomizes who hears the message
				});
			}
		}
	}
}, 720000); // 12 minutes

// Player Regen
setInterval(function() { 
	var i = 0,
	player; 

	if (World.players.length > 0) {
		for (i; i < World.players.length; i += 1) {
			player = World.players[i];

			Character.hpRegen(player);
			Character.manaRegen(player);
			Character.mvRegen(player);
		}
	}
}, 75000);

// Hunger and Thirst Tick 
setInterval(function() { 
	var i = 0,
	player; 

	if (World.players.length > 0) {
		for (i; i < World.players.length; i += 1) {
			player = World.players[i];

			Character.hunger(player);
			Character.thirst(player);
		}
	}
}, 240000); // 4 minutes

setInterval(function() {
	var s,
	alerts = [
		'Commands are not case sensitive. Use HELP COMMANDS to see the current command list.',
		'Use the SCAN command to get a quick look at the rooms adjacent to you.'
	];

	if (World.players.length > 0) {
		World.msgWorld(false, {
			msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
				+ alerts[World.dice.roll(1, alerts.length) - 1] + '</span></span>'
		});
	}
}, 240000);

