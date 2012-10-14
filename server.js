/*
 * RockMUD, NodeJS HTTP Mud Engine
 * Rocky Bevins, 2012 (rockybevins@gmail.com)
 * We want to be able to build Diku style MUDs with only JS (areas will be JSON). 
*/

var sys = require('util'),
http = require('http'),
fs = require('fs'),
Character = require('./src/character').character,
Cmds = require('./src/commands').cmd, 
Skills = require('./src/skills').skill,
cfg = require('./config').server,
players = [], 
areas = [],
server  = http.createServer(function (req, res) {
	if (req.url === '/' || req.url === '/index.html') {
		fs.readFile('./index.html', function (err, data) {
        	if (err) {
				throw err;
			}

			res.writeHead(200, {'Content-Type': 'text/html'});
        	res.write(data);
			res.end();
		});
	} else if (req.url === '/styles.css') {
		fs.readFile('./public/css/styles.css', function (err, data) {
			if (err) {
				throw err;
            }

          	res.writeHead(200, {'Content-Type': 'text/css'});
           	res.write(data);
           	res.end();
        });
    } else if (req.url === '/amclient.js') {
		fs.readFile('./public/js/amclient.js', function (err, data) {
			if (err) {
				throw err;
            }

            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
        });
	}
}),
io = require('socket.io').listen(server);

server.listen(cfg.port);

// Ticks
setInterval(function() { 
	var i = 0,
	s = {};

	if (players.length > 0) {	
		for (i; i < players.length; i += 1) {
			s = io.sockets.socket(players[i].sid);
			if (s.player.chp < s.player.hp) {			
				Character.hpRegen(s, function(total) {
					Character.hunger(s, function() {
						Character.thirst(s, function() {	
							Character.prompt(s);
							Character.updatePlayer(s, players);
						});
					});
				});
			}								
		}		
	}	
}, 60000);	

setInterval(function() {
	var i = 0,
	s = {};
	if (players.length > 0) {
		for (i; i < players.length; i += 1) {
			s = io.sockets.socket(players[i].sid);
			
			if (players[i].position != 'fighting') {			
				Character.save(s);			
			}							
		}
	}
}, 600000);

io.on('connection', function (s) {
	s.on('login', function (r) {	
		var parseCmd = function(r, s, players) {
			if (/[`~!@#$%^&*()-+={}[]|]/g.test(r.msg) === false) {			
				r.cmd = r.msg.replace(/_.*/, '').toLowerCase();
				r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');				
				
				if (r.cmd != '') {
					if (r.cmd in Cmds) {
						return Cmds[r.cmd](r, s, io, players);
					} else if(r.cmd in Skills) {
						return Skills[r.cmd](r, s, players);
					} else {
						s.emit('msg', {msg: 'Not a valid command.', styleClass: 'error'});
						return Character.prompt(s);
					}
				} else {
					return Character.prompt(s);
				}
			} else {
				s.emit('msg', {msg: 'Invalid characters in command.'});
			}
		};

		if (r.msg != '') { // not checking slashes
			return Character.login(r, s, function (name, s, fnd) {
				if (fnd) {
					s.join('mud'); // mud is one of two rooms, 'creation' the other (socket.io)	
					
					Character.load(name, s, function (s) {
						Character.getPassword(s, players, function(s) {								
							s.on('cmd', function (r) { 
								parseCmd(r, s, players);
							});
						});
					});
				} else {
					s.join('creation'); // Character creation is its own room, 'mud' the other (socket.io)
					s.player = {name:name};					
					
					Character.newCharacter(s, players, function(s) {			
						s.on('cmd', function (r) { 
							parseCmd(r, s, players);
						});
					});
				}
			});
		} else {
			return s.emit('msg', {msg : 'Enter your name:', res: 'login', styleClass: 'enter-name'});
		}
    });

	// Quitting
	s.on('quit', function () {
		Character.save(s, function() {		
			s.emit('msg', {
				msg: 'Add a little to a little and there will be a big pile.',
				emit: 'disconnect',
				styleClass: 'logout-msg'
			}); 	

			s.leave('mud');	
			s.disconnect();		
		});

	});

	// DC
    s.on('disconnect', function () {
		var i = 0;
		if (s.player != undefined) {
			for (i; i < players.length; i += 1) {
				if (players[i].name === s.player.name) {
					players.splice(i, 1);	
				}
			}
		}
	});  

	s.emit('msg', {msg : 'Enter your name:', res: 'login', styleClass: 'enter-name'});
});

console.log(cfg.name + ' is ready to rock and roll on port ' + cfg.port);