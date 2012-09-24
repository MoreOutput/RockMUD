/*
Commands need to confirm user permissions
*/
var dice = require('./dice'),
Character = require('./character').character,
Room = require('./rooms').room;

var Cmd = function () {
	this.perms = ['admin'];
};

Cmd.prototype.parse = function(r, s, player, players) {
	r.cmd = r.msg.replace(/_.*/, '');
	r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');
	r.emit = 'msg';
						
	if (r.res in Character || r.cmd in Character) {
		return Character[r.res](r, s, player, players);
	} else if (r.cmd in this) {
		return this[r.cmd](r, s, player, players);
	} else if (r.cmd in Room) {
		return Room[r.cmd](r, s, player, players);	
	} else {
		s.emit('msg', {msg: 'Not a valid command.', styleClass: 'error'});	
		return Character.prompt(s, player);
	}
}

Cmd.prototype.save = function(r, s) {
	if (Character.save(s.id)) {
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

Cmd.prototype.l = function(r, s, player, players) { // unacceptable
	Room.look(r, s, player, players, function() {
		console.log(123123);
	});
}

Cmd.prototype.chat = function(r, s, player) {
	var msg = r.msg;
		
	r.msg = 'You chat> ' + msg;
	r.styleClass = 'msg';
		
	s.emit('msg', r);
		
	r.msg = '';
	r.msg = player.name + '> ' + msg;
		
	s.in('mud').broadcast.emit('msg', r);

	return Character.prompt(s, player);
};

Cmd.prototype.achat = function(r, s, player) {
	if (this.perms.indexOf(player.role) != -1) {
		var msg = r.msg;
		r.msg = 'You admin chat> ' + msg;
		r.styleClass = 'msg';
	
		s.emit('msg', r);
		r.msg = '';
	    r.msg = 'The Great Oracle> ' + msg;
		
		return s.broadcast.emit('msg', r);
	} else {
		r.msg = 'You do not have permission to execute this command.';
		s.emit('msg', r);		
		
		return Character.prompt(s, player);
	}
};

Cmd.prototype.flame = function(r, s) {

};

Cmd.prototype.kill = function(r, s) {
	r.msg = '<div class="cmd-kill">' +
		'You slash a wolf with <div class="hit">***UNRELENTING***</div> force.</div>';
    r.styleClass = 'cbt';
	
	return s.emit('msg', r);
};

Cmd.prototype.changes = function(r, s, player) {
   	return Character.prompt(s, player);
};

Cmd.prototype.where = function(r, s) {
	r.msg = '<ul>' + 
	'<li>Your Name: ' + Character[s.id].name + '</li>' +
	'<li>Current Area: ' + Character[s.id].area + '</li>' +
	'<li>Room Number: ' + Character[s.id].vnum + '</li>'  +
	'</ul>';	
	r.styleClass = 'playerinfo cmd-where';
	
	return s.emit('msg', r);
};

Cmd.prototype.who = function(r, s, player, players) {
	s.emit('msg', {
		msg: (function () {
			var str = '',
			key,
			obj = {},
			i = 0;
			
			if (Object.keys(players).length > 0 ) {
				for (key in players) {
					var obj = players[key];
					str += '<li><div class="name">' + obj.name[0].toUpperCase() + 
					obj.name.slice(1) + 
					'</div><div class="level">a level ' + obj.level   +
					'</div><div class="race">' + obj.race + 
					'</div><div class="class">' + obj.charClass +  
					'</div></li>';
				}
			} else {
				str = '<li>No one is online.</li>';
			}
			
			return '<h1>Currently logged on</h1><ul>' +
				'<li>*******Players Online******</li>' +
				str +
				'<li>***************************</li>' + 
				'</ul>'; 
				
		}()), styleClass: 'who-cmd'
	});
}

module.exports.cmds = new Cmd();