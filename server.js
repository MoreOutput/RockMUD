/*
 * RockMUD, NodeJS HTTP/WS Mud Engine
 * Rocky Bevins, 2012 (moreoutput@gmail.com)
 * We want to be able to build Diku style MUDs with only JS (areas will be JSON). 
*/
var http = require('http'),
fs = require('fs'),
cfg = require('./config').server,
server = http.createServer(function (req, res) {
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
    } else if (req.url === '/client.js') {
		fs.readFile('./public/js/client.js', function (err, data) {
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

// considering referencing these within their respective modules, ex: Character.players rather than players[]
module.exports.io = io; 
module.exports.players = [];
module.exports.areas = [];

var Character = require('./src/character').character,
Cmds = require('./src/commands').cmd,
Skills = require('./src/skills').skill;

io.set('log level', 1);

server.listen(cfg.port);

// Healing, Hunger and Thirst Tick
setInterval(function() { 
	var i = 0,
	s = {};

	if (module.exports.players.length > 0) {	
		for (i; i < module.exports.players.length; i += 1) {
			s = io.sockets.socket(module.exports.players[i].sid);
			if (s.player.chp <= s.player.hp) {			
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
	}	
}, 6000 * 10);	

// Saving characters Tick
setInterval(function() {
	var i = 0,
	s = {};
	
	if (module.exports.players.length > 0) {
		for (i; i < module.exports.players.length; i += 1) {
			s = io.sockets.socket(module.exports.players[i].sid);
			
			if (s.position != 'fighting') {			
				Character.save(s);			
			}							
		}
	}
}, 60000 * 12);

io.on('connection', function (s) {
	s.on('login', function (r) {	
		var parseCmd = function(r, s) {
			if (/[`~!@#$%^&*()-+={}[]|]/g.test(r.msg) === false) {			
				r.cmd = r.msg.replace(/_.*/, '').toLowerCase();
				r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');				

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
				return Character.prompt(s);
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
			for (i; i < module.exports.players.length; i += 1) {
				if (module.exports.players[i].name === s.player.name) {
					module.exports.players.splice(i, 1);	
				}
			}
		}
	});

	s.emit('msg', {msg : 'Enter your name:', res: 'login', styleClass: 'enter-name'});
});

console.log(cfg.name + ' is ready to rock and roll on port ' + cfg.port);