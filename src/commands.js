/*
* All non-combat commands that one would consider 'general' to a wide section
* of users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
*/

var Character = require('./character').character,
Room = require('./rooms').room,
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas;

var Cmd = function () {
	this.perms = ['admin'];
};

/*
	Exit Commands, may adjust for completely dynamic exits -- but seems trival atm
*/

Cmd.prototype.north = function(r, s) {
	Room.checkExit(r.cmd, function(fnd) {
		if (fnd) {
			Room.move('north', s);
		} else {
			
		}
	}); 
}

Cmd.prototype.east = function(r, s) {

}

Cmd.prototype.south = function(r, s) {

}

Cmd.prototype.west = function(r, s) {

}

Cmd.prototype.who = function(r, s) {
	players.forEach(function(player) {
		var i = 0,
		str = '',
		player = io.sockets.socket(players[i].sid).player; // A visible player in players[]

		if (players.length > 0) {
			for (i; i < players.length; i += 1) {		
				str += '<li>' + player.name[0].toUpperCase() + 
					player.name.slice(1) + ' ';

				if (player.title === '') {
					str += 'a level ' + player.level   +
						' ' + player.race + 
						' ' + player.charClass; 
				} else {
					str += player.title;
				}					

				str += ' (' + player.role + ')' +					
					'</li>';

				player = io.sockets.socket(players[i].sid).player;
			}
			
			s.emit('msg', {
				msg: '<h1>Visible Players</h1>' + str, 
				styleClass: 'who-cmd'
			});
		} else {
			s.emit('msg', {
				msg: '<h1>Visible Players</h1>' + str, 
				styleClass: 'who-cmd'
			});
		}
	});
	
	return Character.prompt(s);
}

Cmd.prototype.get = function(r, s, fn) {
	if (r.msg != '') {
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
	if (r.msg != '') {
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

Cmd.prototype.say = function(r, s) {
	var i  = 0;

	for (i; i < players.length; i += 1) {
		if (players[i].name === r.msg && r.msg != s.player.name) {
			
		}
	}
};

Cmd.prototype.look = function(r, s) {
	Room.getRoom(s, function(room) {
		return Character.prompt(s);
	});
}

Cmd.prototype.chat = function(r, s) {
	var msg = r.msg;
		
	r.msg = 'You chat> ' + msg;
	r.styleClass = 'msg';
		
	s.emit('msg', r);
		
	r.msg = '';
	r.msg = s.player.name + '> ' + msg;
		
	s.in('mud').broadcast.emit('msg', r);

	return Character.prompt(s);
};

// Example of a command requiring certain permissions
Cmd.prototype.achat = function(r, s) { 
	if (this.perms.indexOf(s.player.role) != -1) {
		var msg = r.msg;
		r.msg = 'You admin chat> ' + msg;
		r.styleClass = 'admin-msg';
	
		s.emit('msg', r);
		r.msg = '';
	    r.msg = 'A great voice> ' + msg;
		
		s.broadcast.emit('msg', r);
		return Character.prompt(s);
	} else {
		r.msg = 'You do not have permission to execute this command.';
		s.emit('msg', r);		
		
		return Character.prompt(s);
	}
};

Cmd.prototype.flame = function(r, s) { 

};

Cmd.prototype.where = function(r, s) {
	r.msg = '<ul>' + 
	'<li>Your Name: ' + Character[s.id].name + '</li>' +
	'<li>Current Area: ' + Character[s.id].area + '</li>' +
	'<li>Room Number: ' + Character[s.id].id + '</li>'  +
	'</ul>';	
	r.styleClass = 'playerinfo cmd-where';
	
	s.emit('msg', r);
	
	return Character.prompt(s);
};

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
	eq = '',
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
	if (r.msg != '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.removeFromInventory(s, item, function(removed) {
					if (removed) {
						Character.wearItem(item, function() {
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
	var score = '<div class="name">' + s.player.name + 
	' <div class="title">' + s.player.title + '</div></div>' +
	'<ul class="stats">' + 
		'<li>HP: ' + s.player.chp + '/' + s.player.hp +'</li>' +
		'<li>You are a level '+ s.player.level + ' ' + s.player.race + 
		' ' + s.player.charClass + '</li>' +
		'<li>STR: ' + s.player.str + '</li>' +
		'<li>WIS: ' + s.player.wis + '</li>' +
		'<li>INT: ' + s.player.int + '</li>' +
		'<li>DEX: ' + s.player.dex + '</li>' +
		'<li>CON: ' + s.player.con + '</li>' +
		'<li>Armor: ' + s.player.ac + '</li>' +
		'<li>XP: ' + s.player.exp + '/' + s.player.expToLevel + '</li>' +  
		'<li>Gold: ' + s.player.gold + '</li>' +
		'<li>Hunger: ' + s.player.hunger + '</li>' +
		'<li>Thirst: ' + s.player.thirst + '</li>' +
		'<li>Carrying ' + s.player.load + '/' + s.player.carry + ' LBs</li>' +
	'</ul>';
	
	s.emit('msg', {msg: score, styleClass: 'score' });
	return Character.prompt(s);
}

module.exports.cmd = new Cmd();