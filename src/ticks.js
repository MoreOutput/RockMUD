'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

// time, saved to time.json every 12 hours
setInterval(function() {
	var i = 0,
	areaMsg,
	players,
	monsters;

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

					monsters = World.getAllMonstersFromArea(area);

					monsters.forEach(function(monster, i) {
						var roomObj = World.getRoomObject(area, monster.roomid);

						if (monster.chp >= 1) {
							World.processEvents('onDay', monster, roomObj);
							World.processEvents('onDay', monster.items, roomObj);
						}
					});

					players = World.getAllPlayersFromArea(area);

					players.forEach(function(player, i) {
						var roomObj = World.getRoomObject(area, player.roomid);

						if (player.chp >= 1) {
							World.processEvents('onDay', player, roomObj);
							World.processEvents('onDay', player.items, roomObj);
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

					monsters = World.getAllMonstersFromArea(area);

					monsters.forEach(function(monster, i) {
						var roomObj = World.getRoomObject(area, monster.roomid);

						if (monster.chp >= 1) {
							World.processEvents('onNight', monster, roomObj);
							World.processEvents('onNight', monster.items, roomObj);
						}
					});

					players = World.getAllPlayersFromArea(area);

					players.forEach(function(player, i) {
						var roomObj = World.getRoomObject(area, player.roomid);

						if (player.chp >= 1) {
							World.processEvents('onNight', player, roomObj);
							World.processEvents('onNight', player.items, roomObj);
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
}, 1250);

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
	var playersInArea, 
	area,
	i = 0,
	refresh = true;

	for (i; i < World.areas.length; i += 1) {  
		area = World.areas[i];
		playersInArea = World.getPlayersByArea(World.areas[i].name);

		if (playersInArea.length) {
			refresh = false;
		} else {
			if (World.dice.roll(1, 2) === 1) {
				if (area.respawnOn > area.respawnTick) {
					area.respawnTick += 1;
				}

				if (area.respawnTick >= area.respawnOn) {
					area.respawnTick = 0;

					if (refresh) {
						area = World.reloadArea(area);
					
						if (area.onReload) {
							area.onReload();
						}
					}
				}
			}
		}
	}
}, 240000); // 4 minutes

// decay timer, affects all items with decay, decayLight
// if an item with decay (not decayLight) reaches zero it goes away
// if an item with decayLight reaches zero it goes out. Printing a generic message unless an onDestory event is found
// if onDestroy is found then the programmer should return a message
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

// AI Ticks and random player save
setInterval(function() {
	var i = 0,
	j = 0,
	players,
	monsters,
	roomObj;

	for (i; i < World.areas.length; i += 1) {
		if (World.dice.roll(1, 2) === 1) {
			players = World.getAllPlayersFromArea(World.areas[i]);
			monsters = World.getAllMonstersFromArea(World.areas[i]);

			j = 0;

			for (j; j < monsters.length; j += 1) {
				if ((World.areas[i].runOnAliveWhenEmpty || players.length)
					|| (monsters[j].originatingArea !== World.areas[i].id)) {
					
					roomObj = World.getRoomObject(World.areas[i], monsters[j].roomid);

					if (monsters[j].chp >= 1) {
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
					Character.save(players[j]);
				}
			}
		}
	}
}, 1000);

setInterval(function() {
	var i = 0,
	msgObj;

	for (i; i < World.areas.length; i += 1) {
		if (typeof World.areas[i].messages === 'function') {
			World.areas[i].messages = World.areas[i].messages(World.areas[i]);
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
	var i = 0; 

	if (World.players.length) {
		if (World.dice.roll(1, 3) <= 2) {
			for (i; i < World.players.length; i += 1) {
				Character.hpRegen(World.players[i]);
				Character.manaRegen(World.players[i]);
				Character.mvRegen(World.players[i]);
			}
		}
	}
}, 30000);

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


// Saving
setInterval(function() { 
	var i = 0,
	player; 

	if (World.players.length > 0) {
		for (i; i < World.players.length; i += 1) {
			if (World.players[i].position === 'standing' && !World.players[i].opoonent) {
				Character.save(World.players[i]);
			}
		}
	}
}, 2450000); // 4.5 minutes

// Random mud-wide messages
setInterval(function() {
	var s,
	alerts = [
		'Commands are not case sensitive. Use HELP COMMANDS to see the current command list.',
		'Use the SCAN command to get a quick look at the rooms adjacent to you.'
	];

	if (World.players.length) {
		if (World.players.position !== 'fighting') {
			World.msgWorld(false, {
				msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
					+ alerts[World.dice.roll(1, alerts.length) - 1] + '</span></span>'
			});
		}
	}
}, 500000);

