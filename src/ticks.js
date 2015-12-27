'use strict';
var fs = require('fs'),
Character = require('./character').character,
World = require('./world').world;

(function() {
	// wait-state removal
	setInterval(function() {
		var i = 0,
		s;
		
		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				s = World.io.sockets.connected[World.players[i].sid];

				if (s.player.position === 'sleeping' || 
					s.player.position === 'resting' || 
					s.player.position === 'standing') {
					
					if (s.player.wait > 0) {
						s.player.wait -= 1;
					} else {
						s.player.wait = 0;
					}
				}
			}
		}
	}, 1100);

	// Areas reload when they are devoid of players or when they have the property: reload: true.
	setInterval(function() {
		var i = 0;

	}, 3600000); // 1 hour

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
	}, 20000); // 20 seconds

	// AI Ticks for areas 
	setInterval(function() {
		var i = 0,
		s;

	}, 3600000); // 1 hour

	// Area messages, every three minutes the mud has a 50% chance of giving the player
	// a random message found in room.messages (with area.messages being checked if theres nothing)
	setInterval(function() {

	}, 180000); // 3 minutes

	// Regen, Hunger and Thirst Tick 
	setInterval(function() { 
		var i = 0,
		player; 

		if (World.players.length > 0) {
			for (i; i < World.players.length; i += 1) {
				player = World.io.sockets.connected[World.players[i].sid].player;
				Character.hunger(player, function(target) {
					Character.thirst(target, function(target) {
						Character.hpRegen(target, function(target, addedHP) {
							Character.manaRegen(target, function(target, addedMana) {
								Character.mvRegen(target, function(target, addedMv) {
									Character.updatePlayer(target);
								});
							});
						});
					});
				});
			}
		}
	}, 32000);
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
