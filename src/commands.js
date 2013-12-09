/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
*/
var fs = require('fs'),
Character = require('./character').character,
Room = require('./rooms').room,
Combat = require('./combat').combat,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas;

var Cmd = function () {

};

/*
	Exit Commands, may adjust for completely dynamic exits -- but seems trival atm
*/
Cmd.prototype.move = function(r, s) {
	if (s.player.position !== 'fighting' && s.player.position !== 'resting' && s.player.position !== 'sleeping') {
		r.cmd = r.msg;

		Room.checkExit(r, s, function(fnd, roomID) {
			if (fnd) {
				// Make the adjustment in the socket character reference
				Character.move(s, roomID, function(s) {
					Room.getRoomObject({
						area: s.player.area,
						id: roomID
					}, function(roomObj) {
						Room.getRoom(s, function() {
							return Character.prompt(s);
						});
					});
				}); 
			} else {
				s.emit('msg', {
					msg: 'There is no exit in that direction.', 
					styleClass: 'error'
				});
			}
		}); 
	} else {
		s.emit('msg', {
			msg: 'You are in no position to move right now!', 
			styleClass: 'error'
		});
	}
}

Cmd.prototype.who = function(r, s) {
	var str = '', 
	player,
	i = 0;
	
	if (players.length > 0) {
		for (i; i < players.length; i += 1) {
			player = io.sockets.socket(players[i].sid).player; // A visible player in players[]

			str += '<li>' + player.name[0].toUpperCase() + player.name.slice(1) + ' ';

			if (player.title === '') {
				str += 'a level ' + player.level   +
					' ' + player.race + 
					' ' + player.charClass; 
			} else {
				str += player.title;
			}					

			str += ' (' + player.role + ')</li>';
		}
					
		s.emit('msg', {
			msg: '<h1>Visible Players</h1>' + str, 
			styleClass: 'who-cmd'
		});
	} else {
		s.emit('msg', {
			msg: '<h1>No Visible Players</h1>', 
			styleClass: 'who-cmd'
		});
	}
	
	return Character.prompt(s);
}

Cmd.prototype.get = function(r, s, fn) {
	if (r.msg !== '') {
		Room.checkItem(r, s, function(fnd, item) {
			if (fnd) {
				Character.addToInventory(s, item, function(added) {
					if (added) {
						Room.removeItemFromRoom({area: s.player.area, id: s.player.roomid, item: item}, function() {
							s.emit('msg', {
								msg: 'You picked up ' + item.short,
								styleClass: 'get'
							});
							
							return Character.prompt(s);
						});
					} else {
						s.emit('msg', {msg: 'Could not pick up a ' + item.short, styleClass: 'error'});					
						return Character.prompt(s);
					}
				});
			} else {
				s.emit('msg', {msg: 'That item is not here.', styleClass: 'error'});
				return Character.prompt(s);
			}
		});
	} else {
		s.emit('msg', {msg: 'Get what?', styleClass: 'error'});
		return Character.prompt(s);
	}
}

Cmd.prototype.drop = function(r, s) {
	if (r.msg !== '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.removeFromInventory(s, item, function(removed) {
					if (removed) {
						Room.addItem({area: s.player.area, id: s.player.roomid, item: item}, function() {
							s.emit('msg', {
								msg: 'You dropped ' + item.short,
								styleClass: 'get'
							});
							
							return Character.prompt(s);
						});
					} else {
						s.emit('msg', {msg: 'Could not drop a ' + item.short, styleClass: 'error'});					
						return Character.prompt(s);
					}
				});
			} else {
				s.emit('msg', {msg: 'That item is not here.', styleClass: 'error'});
				return Character.prompt(s);
			}
		});
	} else {
		s.emit('msg', {msg: 'Drop what?', styleClass: 'error'});
		return Character.prompt(s);
	}
}


// For attacking in-game monsters
Cmd.prototype.kill = function(r, s) {
	Room.checkMonster(r, s, function(fnd, monster) {
		if (fnd) {
			Combat.begin(s, monster, function(contFight, monster) { // the first round qualifiers
				var combatInterval;
				
				if (contFight) {
					// Combat Loop
					combatInterval = setInterval(function() {
						if (s.player.position === 'fighting' && monster.position === 'fighting') {	
							
							Combat.round(s, monster, function() {
								if (monster.chp <= 0) {
									monster.position = 'dead';

									clearInterval(combatInterval);

									Character.calXP(s, monster, function(earnedXP) {
										s.player.position = 'standing';
										s.emit('msg', {msg: 'You won the fight! You learn some things, resulting in ' + earnedXP + ' experience points.', styleClass: 'victory'});
									});
								} else if (s.player.chp <= 0) {
									clearInterval(combatInterval);
									s.emit('msg', {msg: 'You died!', styleClass: 'combat-death'});
									//Character.death(s);
								}	

								Character.prompt(s);
							});	
						}	
					}, 1800);
				}
			});
		} else {
			s.emit('msg', {msg: 'There is nothing by that name here.', styleClass: 'error'});
			return Character.prompt(s);
		}
	});
}

