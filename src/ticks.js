'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

(function() {
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
							World.dice.roll(1, 10, function(roll) {
								monster.onAlive(roll);
							});
						}
					});
				});
			}
		}
	//}, 1000); // 25 seconds
	}, 25000); // 25 seconds

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
						Character.mvRegen(player, function(player, addedMv) {
							Character.updatePlayer(player);
						});
					});
				});
			}
		}
	}, 50000);

	// Hunger and Thirst Tick 
	setInterval(function() { 
		var i = 0,
		player; 

		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				player = World.players[i];

				Character.hunger(player, function(target) {
					Character.thirst(target, function(target) {
						Character.updatePlayer(target);
					});
				});
			}
		}
	}, 120000);
/*

	// Saving characters Tick
	setInterval(function() {
		var i = 0,
		s;
		
		if (players.length > 0) {
			for (i; i < players.length; i += 1) {
				s = io.sockets.connected[players[i].sid];
				
				if (s.position === 'sleeping' || 
					s.position === 'resting' || 
					s.position === 'standing') {			
					Character.save(s);			
				}							
			}
		}
	}, 60000 * 12);

	// Random alert to all logged in players
	setInterval(function() {
		var s,
		shuffle = function (arr) {
			var i = arr.length - 1,
			j = Math.floor(Math.random() * i),
			temp;
			
			for (i; i > 0; i -= 1) {
				temp = arr[i];
				arr[i] = arr[j];
				arr[j] = temp;
				
				j = Math.floor (Math.random() * i);
			} 
			
			return arr;
		};

		if (players.length > 0) {	
			fs.readFile('./motd.json', function (err, data) {
				var i = 0,
				alert = shuffle(JSON.parse(data).alerts)[0];

				io.sockets.to('mud').emit('msg', {
					msg: '<span class="alert">ALERT: </span><span class="alertmsg"> ' + alert + '</span>',
					styleClass: 'alert'
				});

				for (i; i < players.length; i += 1) {
					s = io.sockets.connected[players[i].sid];
					Character.prompt(s);				
				}	
			});	
		}	
	}, 50000);
*/

	// Time -- Increase minute, hours, days and years.
	// time data is saved to data/time.json every 12 hours
}());
