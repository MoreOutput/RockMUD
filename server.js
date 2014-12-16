/*
 * Rocky Bevins (moreoutput@gmail.com)
*/
'use strict';

var http = require('http'),
fs = require('fs'),
cfg = require('./config').server.game,
server = http.createServer(function (req, res) {
	if (req.url === '/' || req.url === '/index.html') {
		fs.readFile('./public/index.html', function (err, data) {
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
io = require('socket.io')(server);

// considering referencing these within their respective modules, ex: Character.players rather than players[]
module.exports.io = io; 
module.exports.players = [];
module.exports.areas = [];
module.exports.time = fs.readFile('./data/time.json');

var Character = require('./src/character').character,
Cmds = require('./src/commands').cmd,
Skills = require('./src/skills').skill,
Ticks = require('./src/ticks');

server.listen(cfg.port);

io.on('connection', function (s) {
	s.on('login', function (r) {	
		var parseCmd = function(r, s) {
			var cmdArr = r.msg.split(' ');	
			r.cmd = cmdArr[0].toLowerCase();
			r.msg = cmdArr.slice(1).join(' ');
		
			if (/[`~@#$%^&*()-+={}[]|]+$/g.test(r.msg) === false) {
				if (r.cmd !== '') {
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

		if (r.msg !== '') { // not checking slashes
			return Character.login(r, s, function (name, s, fnd) {
				if (fnd) {
					s.join('mud'); // mud is one of two socket.io rooms, 'creation' the other				
					Character.load(name, s, function (s) {						
						Character.getPassword(s, function(s) {	
							s.on('cmd', function (r) { 
								parseCmd(r, s);
							});
						});
					});
				} else {
					s.join('creation'); // Character creation is its own socket.io room, 'mud' the other
					s.player = {name:name};					
					
					Character.newCharacter(r, s, function(s) {			
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
		if (s.player !== undefined) {
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