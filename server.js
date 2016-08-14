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
		var parseCmd = function(r, s) {
			var skillObj,
			cmdObj = Cmds.createCommandObject(r);
	
			if (!s.player.creationStep) {
				if (cmdObj) {
					if (cmdObj.cmd) {
						cmdObj.roomObj = World.getRoomObject(s.player.area, s.player.roomid);
						
						if (cmdObj.cmd in Cmds) {
							Cmds[cmdObj.cmd](s.player, cmdObj);
							
							World.processEvents('onCommand', s.player, cmdObj.roomObj, cmdObj);
							World.processEvents('onCommand', s.player.items, cmdObj.roomObj, cmdObj);
						} else if (cmdObj.cmd in Skills) {
							skillObj = Character.getSkill(s.player, cmdObj.cmd);

							if (skillObj && s.player.wait === 0) {
								return Skills[cmdObj.cmd](
									skillObj,
									s.player,
									cmdObj.roomObj,
									cmdObj
								);
							
								World.processEvents('onSkill', s.player, cmdObj.roomObj, skillObj);
								World.processEvents('onSkill', s.player.items, cmdObj.roomObj, skillObj);
								World.processEvents('onSkill', cmdObj.roomObj, s.player, skillObj);
							} else {
								if (!skillObj) {
									World.msgPlayer(s, {
										msg: 'You do not know how to ' + cmdObj.cmd + '.',
										styleClass: 'error'
									});
								} else {
									World.msgPlayer(s, {
										msg: '<strong>You can\'t do that yet!.</strong>',
										styleClass: 'error'
									});
								}
							}
						} else {
							World.msgPlayer(s, {
								msg: cmdObj.cmd + ' is not a valid command.',
								styleClass: 'error'
							});
						}
					} else {
						return World.msgPlayer(s, {
							onlyPrompt: true
						});
					}
				} else {
					World.msgPlayer(s, {
						msg: 'You have to be more specific with your command.',
						styleClass: 'error'
					});
				}
			} else {
				Character.newCharacter(s, cmdObj);
			}
		};
		
		World.msgPlayer(s, {
			msg : 'Enter your name:', 
			evt: 'reqInitialLogin', 
			styleClass: 'enter-name',
			noPrompt: true
		});

		s.on('cmd', function (r) {
			if (r.msg !== '' && !s.player || s.player && !s.player.logged) {
				if (!s.player || !s.player.verifiedName) {
					Character.login(r, s, function (s) {
						if (s.player) {
							s.player.verifiedName = true;
							s.join('mud'); // mud is one of two rooms, 'creation' being the other		

							World.msgPlayer(s, {
								msg: 'Password for ' + s.player.displayName  + ': ',
								evt: 'reqPassword',
								noPrompt: true
							});
						} else {
							s.join('creation'); // creation is one of two rooms, 'mud' being the other
						
							s.player = World.mobTemplate;
							s.player.name = r.msg;
							s.player.displayName = s.player.name[0].toUpperCase() + s.player.name.slice(1);
							s.player.sid = s.id;
							s.player.socket = s;
							s.player.creationStep = 1;
							s.player.isPlayer = true;
							s.player.logged = true;
						
							parseCmd(r, s);
						}
					})			
				} else if (r.msg && s.player && !s.player.verifiedPassword) {
					Character.getPassword(s, Cmds.createCommandObject(r), function(s) {
						s.player.verifiedPassword = true;
						s.player.logged = true;

						Cmds.look(s.player); // we auto fire the look command on login
					});
				} else {
					World.msgPlayer(s, {
						msg : 'Enter your name:',
						noPrompt: true,
						styleClass: 'enter-name'
					});
				}
			} else if (s.player && s.player.logged === true) {				
				parseCmd(r, s);
			} else {
				World.msgPlayer(s, {
					msg : 'Please enter a character name:',
					noPrompt: true,
					styleClass: 'enter-name'
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

			s.leave('mud');
			s.disconnect();
		});
	});
});

