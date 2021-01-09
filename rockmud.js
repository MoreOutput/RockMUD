'use strict';
var http = require('http'),
fs = require('fs'),
World = require('./src/world'),
WebSocket = require('ws'),
RockMUD = function(port, cfg, callback) {
	this.port = port;
	this.server = null;
	this.running = false;
	this.setup(cfg, callback);
};

RockMUD.prototype.setup = function(cfg, callback) {
	var mud = this;

	mud.server = http.createServer(function (req, res) {
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
		} else if (req.url === '/bootstrap.css') {
			fs.readFile('./public/css/bootstrap.min.css', function (err, data) {
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
	});

	var nextWorld = new World(new WebSocket.Server({ server: mud.server }), cfg, function(newWorld) {
	
		mud.world = newWorld;

		//	newWorld.setup(newWorld, new WebSocket.Server({ server: mud.server }), cfg, function(updatedWorld) {
	
			if (!callback) {
				mud.server.listen(process.env.PORT || mud.port);
			}
	
			mud.running = true;
	
			mud.world.io.on('connection', function connection (s) {
				var parseCmd = function(r, s) {
					var skillObj,
					cmdObj,
					valid = false;
		
					if (r.msg) {
						var roomObj = mud.world.getRoomObject(s.player.area, s.player.roomid);

						cmdObj = mud.world.commands.createCommandObject(r, s.player, roomObj, true);
		
						if (!s.player.creationStep) {
							valid = mud.world.isSafeCommand(cmdObj);
		
							if (valid) {
								if (cmdObj.cmd) {
		
									if (cmdObj.cmd in mud.world.commands) {
										mud.world.addCommand(cmdObj, s.player);
									} else if (cmdObj.cmd in mud.world.skills) {
										skillObj = mud.world.character.getSkill(s.player, cmdObj.cmd);
		
										if (skillObj && s.player.wait === 0) {
											cmdObj.skill = skillObj;
		
											mud.world.addCommand(cmdObj, s.player);
										} else {
											if (!skillObj) {
												mud.world.msgPlayer(s, {
													msg: 'You do not know how to ' + cmdObj.cmd + '.',
													styleClass: 'error'
												});
											} else {
												mud.world.msgPlayer(s, {
													msg: '<strong>You can\'t do that yet!</strong>',
													styleClass: 'warning'
												});
											}
										}
									} else {
										mud.world.msgPlayer(s, {
											msg: cmdObj.cmd + ' is not a valid command.',
											styleClass: 'error'
										});
									}
								} else {
									return mud.world.msgPlayer(s, {
										onlyPrompt: true
									});
								}
							} else {
								return mud.world.msgPlayer(s, {
									onlyPrompt: true
								});
							}
						} else {
							mud.world.character.newCharacter(s, cmdObj);
						}
					} else if (!s.player.creationStep) {
						return mud.world.msgPlayer(s, {
							onlyPrompt: true
						});
					}
				},
				charNameStr = 'Character Name: ';
		
				mud.world.msgPlayer(s, {
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
							mud.world.character.login(r, s, function (s) {
								if (s.player) {
									s.player.verifiedName = true;
									mud.world.msgPlayer(s, {
										msg: 'Password for ' + s.player.displayName  + ': ',
										evt: 'reqPassword',
										noPrompt: true
									});
								} else {
									s.player = JSON.parse(JSON.stringify(mud.world.entityTemplate));
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
							mud.world.character.getPassword(s, mud.world.commands.createCommandObject(r), function(s) {
								s.player.verifiedPassword = true;
								s.player.logged = true;
		
								mud.world.commands.look(s.player); // we auto fire the look command on login
							});
						} else {
							mud.world.msgPlayer(s, {
								msg : charNameStr,
								noPrompt: true,
								styleClass: 'enter-name'
							});
						}
					} else if (s.player && s.player.logged === true) {
						parseCmd(r, s);
					} else {
						mud.world.msgPlayer(s, {
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
		
						mud.world.character.removePlayer(s.player);
					}
				});
			});
	
			if (callback && typeof callback === 'function') {
				callback();
			}
	//	});
	});
}

module.exports = RockMUD;
