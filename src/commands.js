var dice = require('./dice'),
Character = require('./character').character,
Room = require('./rooms').room;

var Cmd = function () {
	this.perms = ['admin'];
};

Cmd.prototype.save = function(r, s, players, fn) {
	if (Character.save(s.player)) {
		return s.emit('msg', {msg: 'Saved!.'});
	} else {
		return s.emit('msg', {msg: 'Save failed.'});
	}
}

Cmd.prototype.removePlayer = function(s) {
	var i = 0;
	for (i; i < cmds.players.length; i += 1) {
		if (Character[s.id].name === cmds.players[i].name) {
			if (i === 0) {
				cmds.players = [];
			} else {
				cmds.players[i] = null;
				cmds.players.splice(i, 1);
			}
		}	
	}	
};

/*
* Channels
*/
Cmd.prototype.say = function(r, s) {

};

Cmd.prototype.look = function(r, s, players) {
	Room.getRoom(r, s, players, function(room) {
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

Cmd.prototype.kill = function(r, s, players) {
	r.msg = 'You slash a wolf with <div class="hit">***UNRELENTING***</div> force.';
    r.styleClass = 'cbt';
	
	s.emit('msg', r);

	return Character.prompt(s);
};

Cmd.prototype.changes = function(r, s, player) {
   	return Character.prompt(s);
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

Cmd.prototype.who = function(r, s, players) {
	s.emit('msg', {
		msg: (function () {
			var str = '',
			i = 0;
			
			if (players.length > 0) {
				for (i; i < players.length; i += 1) {				
					str += '<li>' + players[i].name[0].toUpperCase() + 
					players[i].name.slice(1) + ' ' +
					(function() {
						if (s.player.title === '') {
							return 'a level ' + players[i].level   +
							' ' + players[i].race + 
							' ' + players[i].charClass; 
						} else {
							return s.player.title;
						}
					
					}()) +
					' (' + players[i].role + ')'
					
					'</li>';					
					
					if (i === players.length - 1) {
						return '<h1>Currently logged on</h1><ul>' +
						'<li>*******Players Online******</li>' +
						str +
						'<li>***************************</li>' + 
						'</ul>'; 
					}
					
				}
			} else {
				str = '<li>No one is online.</li>';
					return '<h1>Currently logged on</h1><ul>' +
					'<li>*******Players Online******</li>' +
					str +
				'<li>***************************</li>' + 
				'</ul>'; 
			}				
		}()), styleClass: 'who-cmd'
	});
	
	return Character.prompt(s);
}

Cmd.prototype.save = function(r, s, players) {
	Character.save(r, s, players, function() {
		s.emit('msg', {msg: s.player.name + ' was saved!', styleClass: 'save'})
		return Character.prompt(s);
	});
}

Cmd.prototype.title = function(r, s, players) {
	s.player.title = r.msg;
	Character.save(r, s, players, function() {
		s.emit('msg', {msg: 'Your title was changed!', styleClass: 'save'})
		return Character.prompt(s);
	});
}

Cmd.prototype.score = function(r, s, players) { 
	s.emit('msg', {msg: JSON.stringify(s.player, null, 4), styleClass: 'score' });
}

module.exports.cmds = new Cmd();