'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

(function() {
	// time, saved to time.json every 12 hours
	setInterval(function() {
		var i = 0,
		areaMsg;

		if (World.time.tick === 2) {
			World.time.tick = 1;
			World.time.minute += 1;
		}

		if (World.time.minute === 60) {
			World.time.minute = 1;
			World.time.hour += 1;
		}

		if (World.time.hour === 24) {
			World.time.hour = 1;
			World.time.day += 1;
		}

		if (World.time.hour === World.time.hourOfLight && World.time.minute === 1) {
			// Morning
			World.time.isDay = true;
			areaMsg = 'The sun appears over the horizon.';
		} else if (World.time.hour <= World.time.hoursOfNight && World.time.minute === 1) {
			// nightfall
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

		if (World.time.day === 30) {
			World.time.day = 0;
		}

		World.time.tick += 1;
	}, 500);

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

	// Areas refresh when they are devoid of players for at least four minutes 
	setInterval(function() {
		var i = 0;

	}, 240000); // 4 minutes

	// AI Ticks for monsters
	setInterval(function() {
		var i = 0;
		if (World.areas.length) {
			for (i; i < World.areas.length; i += 1) {
				World.getAllMonstersFromArea(World.areas[i].name, function(monsters) {
					monsters.forEach(function(monster, i) {
						if (monster.chp >= 1 && monster.onAlive) {
							monster.onAlive();
						}
					});
				});
			}
		}
	//}, 1000); // 25 seconds
	}, 25000); // 30 seconds

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
	}, 180000); // 3 minutes


	// Regen (Player only ATM);
	setInterval(function() { 
		var i = 0,
		player; 

		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				player = World.players[i];

				Character.hpRegen(player, function(player, addedHP) {
					Character.manaRegen(player, function(player, addedMana) {
						Character.mvRegen(player);
					});
				});
			}
		}
	}, 60000);

	// Hunger and Thirst Tick 
	setInterval(function() { 
		var i = 0,
		player; 

		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				player = World.players[i];

				Character.hunger(player, function(target) {
					Character.thirst(target);
				});
			}
		}
	}, 240000); // 4 minutes

	setInterval(function() {
		var s;

		if (World.players.length > 0) {
			fs.readFile('./templates/messages/motd.json', function (err, data) {
				var i = 0,
				alert = World.shuffle(JSON.parse(data).alerts)[0];

				for (i; i < World.players.length; i += 1) {
					World.msgPlayer(World.players[i], {
						msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
							+ alert.replace(/@.*@/, World.players[i].displayName) + '</span></span>'
					});
				}
			});	
		}	
	}, 120000);
}());
