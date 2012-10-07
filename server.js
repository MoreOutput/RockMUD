/*
 * RockMUD, NodeJS HTTP Mud Engine
 * Rocky Bevins, 2012 (rockybevins@gmail.com)
 *
 * We want to be able to build Diku style MUDs with only JS (areas will be JSON). 
 *
*/
var sys = require('util'), 
http = require('http'),
fs = require('fs'),
Character = require('./src/character').character, // Player cannot ever call
Cmds = require('./src/commands').cmd, // Player can call based on role
Skills = require('./src/skills').skill, // Player can call based on role, class, etc
cfg = require('./config').server,
players = [], // currently holds all players, will hold some basic info and socket id
areas = [], // currently cached areas
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

io.on('connection', function (s) {
	// Preparing ticks that affect players by socket
	var charTick = function(s) { // Adding something to the player after a set time, regen
		setInterval(function() {
			if (s.player != undefined) {
				if (s.player.chp <= s.player.hp) {			
					Character.hpRegen(s);
				}
				
				Character.hunger(s);
				Character.thirst(s);
				
			}
		}, 60000);	
		
		// Save each character every 10 minutes
		setInterval(function() {
			if (s.player != undefined) {	
				if (s.player.position != 'fighting') {			
					Character.save(s);			
				}
			}
		}, 600000);	
	};	
	
	s.on('login', function (r) {	
		var parseCmd = function(r, s, players) {
			if (/[`~!@#$%^&*()-+={}[]|]/g.test(r.msg) === false) {			
				r.cmd = r.msg.replace(/_.*/, '').toLowerCase();
				r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');
				r.emit = 'msg';

				if (r.cmd != '') {
					if (r.cmd in Cmds) {
						return Cmds[r.cmd](r, s, players);
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
					Character.load({name: name}, s, function (s) {
						Character.getPassword(s, players, function(s) {				
							charTick(s);
				
							s.on('cmd', function (r) { 
								parseCmd(r, s, players);
							});
						});
					});
				} else {
					s.join('creation'); // Character creation is its own room, 'mud' the other (socket.io)
					s.player = {name:name};					
					
					Character.newCharacter(s, players, function(s) {
						charTick(s);

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
					delete s.player;
				}
			}
		}
	});    		

	s.emit('msg', {msg : 'Enter your name:', res: 'login', styleClass: 'enter-name'});
});

console.log(cfg.name + ' is ready to rock and roll on port ' + cfg.port);