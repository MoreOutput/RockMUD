var Character = require('./character').character,
Room = require('./rooms').room,
Server = require('../server'); 
io = null,
players = require('../server').players;
areas = require('../server').areas;

var Cmd = function () {
	this.perms = ['admin'];
};

Cmd.prototype.who = function(r, s) {
	io = require('../server').io;
	
	players.forEach(function(player) {
		var i = 0,
		str = '',
		s = io.sockets.socket(players[0].sid);

		if (players.length > 0) {
			for (i; i < players.length; i += 1) {
				str += '<li>' + s.player.name[0].toUpperCase() + 
					s.player.name.slice(1) + ' ' +
					(function() {
						if (s.player.title === '') {
							return 'a level ' + players[i].level   +
							' ' + s.player.race + 
							' ' + s.player.charClass; 
						} else {
							return s.player.title;
						}
					
					}()) +
					' (' + s.player.role + ')' +					
					'</li>';	
					
				if (i === players.length - 1) {
					return s.emit('msg', {
						msg:  
						'<h1>Visible Players</h1>' +
						str, 
						styleClass: 'who-cmd'
					});
				}
			}
		}
	});
	
	return Character.prompt(s);
}

Cmd.prototype.get = function(r, s, fn) {
	if (r.msg != '') {
		Room.checkItem(r, s, function(fnd, item) {
			if (fnd) {
				return s.emit('msg', {
					msg: 'You picked up ' + item.short,
					styleClass: 'get'
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

Cmd.prototype.say = function(r, s) {
	var i  = 0;

	for (i; i < players.length; i += 1) {
		if (players[i].name === r.msg && r.msg != s.player.name) {
			
		} else {
			
		}
	}
};

Cmd.prototype.look = function(r, s) {
	Room.getRoom(r, s, function(room) {
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
		
		return s.broadcast.emit('msg', r);
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
	'<li>Room Number: ' + Character[s.id].vnum + '</li>'  +
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
Cmd.prototype.eq = function(r, s) {
	var eq = '<div class="name">You are wearing the following:</div>' +
	'<ul class="stats">' + 
		'<li>Right Hand: </li>' +
		'<li>Left Hand: </li>' +
	'</ul>',
	i = 0;
	
	s.emit('msg', {msg: eq, styleClass: 'eq' });
	return Character.prompt(s);
}

// Current skills
Cmd.prototype.skills = function(r, s) {
	var skills = '',
	i = 0;
	
	s.emit('msg', {msg: 'skills', styleClass: 'eq' });
	return Character.prompt(s);
}

Cmd.prototype.wear = function(r, s) {
	if (r.msg != '') {

	} else {
		s.emit('msg', {msg: 'Wear what?', styleClass: 'error'});
		return Character.prompt(s);
	}
}

Cmd.prototype.inventory = function(s) {
	var iStr = '';
	s.emit('msg', {msg: '', styleClass: 'inventory' });
	return Character.prompt(s);
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