Cmd.prototype.look = function(r, s) {
	if (r.msg === '') { 
		Room.getRoom(s, function(room) {
			return Character.prompt(s);
		});
	} else {
		// Gave us a noun, so lets see if something matches it in the room. 
		Room.checkMonster(r, s, function(fnd, monster) {
			Room.checkItem(r, s, function(fnd, item) {
				return Character.prompt(s);
			});
		});
	}
}

Cmd.prototype.where = function(r, s) {
	r.msg = '<ul>' + 
	'<li>Your Name: ' + Character[s.id].name + '</li>' +
	'<li>Current Area: ' + Character[s.id].area + '</li>' +
	'<li>Room Number: ' + Character[s.id].id + '</li>'  +
	'</ul>';	

	r.styleClass = 'playerinfo where';
	
	s.emit('msg', r);
	return Character.prompt(s);
};


/** Communication Channels **/
Cmd.prototype.say = function(r, s) {
	var i  = 0,
	msg = r.msg;

	Room.msgToRoom(msg, roomID, function() {

	});

	for (i; i < players.length; i += 1) {
		if (players[i].name === r.msg && r.msg !== s.player.name) {
			
		}
	}
};

Cmd.prototype.chat = function(r, s) {
	var msg = r.msg;

	s.emit('msg', {
		msg: 'You chat> ' + msg,
		element: 'blockquote',
		styleClass: 'msg'
	});
		
	r.msg = s.player.name + '> ' + msg;
	r.element = 'blockquote';
	r.styleClass = 'chatmsg';

	s.in('mud').broadcast.emit('msg', r);
	return Character.prompt(s);
};

Cmd.prototype.achat = function(r, s) { 
	var msg;

	if (s.player.role === 'admin') {
		msg = r.msg;

		s.emit('msg', {
			msg: 'You roar> ' + msg,
			element: 'blockquote',
			styleClass: 'msg'
		});
			
		r.msg = s.player.name + '> ' + msg;
		r.element = 'blockquote';
		r.styleClass = 'adminmsg';

		s.in('mud').broadcast.emit('msg', r);
		return Character.prompt(s);
	} else {
		r.msg = 'You do not have permission to execute this command.';
		s.emit('msg', r);		
		return Character.prompt(s);
	}
};

/** Related to Saving and character adjustment/interaction **/

Cmd.prototype.save = function(r, s) {
	Character.save(s, function() {
		s.emit('msg', {msg: s.player.name + ' was saved!', styleClass: 'save'});
		return Character.prompt(s);
	});
}

Cmd.prototype.title = function(r, s) {
	if (r.msg.length < 40) {
		if (r.msg != 'title') {
			s.player.title = r.msg;
		} else {
			s.player.title = 'a level ' + s.player.level + ' ' + s.player.race + ' ' + s.player.charClass;
		}

		Character.save(s, function() {
			Character.updatePlayer(s, function(updated) {
				s.emit('msg', {msg: 'Your title was changed!', styleClass: 'save'})
				return Character.prompt(s);
			});
		});
	} else {
		s.emit('msg', {msg: 'Not a valid title.', styleClass: 'save'});
		return Character.prompt(s);
	}
}

// View equipment
Cmd.prototype.equipment = function(r, s) {
	var keys = Object.keys(s.player.eq),
	eqStr = '',
	i = 0;	
	
	for (i; i < keys.length; i += 1) {
		eqStr += '<li>' + keys[i] + '</li>';
	}
	
	s.emit('msg', {
		msg: '<div class="name">You are wearing the following:</div>' +
			'<ul class="stats">' +
		eqStr + '</ul>', 
		styleClass: 'eq' 
	});
	
	return Character.prompt(s);
}

// Current skills
Cmd.prototype.skills = function(r, s) {
	var skills = '',
	i = 0;
	
	if (s.player.skills.length > 0) {
		for (i; i < s.player.skills.length; i += 1) {
			skills += s.player.skills[i].name;
		}
		
		s.emit('msg', {msg: 'skills', styleClass: 'eq' });
		return Character.prompt(s);
	} else {
		s.emit('msg', {msg: 'skills', styleClass: 'eq' });
		return Character.prompt(s);
	}
}

Cmd.prototype.wear = function(r, s) {
	if (r.msg !== '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.wear(r, s, item, function(wearSuccess, msg) {
					s.emit('msg', {msg: msg, styleClass: 'wear'});
					return Character.prompt(s);
				});
			} else {
				s.emit('msg', {msg: 'That item is not here.', styleClass: 'error'});
				return Character.prompt(s);
			}
		});
	} else {
		s.emit('msg', {msg: 'Wear what?', styleClass: 'error'});
		return Character.prompt(s);
	}
}

