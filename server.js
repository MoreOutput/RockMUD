/*
 * RockMUD, NodeJS HTTP Mud Engine
 * Rocky Bevins, 2012 (rockybevins@gmail.com)
 *
 * We want to be able to build Diku style MUDs with only JS (areas will be JSON). 
 *
*/
var sys = require('util'), 
http = require('http'),
io = require('socket.io'),
fs = require('fs'),
cfg = require('./src/config').server,
Character = require('./src/character').character,
Cmds = require('./src/commands').cmds,
players = {},
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
ws = io.listen(server);

server.listen(cfg.port);

ws.on('connection', function (s) {
	// Starting message, move to browser
	var startMUD = function() {
		return '<h1>Welcome to RockMUD v0.1 </h1><div class="subtext">RockMUD created by ' +
			'<a href="http://www.lexingtondesigner.com" target="_blank">Rocky Bevins 2012</a>.</p>' +
			'<p>You Can find out more about RockMUD on the <a href="https://github.com/MoreOutput/RockMUD" target="_blank">GitHub</a>.</p></div>' + 
            '<div class="enter-name order msg">Enter your name:</div>';
	};      
	  
	// Playing
	s.on('login', function (r) {
		if (r.msg != '') {
			return Character.login(r, s, function (name, s, fnd) {
				if (fnd) {
					s.join('mud'); // mud is one of two rooms, character creation the other (socket.io)					
					Character.load({name: name}, s, function (s, player) {
						Character.getPassword(s);	
						
						players[s.id] = player;
						
						s.on('cmd', function (r) { 
							Cmds.parse(r, s, player, players);
						});
					});
				} else {
					s.join('creation'); // Character creation is its own room (socket.io) 
					Character['newCharacter'](r, s, {name:name});
					s.on('cmd', function (r) { 
						Cmds.parse(r, s, {name:name});
					});
				}
			});
		} else {
			return s.emit('msg', {msg: 'Enter something.'});	
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
		
		return delete players[s.id];
	});
	
	// DC
    s.on('disconnect', function () {
		s.leave('mud');
		//emitResponse({msg: 'You have disconnected from adventure mud.', emit: 'msg'}); 
	});    		
	
	s.emit('msg', {msg : startMUD()});
});

console.log(cfg.name + ' is ready to rock and roll on port ' + cfg.port);