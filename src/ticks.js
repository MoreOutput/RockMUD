/*
This module houses all the timed events on the server. For example:
	* Hunger/Thirst/Regen ticks every minute
	* Every Tweleve minutes the character is saved if they're not in a fight
	* Every fifteen minutes all the areas in memory are checked any with no players is removed from areas[]
*/
var fs = require('fs'),
Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas;

(function() {
	// Regen, Hunger and Thirst Tick 
	setInterval(function() { 
		var i = 0,
		s; 

		if (players.length > 0) {	
			for (i; i < players.length; i += 1) {
				s = io.sockets.socket(players[i].sid);		
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
	}, 60000 * 2);	

	// Saving characters Tick
	setInterval(function() {
		var i = 0,
		s;
		
		if (players.length > 0) {
			for (i; i < players.length; i += 1) {
				s = io.sockets.socket(players[i].sid);
				
				if (s.position != 'fighting') {			
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
			s = io.sockets.socket(players[0].sid);
			fs.readFile('./motd.json', function (err, data) {
				alerts = shuffle(JSON.parse(data).alerts);

				io.sockets.in('mud').emit('msg', {
					msg: '<span class="alert">ALERT: </span><span class="alertmsg"> ' + alerts[0] + '</span>',
					styleClass: 'alert'
				});
			});
		}
	}, 60000 * 3.5);
}());