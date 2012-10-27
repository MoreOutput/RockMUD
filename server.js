/*
 * RockMUD, NodeJS HTTP/WS Mud Engine
 * Rocky Bevins, 2012 (rockybevins@gmail.com)
 * We want to be able to build Diku style MUDs with only JS (areas will be JSON). 
*/

// Our 'globals'
module.exports.io = require('socket.io');
module.exports.players = [];
module.exports.areas = [];

var http = require('http'),
fs = require('fs'),
Character = require('./src/character').character,
Cmds = require('./src/commands').cmd, 
Skills = require('./src/skills').skill,
cfg = require('./config').server,
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
io = module.exports.io.listen(server);

server.listen(cfg.port);

module.exports.io = io; // io global

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
							Character.updatePlayer(s, io, players);
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
		var parseCmd = function(r, s) {
			if (/[`~!@#$%^&*()-+={}[]|]/g.test(r.msg) === false) {			
				r.cmd = r.msg.replace(/_.*/, '').toLowerCase();
				r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');				
				// Commands and Skills are passed socket.io to grab other players via socket id
				if (r.cmd != '') {
					if (r.cmd in Cmds) {
						return Cmds[r.cmd](r, s);
					} else if (r.cmd in Skills) {
						return Skills[r.cmd](r, s);
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
						Character.getPassword(s, function(s) {	
							s.on('cmd', function (r) { 
								parseCmd(r, s);
							});
						});
					});
				} else {
					s.join('creation'); // Character creation is its own room, 'mud' the other (socket.io)
					s.player = {name:name};					
					
					Character.newCharacter(s, function(s) {			
						s.on('cmd', function (r) { 
							parseCmd(r, s);
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