 'use strict';
var http = require('http'),
fs = require('fs'),
cfg = require('./config').server.game,
server = http.createServer(function (req, res) {
	if (req.url === '/' || req.url === '/index.html' || req.url === '/design.html') {
		if (req.url === '/') {
			req.url = '/index.html';
		}

		fs.readFile('./public' + req.url, function (err, data) {
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
	} else if (req.url === '/rockmud-client.js') {
		fs.readFile('./public/js/rockmud-client.js', function (err, data) {
			if (err) {
				throw err;
			}

			res.writeHead(200, {'Content-Type': 'text/javascript'});
			res.write(data);
			res.end();
		});
	}
}),
World = require('./src/world').world,
io = require('socket.io')(server, {
	log: false,
	transports: ['websocket']
});

World.setup(io, cfg, function(Character, Cmds, Skills) {
	server.listen(process.env.PORT || cfg.port);

	io.on('connection', function (s) {
		s.emit('msg', {msg : 'Enter your name:', res: 'login', styleClass: 'enter-name'});

		s.on('login', function (r) {
			var parseCmd = function(r, s) {
				var cmdArr = r.msg.split(' '),
				cmdObj = {};

				if (cmdArr.length === 1) {
					cmdArr[1] = '';
				}

				if (/[`~@#$%^&*()-+={}[]|<>]+$/g.test(r.msg) === false) {
					cmdObj = {
						cmd: cmdArr[0].toLowerCase(), // {cast} spark boar
						msg: cmdArr.slice(1).join(' '), // cast {spark boar}
						arg: cmdArr[1].toLowerCase(), // cast {spark} boar
						input: cmdArr.slice(2).join(' '), // cast spark {boar ...}
						number: 1 // argument target -- cast spark 2.boar
					};

					if (cmdObj.input && !isNaN(parseInt(cmdObj.input[0]))
						|| (!cmdObj.input && !isNaN(parseInt(cmdObj.msg[0]))) ) {

						if (!cmdObj.input) {
							cmdObj.number = parseInt(cmdObj.msg[0]);
							cmdObj.msg = cmdObj.msg.replace(/^[0-9][.]/, '');
						} else {
							cmdObj.number = parseInt(cmdObj.input[0]);
							cmdObj.input = cmdObj.input.replace(/^[0-9][.]/, '');
						}
					}

					if (cmdObj.msg === '' || cmdObj.msg.length >= 2 && s.player.wait === 0) {
						if (cmdObj.cmd) {
							if (cmdObj.cmd in Cmds) {
								return Cmds[cmdObj.cmd](s.player, cmdObj);
							} else if (cmdObj.cmd in Skills) {
								return Skills[r.cmd](s.player, cmdObj);
							} else {
								World.msgPlayer(s, {msg: cmdObj.cmd + ' is not a valid command.', styleClass: 'error'});
							}
						} else {
							return World.prompt(s);
						}
					} else {
						if (s.player.wait > 0) {
							World.msgPlayer(s, {msg: 'You cant do that just yet!', styleClass: 'error'});
						} else {
							World.msgPlayer(s, {msg: 'You have to be more specific with your command.', styleClass: 'error'});
						}
					}
				} else {
					World.msgPlayer(s, {msg: 'Invalid characters in command!', styleClass: 'error'});
				}
			};

			if (r.msg !== '') {
				return Character.login(r, s, function (name, s, fnd) {
					if (fnd) {
						s.join('mud'); // mud is one of two rooms, 'creation' being the other
						
						Character.load(name, s, function (s) {
							Character.getPassword(s, function(s) {
								Cmds.look(s.player); // we auto fire the look command on login
								
								s.on('cmd', function (r) {
									parseCmd(r, s);
								});
							});
						});
					} else {
						s.join('creation'); // creation is one of two rooms, 'mud' being the other
						
						s.player = World.mobTemplate;
						s.player.name = name;
						s.player.sid = s.id;
						s.player.socket = s;

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

		s.on('quit', function () {
			if (s.player.position !== 'fighting') {
				Character.save(s.player, function() {
					World.msgPlayer(s, {
						msg: 'Add a little to a little and there will be a big pile.',
						emit: 'disconnect',
						styleClass: 'logout-msg',
						noPrompt: true
					});

					s.leave('mud');
					s.disconnect();
				});
			} else {
				World.msgPlayer(s, {
					msg: 'You are fighting! Finish up before quitting',
					emit: 'disconnect',
					styleClass: 'logout-msg'
				});
			}
		});

		s.on('disconnect', function () {
			var i = 0,
			j = 0,
			roomObj;

			if (s.player !== undefined) {
				for (i; i < World.players.length; i += 1) {	
					if (World.players[i].name === s.player.name) {
						World.players.splice(i, 1);
					}
				}

				roomObj = World.getRoomObject(s.player.area, s.player.roomid);

				for (j; j < roomObj.playersInRoom.length; j += 1) {
					if (roomObj.playersInRoom[j].name === s.player.name) {
						roomObj.playersInRoom.splice(j, 1);
					}
				}
			}
		});
	});
});

