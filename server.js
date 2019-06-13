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
	} else if (req.url === '/bg.jpg') {
		fs.readFile('./public/images/terminal_bg.jpg', function (err, data) {
			if (err) {
				throw err;
			}

			res.writeHead(200, {
				'Cache-Control': 'public, max-age=85400',
				'Expires': new Date(Date.now() + 2592000000).toUTCString(),
				'Content-Type': 'image/jpeg'
			});

			res.write(data);
			res.end();
		});
	} else if (req.url === '/favicon.ico') {
		res.writeHead(200);
		res.write('');
		res.end();
	}
}),
World = require('./src/world'),
WebSocket = require('ws'),
io = new WebSocket.Server({ server });

World.setup(io, cfg, function() {
	server.listen(process.env.PORT || cfg.port);

	io.on('connection', function connection (s) {
		var parseCmd = function(r, s) {
			var skillObj,
			cmdObj,
			battle,
			valid = false;

			if (r.msg) {
				cmdObj = World.commands.createCommandObject(r);

				if (!s.player.creationStep) {
					valid = World.isSafeCommand(cmdObj);

					if (valid) {
						if (cmdObj.cmd) {
							cmdObj.roomObj = World.getRoomObject(s.player.area, s.player.roomid);

							if (cmdObj.cmd in World.commands) {
								World.addCommand(cmdObj, s.player);
							} else if (cmdObj.cmd in World.skills) {
								skillObj = World.character.getSkill(s.player, cmdObj.cmd);

								if (skillObj && s.player.wait === 0) {
									cmdObj.skill = skillObj;

									World.addCommand(cmdObj, s.player);
								} else {
									if (!skillObj) {
										World.msgPlayer(s, {
											msg: 'You do not know how to ' + cmdObj.cmd + '.',
											styleClass: 'error'
										});
									} else {
										World.msgPlayer(s, {
											msg: '<strong>You can\'t do that yet!.</strong>',
											styleClass: 'warning'
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
						return World.msgPlayer(s, {
							onlyPrompt: true
						});
					}
				} else {
					World.character.newCharacter(s, cmdObj);
				}
			} else {
				return World.msgPlayer(s, {
					onlyPrompt: true
				});
			}
		},
		charNameStr = 'Character Name: ';

		World.msgPlayer(s, {
			msg : charNameStr,
			evt: 'reqInitialLogin',
			styleClass: 'enter-name',
			noPrompt: true
		});

		s.on('pong', function() {
			s.player.connected = true;
		});

		s.on('message', function (r) {
			r = JSON.parse(r);

			if (r.msg !== '' && !s.player || s.player && !s.player.logged) {
				if (!s.player || !s.player.verifiedName) {
					World.character.login(r, s, function (s) {
						if (s.player) {
							s.player.verifiedName = true;
							World.msgPlayer(s, {
								msg: 'Password for ' + s.player.displayName  + ': ',
								evt: 'reqPassword',
								noPrompt: true
							});
						} else {
							s.player = JSON.parse(JSON.stringify(World.entityTemplate));
							s.player.name = r.msg;
							s.player.displayName = s.player.name[0].toUpperCase() + s.player.name.slice(1);
							s.player.connected = true;
							s.player.socket = s;
							s.player.creationStep = 1;
							s.player.isPlayer = true;
							s.player.logged = true;

							parseCmd(r, s);
						}
					})
				} else if (r.msg && s.player && !s.player.verifiedPassword) {
					World.character.getPassword(s, World.commands.createCommandObject(r), function(s) {
						s.player.verifiedPassword = true;
						s.player.logged = true;

						World.commands.look(s.player); // we auto fire the look command on login
					});
				} else {
					World.msgPlayer(s, {
						msg : charNameStr,
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

		s.on('close', function () {
			var i = 0,
			j = 0,
			roomObj;

			if (s.player !== undefined) {
				s.player.connected = false;

				World.character.removePlayer(s.player);
			}
		});
	});
});

module.exports = World;