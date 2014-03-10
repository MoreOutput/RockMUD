/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
*/
"use strict";

var fs = require('fs'),
Character = require('./character').character,
Room = require('./rooms').room,
Combat = require('./combat').combat,
io = require('../server').io,
players = require('../server').players,
time = require('../server').time,
areas = require('../server').areas;

var Cmd = function () {

};

Cmd.prototype.move = function(r, s) {
	if (s.player.position !== 'fighting' && s.player.position !== 'resting' && s.player.position !== 'sleeping' && s.player.cmv > 5) {
		r.cmd = r.msg;

		Room.checkExit(r, s, function(fnd, roomid) {
			if (fnd) {
				Room.msgToRoom({
					msg: s.player.name + ' the ' + s.player.race + ' walks ' + r.cmd + '.', 
					playerName: s.player.name, 
					roomid: s.player.roomid
				}, true);

				s.player.cmv = Math.round((s.player.cmv - (12 - s.player.dex/4)));	
				s.player.roomid = roomid; // Make the adjustment in the socket character reference.

				Character.updatePlayer(s);

				Room.getRoomObject({
					area: s.player.area,
					id: roomid
				}, function(roomObj) {
					Room.getRoom(s, function() {
						Room.msgToRoom({
							msg: s.player.name + ' the ' + s.player.race + ' enters the room.', 
							playerName: s.player.name, 
							roomid: roomid
						}, true, function() {
							return Character.prompt(s);
						});
					});
				});
			} else {
				s.emit('msg', {
					msg: 'There is no exit in that direction.', 
					styleClass: 'error'
				});

				return Character.prompt(s);
			}
		}); 
	} else {
		s.emit('msg', {
			msg: 'You cant move right now!', 
			styleClass: 'error'
		});

		return Character.prompt(s);
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
							console.log(item);
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
								
									Room.removeMonster({
										area: s.player.area,
										id: s.player.roomid
									}, monster, function(removed) {
										if (removed) {
											Room.addCorpse(s, monster, function(corpse) {
												Combat.calXP(s, monster, function(earnedXP) {
													s.player.position = 'standing';

													if (earnedXP > 0) {
														s.emit('msg', {msg: 'You won the fight! You learn some things, resulting in ' + earnedXP + ' experience points.', styleClass: 'victory'});
													} else {
														s.emit('msg', {msg: 'You won, but learned nothing.', styleClass: 'victory'});
													}
												});
											});
										}
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
	var i  = 0;
	
	s.emit('msg', {msg: 'You say> ' + r.msg, styleClass: 'cmd-say'});
	
	Room.msgToRoom({
		msg: s.player.name + ' says> ' + r.msg +  '.', 
		playerName: s.player.name, 
		roomid: s.player.roomid
	}, true);
};

Cmd.prototype.yell = function(r, s) {
	var i  = 0;
	
	s.emit('msg', {msg: 'You yell> ' + r.msg, styleClass: 'cmd-say'});
	
	Room.msgToArea({
		msg: s.player.name + ' yells> ' + r.msg +  '.', 
		playerName: s.player.name
	}, true);
};


Cmd.prototype.chat = function(r, s) {
	var msg = r.msg;

	s.emit('msg', {
		msg: 'You chat> ' + msg,
		element: 'blockquote',
		styleClass: 'msg'
	});

	s.in('mud').broadcast.emit('msg', {
		msg: s.player.name + '> ' + msg,
		element: 'blockquote',
		styleClass: 'chatmsg'
	});

	/* 
	If you want to return prompt after each message you can use the below,
	be sure to define i

	for (i; i < players.length; i += 1) {
		Character.prompt(s);
		s = io.sockets.socket(players[i].sid);
	}	
	*/
};

/*
Cmd.prototype.tell = function(r, s) {
	var i  = 0;
	
	s.emit('msg', {msg: 'You tell ' + r.playerName + '> ' + r.msg, styleClass: 'cmd-say'});
	
	Character.msgToPlayer({
		msg: s.player.name + ' tells you> ' + r.msg +  '.', 
		playerName: s.player.name
	}, true);
};

Cmd.prototype.reply = function(r, s) {
	var i  = 0;
	
	s.emit('msg', {msg: 'You reply to ' + s.player.reply + '> ' + r.msg, styleClass: 'cmd-say'});
	
	Character.msgToPlayer({
		msg: s.player.name + ' tells you> ' + r.msg +  '.', 
		playerName: s.player.name
	}, true);
};
*/

Cmd.prototype.achat = function(r, s) { 
	var msg = r.msg;

	if (s.player.role === 'admin') {
		s.emit('msg', {
			msg: 'You achat> ' + msg,
			element: 'blockquote',
			styleClass: 'adminmsg'
		});

		s.in('mud').broadcast.emit('msg', {
			msg: s.player.name + ' the Admin> ' + msg,
			element: 'blockquote',
			styleClass: 'adminmsg'
		});
	} else {
		r.msg = 'You do not have permission to execute this command.';
		s.emit('msg', r);		
		return Character.prompt(s);
	}
};

// Viewing the time
Cmd.prototype.time = function(r, s) {

}

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

		Character.updatePlayer(s, function(updated) {
			s.emit('msg', {msg: 'Your title was changed!', styleClass: 'save'})
			return Character.prompt(s);
		});
	} else {
		s.emit('msg', {msg: 'Not a valid title.', styleClass: 'save'});
		return Character.prompt(s);
	}
}

// View equipment
Cmd.prototype.equipment = function(r, s) {
	var bodyAreas = Object.keys(s.player.eq),
	eqStr = '',
	i = 0,
	j = 0;	
	
	for (i; i < bodyAreas.length; i += 1) {	
		j = 0;
		
		for (j; j < s.player.eq[bodyAreas[i]].length; j += 1) {
			eqStr += '<li class="' + bodyAreas[i] + 
				' slot-' + s.player.eq[bodyAreas[i]][j].name.replace(/ /g, '') + 
				'">' + s.player.eq[bodyAreas[i]][j].name + ': ';
			
			if (s.player.eq[bodyAreas[i]][j].item === null || s.player.eq[bodyAreas[i]][j].item === '') {
				eqStr += ' Nothing</li>';
			} else {
				eqStr += '<strong>'  + s.player.eq[bodyAreas[i]][j].item.short + '</strong></li>';
			}
		}
	}
	
	s.emit('msg', {
		msg: '<h3>You are wearing:</h3>' +
			'<ul class="equipment-list">' +
		eqStr + '</ul>', 
		styleClass: 'cmd-eq' 
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
					s.emit('msg', {msg: msg, styleClass: 'cmd-wear'});
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

/*
Cmd.prototype.remove = function(r, s) {
	if (r.msg !== '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.remove(r, s, item, function(removeSuccess, msg) {
					s.emit('msg', {msg: msg, styleClass: 'cmd-wear'});
					return Character.prompt(s);
				});
			} else {
				s.emit('msg', {msg: 'You are not wearing that.', styleClass: 'error'});
				return Character.prompt(s);
			}
		});
	} else {
		s.emit('msg', {msg: 'Remove what?', styleClass: 'error'});
		return Character.prompt(s);
	}
}
*/

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
		'<li class="stat-mv">Moves: ' + s.player.cmv + '/' + s.player.mv +'</li>' +
		'<li class="stat-level">You are a level '+ s.player.level + ' ' + s.player.race + ' ' + s.player.charClass + '</li>' +
		'<li class="stat-xp">XP: ' + s.player.exp + '/' + s.player.expToLevel + '</li>' +  
		'<li class="stat-position">Position: ' + s.player.position + '</li>' +
		'<li class="stat-carry">Carrying ' + s.player.load + '/' + Character.getLoad(s) + ' pounds.</li>' +
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

				helpTxt = '<h2>Help: ' + data.name + '</h2> ' + data.description + 
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

Cmd.prototype.xyzzy = function(s) {
	Room.msgToRoom({
		msg: s.player.name + 	' tries to xyzzy but nothing happens.', 
		roomid: s.player.roomid,
		styleClass: 'error'
	}, true, function() {
		s.emit('msg', {msg: 'Nothing happens!', styleClass: 'error' });

		return Character.prompt(s);
	});
}

/*
* Special Admin commands below here. You can confirm permission with a value connected to the current player  
*/

/*
* View a string representation of the JSON behind a world object.
* Syntax: json objectType (item, room, monster or player)
* typing 'json' alone will give the json object for the entire current room. 
*/
Cmd.prototype.json = function(r, s) {
	if (s.player.role === 'admin') {
		
	} else {
		s.emit('msg', {msg: 'Nothing happens!', styleClass: 'error' });
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
		s.emit('msg', {msg: 'You do not possess that kind of power.', styleClass: 'error' });	
		return Character.prompt(s);
	}
}

module.exports.cmd = new Cmd();