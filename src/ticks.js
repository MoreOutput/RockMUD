'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

(function() {
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
			// Morning
			World.time.isDay = true;
			areaMsg = 'The sun appears over the horizon.';
		} else if (World.time.hour === World.time.month.hourOfNight && World.time.minute === 1) {
			// Nightfall
			World.time.isDay = false;
			areaMsg = 'The sun fades fully from view as night falls.';
		}

		if (World.areas.length && areaMsg) {
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
	}, 1000);

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
	// area.respawnOn (default is 3 -- 12 minutes). A respawnOn value of zero prevents respawn.
	// areas do not update if someone is fighting
	setInterval(function() {
		var i = 0,
		j = 0,
		k = 0,
		refresh = true;
		
		if (World.areas.length) {
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
								}
							}
						}(area.rooms[j], index, j));
					}
				}(World.areas[i], i))
			}
		}
	}, 240000); // 4 minutes

	// decay timer, affects all items with decay, decayLight
	// if an item with decay (not decayLight) reaches zero it goes away
	// if an item with decayLight reaches zero it goes out. Printing a generic message unless an onDestory event is found
	// if onDestory is found then the programmer should return a message
	// fires onDecay, onDecayLight, onDestory
	setInterval(function() {
		var i = 0,
		player;

		// decay player items
		if (World.dice.roll(1, 20) < 18) {
			if (World.players.length > 0) {
				for (i; i < World.players.length; i += 1) {
					
				}
			}
		}

		// decay mob items

		// decay room items

	}, 245000); // 4.5 minutes
	
	// AI Ticks for monsters
	setInterval(function() {
		var i = 0,
		monsters;

		if (World.areas.length) {
			for (i; i < World.areas.length; i += 1) {
				monsters = World.getAllMonstersFromArea(World.areas[i].name);
				
				monsters.forEach(function(monster, i) {
					if (monster.chp >= 1 && monster.onAlive) {
						monster.onAlive(World.getRoomObject(monster.area, monster.roomid));
					}
				});
			}
		}
	}, 15000);
	//}, 1000);
	
	// AI Ticks for areas 
	setInterval(function() {
		var i = 0,
		s;

	}, 3600000); // 1 hour

	setInterval(function() {
		var i = 0;
		
		if (World.areas.length) {
			for (i; i < World.areas.length; i += 1) {
				if (World.areas[i].messages.length) {
					World.msgArea(World.areas[i].name, {
						msg: World.areas[i].messages[World.dice.roll(1, World.areas[i].messages.length) - 1].msg,
						randomPlayer: true // this options randomizes who hears the message
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
			'Think of this as an example newbie help tick.'
		];

		if (World.players.length > 0) {
			World.msgWorld(false, {
				msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
					+ alerts[World.dice.roll(1, alerts.length) - 1] + '</span></span>'
			});
		}
	}, 240000);
}());
