'use strict';

var fs = require('fs'),
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,
time = require('../server').time,
timeConfig = require('../config').server.gameTime;

(function() {
	// Automated wait-state removal
	setInterval(function() { 
		var i = 0,
		s;

		if (players.length > 0) {	
			for (i; i < players.length; i += 1) {
				s = io.sockets.connected[players[i].sid];

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
	}, 800);	

	// Regen, Hunger and Thirst Tick 
	setInterval(function() { 
		var i = 0,
		s; 

		if (players.length > 0) {	
			for (i; i < players.length; i += 1) {
				s = io.sockets.connected[players[i].sid];		
				Character.hunger(s, function() {
					Character.thirst(s, function() {
						Character.hpRegen(s, function(total) {
							Character.updatePlayer(s, function() {
								Character.prompt(s);
							});
						});
					});
				});					
			}		
		}	
	}, 60000 * 3);	

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


	// Time -- Increase minute, hours, days and years.
	// time data is saved to data/time.json every 12 hours
}());