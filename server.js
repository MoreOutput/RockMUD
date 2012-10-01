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
cfg = require('./src/config').server,
Character = require('./src/character').character,
Cmds = require('./src/commands').cmds,
players = [],
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

io.set("heartbeat interval", 59); // MUD-wide ticks


io.on('connection', function (s) {
	// Starting message, could move to browser
	var startMUD = '<h1>Welcome to RockMUD v0.1 </h1><div class="subtext">RockMUD created by ' +
	'<a href="http://www.lexingtondesigner.com" target="_blank">Rocky Bevins 2012</a>.</p>' +
	'<p>You can find out more about RockMUD on <a href="https://github.com/MoreOutput/RockMUD" target="_blank">GitHub</a>.</p></div>' + 
    '<div class="enter-name order msg">Enter your name:</div>';   
	
	// Logging in and parsing commands
	s.on('login', function (r) {
		var parseCmd = function(r, s, players) {
			if (/[`~!@#$%^&*()-+={}[]|]/g.test(r.msg) === false) {			
				r.cmd = r.msg.replace(/_.*/, '').toLowerCase();
				r.msg = r.msg.replace(/^.*?_/, '').replace(/_/g, ' ');
				r.emit = 'msg';
	
				if (r.res in Character) {
					return Character[r.res](r, s, players);
				} else if (r.cmd in Cmds) {
					return Cmds[r.cmd](r, s, players);
				} else {
					return Character.prompt(s);
				}
			} else {
				s.emit('msg', {msg: 'Invalid characters in command.'});
			}
		};
		
		if (r.msg != '' && /[`~!@#$%^&*()-+={}[]|]|[0-9]/g.test(r.msg) === false) { // not checking slashes
			return Character.login(r, s, function (name, s, fnd) {
				if (fnd) {
					s.join('mud'); // mud is one of two rooms, 'creation' the other (socket.io)	
					
					Character.load({name: name}, s, function (s, player) {
						Character.getPassword(s);	
	
						s.player = player;
						players.push(s.player);

						s.on('cmd', function (r) { 
							parseCmd(r, s, players);
						});
					});
				} else {
					s.join('creation'); // Character creation is its own room, 'mud' the other (socket.io)
					s.player = {name:name, sid: s.id};					
					players.push(s.player);

					Character.newCharacter(r, s, players);		
					
					s.on('cmd', function (r) { 
						parseCmd(r, s, players);
					});
				}
			});
		} else {
			return s.emit('msg', {msg: 'Enter a valid response.'});	
		}
    });

	// Quitting
	s.on('quit', function () {
		s.emit('msg', {
			msg: 'Add a little to a little and there will be a big pile.',
			emit: 'disconnect',
			styleClass: 'logout-msg'
		}); 
			
		s.leave('mud');
		s.disconnect();
	});
	
	// DC
    s.on('disconnect', function () {
		var i = 0;
		for (i; i < players.length; i += 1) {
			if (players[i].name === s.player.name) {
				players.splice(i, 1);
				
				Character.save(r, s);				
			}
		}
	});    		
	
	s.emit('msg', {msg : startMUD, res: 'login'});
});

console.log(cfg.name + ' is ready to rock and roll on port ' + cfg.port);