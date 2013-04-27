/*
This module houses all the timed events on the server. For example:
	* Hunger/Thirst/Regen ticks every minute
	* Every Tweleve minutes the character is saved if they're not in a fight
	* Every fifteen minutes all the areas in memory are checked any with no players is removed from areas[]
*/
var Character = require('./character').character,
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
	}, 60000);	

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

	// Every fifteen minutes remove all areas with no users inside of them
}());