Cmd.prototype.inventory = function(r, s) {
	var iStr = '',
	i = 0;
	
	if (s.player.items.length > 0) {
		for (i; i < s.player.items.length; i += 1) {			
			iStr += '<li>' + s.player.items[i].short + '</li>';
		}
		
		s.emit('msg', {msg: '<ul>' + iStr + '</ul>', styleClass: 'inventory' });
		return Character.prompt(s);
	} else {
		s.emit('msg', {msg: 'No items in your inventory, can carry ' + s.player.carry + ' pounds of gear.', styleClass: 'inventory' });
		return Character.prompt(s);
	}
}

Cmd.prototype.score = function(r, s) { 
	var i = 0,
	score = '<div class="score-name">' + s.player.name + 
	' <div class="score-title">' + s.player.title + '</div></div>' +
	'<ul class="score-info">' + 
		'<li class="stat-hp">HP: ' + s.player.chp + '/' + s.player.hp +'</li>' +
		'<li class="stat-mana">Mana: ' + s.player.cmana + '/' + s.player.mana +'</li>' +
		'<li class="stat-mv">Stamina: ' + s.player.cmv + '/' + s.player.mv +'</li>' +
		'<li class="stat-level">You are a level '+ s.player.level + ' ' + s.player.race + ' ' + s.player.charClass + '</li>' +
		'<li class="stat-xp">XP: ' + s.player.exp + '/' + s.player.expToLevel + '</li>' +  
		'<li class="stat-position">Position: ' + s.player.position + '</li>' +
		'<li class="stat-carry">Carrying ' + s.player.load + '/' + s.player.carry + ' pounds.</li>' +
	'</ul>' +
	'<ul class="score-stats">' + 
		'<li class="stat-str">STR: ' + s.player.str + '</li>' +
		'<li class="stat-wis">WIS: ' + s.player.wis + '</li>' +
		'<li class="stat-int">INT: ' + s.player.int + '</li>' +
		'<li class="stat-dex">DEX: ' + s.player.dex + '</li>' +
		'<li class="stat-con">CON: ' + s.player.con + '</li>' +
		'<li class="stat-armor">Armor: ' + s.player.ac + '</li>' +
		'<li class="stat-gold">Gold: ' + s.player.gold + '</li>' +
		'<li class="stat-hunger">Hunger: ' + s.player.hunger + '</li>' +
		'<li class="stat-thirst">Thirst: ' + s.player.thirst + '</li>' +
	'</ul>';

	if (s.player.affects.length > 0) {
		score += '<ul class="score-affects">';

		for (i; i < s.player.affects; i += 1) {
			score += '<li>' + affects[i].name + '</li>';
		}

		score += '</ul>';
	} else {
		score += '<ul class="score-affects"><li>No Affects</li></ul>';
	}
	
	s.emit('msg', {msg: score, element: 'section', styleClass: 'score' });
	
	return Character.prompt(s);
}

Cmd.prototype.help = function(r, s) {
	// if we don't list a specific help file we return help.json
	var helpTxt = '';

	if (r.msg !== '') {
		fs.readFile('./help/' + r.msg + '.json', function (err, data) {
			if (!err) {
				data = JSON.parse(data);

				helpTxt = '<h2> ' + data.name + '</h2> ' + data.description + 
				'<p class="small">Related: '+ data.related.toString() + '</p>';

				s.emit('msg', {msg: helpTxt, styleClass: 'cmd-help' });

				return Character.prompt(s);
			} else {
				s.emit('msg', {msg: 'No help file found.', styleClass: 'error' });	

				return Character.prompt(s);
			}
		});	
	} else {
		s.emit('msg', {msg: 'Help you with what exactly?', styleClass: 'error' });

		return Character.prompt(s);
	}
}

/*
* Special Admin commands below here. You can confirm permission with a value connected to the current player  
*/

/*
* View a string representation of the JSON behind a world object. Pass in an ID (matches first), or noun pattern
* typing 'spit' alone will give the json object for the entire current room. 
*/
Cmd.prototype.spit = function(r, s) {
	if (s.player.role === 'admin') {
	
	}
}

/*
* A soft game reboot. 
* Stops all combat and reloads all active areas and players without restarting the server. Checks users role.
*/
Cmd.prototype.reboot = function(r, s) {
	if (s.player.role === 'admin') {

	} else {
		s.emit('msg', {msg: 'You wish!', styleClass: 'error' });	
		return Character.prompt(s);
	}
}

// Fully heal everyone on the MUD
Cmd.prototype.restore = function(r, s) {
	if (s.player.role === 'admin') {

	} else {
		s.emit('msg', {msg: 'You wish you possessed such power!', styleClass: 'error' });	
		return Character.prompt(s);
	}
}

module.exports.cmd = new Cmd();