/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
*/
'use strict';
var fs = require('fs'),
util = require('util'),
World = require('./world').world,
Character = require('./character').character,
Room = require('./rooms').room,
Combat = require('./combat').combat,
Dice = require('./dice').roller,
players = World.players,
time = World.time,
areas = World.areas,

Cmd = function () {};

Cmd.prototype.fire = function(commandName, target, command, fn) {
	return this[commandName](target, command, fn);
}

// Puts any target object into a defined room after verifying criteria
Cmd.prototype.move = function(target, command, fn) {
	var world = this,
	direction = command.msg,
	s;

	if (target.player) {
		s = target;
		target = target.player;
	}

	if (target.position !== 'fighting' && target.position 
		!== 'resting' && target.position !== 'sleeping' 
		&& target.cmv > 5 && target.wait === 0) {

		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			Room.checkExit(roomObj, direction, function(isValidExit, exitObj) {
				if (exitObj) {
					if (!exitObj.area) {
						exitObj.area = roomObj.area;
					}

					Room.getDisplay(exitObj.area, exitObj.id, function(displayHTML, targetRoom) {
						Room.checkExitCriteria(target, targetRoom, function(clearToMove) {
							Room.checkEntranceCriteria(target, targetRoom, function(clearToMove) {
								if (clearToMove) {
									Dice.movementCheck(target, targetRoom, function(moveMod) {
										target.cmv = Math.round((target.cmv - ( (12) - target.dex/4)));

										target.roomid = targetRoom.id;

										if (targetRoom.terrianMod) {
											target.wait += targetRoom.terrianMod;
										}

										if (target.isPlayer) {
											Character.updatePlayer(target);

											World.msgPlayer(target, {
												msg: displayHTML,
												styleClass: 'room'
											});

											Room.remove('playersInRoom', target, roomObj, function() {
												targetRoom.playersInRoom.push(target);
											});
										} else {
											Room.remove('monsters', target, roomObj, function() {
												targetRoom.monsters.push(target);
											});
										}

										World.msgRoom(targetRoom, {
											msg:'<strong>' + target.name + '</strong> a ' + target.race + ' enters the room.',
											playerName: target.name
										});

										World.msgRoom(roomObj, {
											msg: '<span class="yellow"><strong>' + target.name + '</strong> leaves the room <strong>heading ' + direction + '</strong></div>'
										});

										if (typeof fn === 'function') {
											return fn(true, roomObj, targetRoom);
										}
									});
								} else {
									target.cmv = Math.round((target.cmv - (7 - target.dex/4)));

									if (typeof fn === 'function') {
										return fn(true, roomObj, targetRoom);
									}
								}
							});
						});
					});
				} else {
					target.cmv = Math.round((target.cmv - (7 - target.dex/4)));

					World.msgPlayer(target, {
						msg: 'There is no exit in that direction.', 
						styleClass: 'error'
					});

					if (typeof fn === 'function') {
						return fn(false);
					}
				}
			});
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You cannot do that now.', 
			styleClass: 'error'
		});

		if (typeof fn === 'function') {
			return fn(false);
		}
	}
};

Cmd.prototype.who = function(target, command) {
	var str = '', 
	player,
	displayName = '',
	i = 0;
	
	if (World.players.length > 0) {
		for (i; i < World.players.length; i += 1) {
			player = World.io.sockets.connected[World.players[i].sid].player; // A visible player in players[]

			displayName = player.displayName;

			if (player.title === '') {
				displayName += ' a level ' + player.level + ' ' + player.race + ' ' + player.charClass;
			} else {
				displayName += ' ' + player.title;
			}

			str += '<tr>' +
				'<td class="who-lvl yellow">' + player.level + '</td>' +
				'<td class="who-race green">' + player.race + '</td>' +
				'<td class="who-class red">' + player.charClass + '</td>' +
				'<td class="who-player">' + displayName + '</td>' +
			'</tr>';
		}

		str = '<div class="cmd-who"><h2>Visible Players</h2><table class="table table-condensed table-no-border who-list">' +
			'<thead>' +
				'<tr>' +
					'<td width="5%">Level</td>' +
					'<td width="5%">Race</td>' +
					'<td width="5%">Class</td>' +
					'<td width="85%">Player</td>' +
				'</tr>' +
			'</thead><tbody>' + str + '</tbody>' +
		'</table></div>'
		
		World.msgPlayer(target, {
			msg: str, 
			styleClass: 'who-cmd'
		});
	} else {
		World.msgPlayer(target, {
			msg: '<div class="cmd-who"><h2>No Visible Players</h2></div>', 
			styleClass: 'who-cmd'
		});
	}
};

Cmd.prototype.get = function(target, command, fn) {
	if (command.msg !== '') {
		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			World.search(roomObj.items, command, function(item) {
				if (item) {
					Room.remove('items', item, roomObj, function(removed, roomObj) {
						Character.addToInventory(item, target, function(canAdd) {
							World.msgRoom(roomObj, {
								msg: target.name + ' picks up ' + item.short,
								playerName: target.name,
								styleClass: 'cmd-get'
							});

							World.msgPlayer(target, {
								msg: 'You pick up ' + item.short,
								styleClass: 'cmd-get'
							});

							if (typeof fn === 'function') {
								return fn(target, roomObj, item);
							}
						});
					});
				} else {
					World.msgPlayer(target, {msg: 'That item is not here.', styleClass: 'error'});

					if (typeof fn === 'function') {
						return fn(target, roomObj, false);
					}
				}
			});
		});
	} else {
		World.msgPlayer(target, {msg: 'Get what?', styleClass: 'error'});

		if (typeof fn === 'function') {
			return fn(target, roomObj, item);
		}
	}
};

Cmd.prototype.drop = function(target, command, fn) {
	if (command.msg !== '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.removeFromInventory(target, item, function(removed) {
					if (removed) {
						Room.addItem({area: target.area, id: target.roomid, item: item}, function() {
							World.msgPlayer(target, {
								msg: 'You dropped ' + item.short,
								styleClass: 'get'
							});
							
							
						});
					} else {
						World.msgPlayer(target, {msg: 'Could not drop a ' + item.short, styleClass: 'error'});
						
					}
				});
			} else {
				World.msgPlayer(target, {msg: 'That item is not here.', styleClass: 'error'});
				
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Drop what?', styleClass: 'error'});
		
	}
};


// For attacking in-game monsters
Cmd.prototype.kill = function(target, command) {
	Room.checkMonster(r, s, function(fnd, target) {
		if (fnd) {
			Combat.begin(target, target, function(contFight, target) { // the first round qualifiers
				var combatInterval;

				Character.prompt(s);

				if (contFight) {
					// Combat Loop
					combatInterval = setInterval(function() {
						if (target.position === 'fighting' && target.position === 'fighting') {
							
							Combat.fight(target, target, function(contFight) {
								if (!contFight) {
									target.position = 'dead';

									clearInterval(combatInterval);

									Room.removeMonster({
										area: target.area,
										id: target.roomid
									}, target, function(removed) {
										if (removed) { 
											Room.addCorpse(target, target, function(corpse) {
												Combat.calXP(target, target, function(earnedXP) {
													target.position = 'standing';
													target.wait = 0;

													if (earnedXP > 0) {
														World.msgPlayer(target, {msg: 'You won the fight! You learn some things, resulting in ' + earnedXP + ' experience points.', styleClass: 'victory'});
													} else {
														World.msgPlayer(target, {msg: 'You won but learned nothing.', styleClass: 'victory'});
													}
												});
											});
										}
									});

								} else if (target.chp <= 0) {
									clearInterval(combatInterval);
									World.msgPlayer(target, {msg: 'You died!', styleClass: 'combat-death'});
									//Character.death(s);
								}	

								Character.prompt(s);
							});	
						}	
					}, 1800);
				}
			});
		} else {
			World.msgPlayer(target, {msg: 'There is nothing by that name here.', styleClass: 'error'});
			
		}
	});
};

Cmd.prototype.look = function(target, command) {
	if (command.msg === '') { 
		// if no arguments are given we display the current room
		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			Room.getDisplayHTML(roomObj, {
				hideCallingPlayer: target.name
			},function(displayHTML, roomObj) {
				World.msgPlayer(target, {
					msg: displayHTML,
					styleClass: 'room'
				});
			});
		});
	} else {
		// Gave us a noun, so lets see if something matches it in the room. 
		Room.checkMonster(r, s, function(fnd, monster) {
			Room.checkItem(r, s, function(fnd, item) {
				return World.prompt(target);
			});
		});
	}
};

Cmd.prototype.where = function(target, command) {
	command.msg = '<ul>' + 
	'<li>Your Name: ' + Character[s.id].name + '</li>' +
	'<li>Current Area: ' + Character[s.id].area + '</li>' +
	'<li>Room Number: ' + Character[s.id].id + '</li>' +
	'</ul>';

	r.styleClass = 'playerinfo where';

	World.msgPlayer(target, r);

	
};


/** Communication Channels **/
Cmd.prototype.say = function(target, command) {
	World.msgPlayer(target, {
		msg: '<div class="cmd-say"><span class="msg-name">You say></span> ' + command.msg + '</div>'
	});

	World.getRoomObject(target.area, target.roomid, function(roomObj) {
		World.msgRoom(roomObj, {
			msg: '<div class="cmd-say"><span class="msg-name">' + target.name + ' says></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	});
};

Cmd.prototype.yell = function(target, command) {
	World.msgToPlayer(target, {
		msg: '<div class="cmd-yell"><span class="msg-name">You yell></span> ' + command.msg + '</div>'
	});
	
	World.msgArea(target.area, {
		msg: '<div class="cmd-yell"><span class="msg-name">' + target.name + ' yells></span> ' + command.msg + '</div>',
		playerName: target.name
	});
};


Cmd.prototype.chat = function(target, command) {
	World.msgPlayer(target, {
		msg: '<div class="cmd-chat"><span class="msg-name">You chat></span> ' + command.msg + '</div>'
	});

	World.msgWorld(target, {
		msg: '<div class="cmd-chat"><span class="msg-name">' + target.name + '></span> ' + command.msg + '</div>',
		playerName: target.name
	});
};

/*
Cmd.prototype.tell = function(target, command) {
	var i  = 0;
	
	World.msgPlayer(target, {msg: 'You tell ' + r.playerName + '> ' + command.msg, styleClass: 'cmd-say'});
	
	Charactecommand.msgToPlayer({
		msg: target.name + ' tells you> ' + command.msg, 
		playerName: target.name
	}, true);
};

Cmd.prototype.reply = function(target, command) {
	var i  = 0;
	
	World.msgPlayer(target, {msg: 'You reply to ' + target.reply + '> ' + command.msg, styleClass: 'cmd-say'});
	
	Charactecommand.msgToPlayer({
		msg: target.name + ' tells you> ' + command.msg, 
		playerName: target.name
	}, true);
};
*/

Cmd.prototype.achat = function(target, command) { 
	if (target.role === 'admin') {
		World.msgPlayer(target, {
			msg: '<div class="cmd-chat"><span class="msg-name">You chat></span> ' + command.msg + '</div>'
		});

		World.msgWorld(target, {
			msg: '<div class="cmd-chat"><span class="msg-name">' + target.name + '></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	} else {
		World.msgPlayer(target, {
			msg: '<div class="error">You are not powerful enough to speak directly with gods.</div>'
		});
	}
};

// Viewing the time
Cmd.prototype.time = function(target, command) {

};

/** Related to Saving and character adjustment/interaction **/

Cmd.prototype.save = function(target, command, fn) {
	Character.save(target, function() {
		World.msgPlayer(target, {msg: target.displayName + ' was saved. Whew!', styleClass: 'save'});
		
		if (typeof fn === 'function') {
			return fn();
		}
	});
};

Cmd.prototype.title = function(target, command) {
	if (command.msg.length < 40) {
		if (command.msg != 'title') {
			target.title = command.msg;
		} else {
			target.title = ' a level ' + target.level + ' ' + target.race + ' ' + target.charClass;
		}

		Character.updatePlayer(target, function(updated) {
			World.msgPlayer(target, {msg: 'Your title was changed!', styleClass: 'save'});
		});
	} else {
		World.msgPlayer(target, {msg: 'Title is too long, try another.', styleClass: 'save'});
	}
};

// View equipment
Cmd.prototype.equipment = function(target, command) {
	var eqStr = '',
	i = 0;	
	
	for (i; i < target.eq.length; i += 1) {	
		eqStr += '<li class="eq-slot-' + target.eq[i].slot.replace(/ /g, '') + 
			'"><label>' + target.eq[i].name + '</label>: ';
		
		if (target.eq[i].item === null || target.eq[i].item === '') {
			eqStr += ' Nothing</li>';
		} else {
			eqStr += '<label>'  + target.eq[i].item.short + '</label></li>';
		}
	}
	
	World.msgPlayer(target, {
		msg: '<div class="eq-cmd"><h1>You are wearing:</h1>' +
			'<ul class="list-unstyled equipment-list">' +
		eqStr + '</ul></div>', 
		styleClass: 'cmd-eq' 
	});
};

// Current skills
Cmd.prototype.skills = function(target, command) {
	var skills = '',
	i = 0;
	
	if (target.skills.length > 0) {
		for (i; i < target.skills.length; i += 1) {
			skills += target.skills[i].name;
		}
		
		World.msgPlayer(target, {msg: 'skills', styleClass: 'eq' });
		
	} else {
		World.msgPlayer(target, {msg: 'skills', styleClass: 'eq' });
		
	}
};

Cmd.prototype.wear = function(target, command) {
	if (command.msg !== '') {
		World.search(target.items, command, function(item) {
			if (item) {
				 Character.wear(target, item, function(msg) {
					World.msgPlayer(target, {msg: msg, styleClass: 'cmd-wear'});
				});
			} else {
				World.msgPlayer(target, {msg: 'You do not have that item.', styleClass: 'error'});
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Wear what?', styleClass: 'error'});
		
	}
};

/*
Cmd.prototype.remove = function(target, command) {
	if (command.msg !== '') {
		Character.checkInventory(r, s, function(fnd, item) {
			if (fnd) {
				Character.remove(r, s, item, function(removeSuccess, msg) {
					World.msgPlayer(target, {msg: msg, styleClass: 'cmd-wear'});
					
				});
			} else {
				World.msgPlayer(target, {msg: 'You are not wearing that.', styleClass: 'error'});
				
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Remove what?', styleClass: 'error'});
		
	}
}
*/

Cmd.prototype.inventory = function(target, command) {
	var iStr = '',
	i = 0;
	
	if (target.items.length > 0) {
		for (i; i < target.items.length; i += 1) {
			if (!target.items[i].equipped) {
				iStr += '<li>' + target.items[i].short + ' (<label>type:</label> ' + target.items[i].itemType +
				', <label>weight:</label> ' + target.items[i].weight + ')</li>';
			} else {
				iStr += '<li>' + target.items[i].short + ' (Equipped) '+ ' (<label>type:</label> ' + target.items[i].itemType +
				', <label>weight:</label> ' + target.items[i].weight + ')</li>';
			}
		}
		
		World.msgPlayer(target, {msg: '<div class="cmd-i"><h1>Your Inventory</h1><ul>' + iStr + '</ul></div>', styleClass: 'inventory' });
	} else {
		World.msgPlayer(target, {msg: 'No items in your inventory, can carry ' + target.carry + ' pounds of items and treasure.'});
	}
};

Cmd.prototype.score = function(target, command, fn) {
	var i = 0,
	score = '<section class="row score"><div class="col-md-12"><h1>' + 
		'<span class="score-name">' + target.displayName + '</span>' + 
		'<span class="score-title">' + target.title + '</span> ' + 
		'<span class="score-level"> (' + target.level + ')</span></h1></div>' +
		'<div class="stats">' +
			'<div class="col-md-12">' +
				'<div class="row">' + 
				'<ul class="col-md-12 score-info list-inline">' +
					'<li class="stat-hp first"><label>HP:</label> <strong>' +  target.chp + '</strong>/' + target.hp + ' </li>' +
					'<li class="stat-mana"><label>Mana:</label> <strong>' + target.cmana + '</strong>/' + target.mana + '</li>' +
					'<li class="stat-mv"><label>Moves:</label> <strong>' + target.cmv + '</strong>/' + target.mv + '</li>' +
					'<li class="stat-levl"><label>Level:</label> ' +  target.level + '</li>' +
				'</ul>' +
				'<ul class="col-md-3 score-stats list-unstyled">' +
					'<li class="stat-str first"><label>STR:</label> ' + target.str + ' (20)</li>' +
					'<li class="stat-wis"><label>WIS:</label> ' + target.wis + ' (26) </li>' +
					'<li class="stat-int"><label>INT:</label> ' + target.int + ' (18)</li>' +
					'<li class="stat-dex"><label>DEX:</label> ' + target.dex + ' (14)</li>' +
					'<li class="stat-con"><label>CON:</label> ' + target.con + ' (20)</li>' +
				'</ul>' +
				'<ul class="col-md-3 score-stats list-unstyled">' +
					'<li class="stat-armor"><label>Armor:</label> ' + target.ac + '</li>' +
					'<li class="stat-gold"><label>Gold:</label> ' + target.gold + '</li>' +
					'<li class="stat-hunger"><label>Hunger:</label>' + target.hunger +'</li>' +
					'<li class="stat-thirst"><label>Thirst:</label> 0</li>' +
					'<li class="stat-trains last"><label>Trains:</label> ' + target.trains + '</li>' +
				'</ul>' +
				'<div class="stat-details">' +
					'<ul class="col-md-3 score-stats list-unstyled">' +
						'<li class="stat-hitroll"><label>Hit Bonus: </labels> 3</li>' +
						'<li class="stat-damroll"><label>Damage Bonus: </label> 3</li>' +
						'<li class="stat-position"><label>Magic resistance: </label> -3</li>' +
						'<li class="stat-position"><label>Melee resistance: </label> -3</li>' +
						'<li class="stat-position"><label>Poison resistance: </label> -3</li>' +
						'<li class="stat-position"><label>Detection: </label> 2</li>' +
						'<li class="stat-position"><label>Knowledge: </label> 2</li>' +
					'</ul>' +
					'<div class="col-md-3 score-img">' +
						'<img width="100%" src="http://content.turbine.com/sites/www.lotro.com/f2p/images/race/dwarf.png" />' +
					'</div>' +
				'</div>' +
				'<ul class="col-md-12 list-unstyled">' +
					'<li class="stat-position"><label>Position: </label> ' + target.position + '</li>' +
					'<li class="stat-level">You are a level ' + target.level + ' ' + target.race + ' '+  target.charClass + '.</li>' +
					'<li class="stat-carry">You are carrying ' + target.weight + '/' + target.maxWeight + ' pounds.</li>' +
					'<li class="stat-xp">You need <strong>' + target.exp + '</strong> experience for your next level.</li>' +
					'<li class="stat-killcnt last">You have slain 100 foes.</li>' +
				'</ul>' +
			'</div>'
				'</div>' +
		'</div></section>';

	World.msgPlayer(target, { msg: score });
};

Cmd.prototype.help = function(target, command) {
	// if we don't list a specific help file we return help.json
	var helpTxt = '';

	if (command.msg !== '') {
		fs.readFile('./help/' + command.msg + '.json', function (err, data) {
			if (!err) {
				data = JSON.parse(data);

				helpTxt = '<h2>Help: ' + data.name + '</h2> ' + data.description + 
				'<p class="small">Related: '+ data.related.toString() + '</p>';

				World.msgPlayer(target, {msg: helpTxt, styleClass: 'cmd-help' });

				
			} else {
				World.msgPlayer(target, {msg: 'No help file found.', styleClass: 'error' });
			}
		});	
	} else {
		World.msgPlayer(target, {msg: 'Help you with what exactly?', styleClass: 'error' });
	}
};

Cmd.prototype.xyzzy = function(target, command) {
	World.getRoomObject(target.area, target.roomid, function(roomObj) {
		World.msgRoom(roomObj, {
			msg: target.name + 	' tries to xyzzy but nothing happens.', 
			roomid: target.roomid,
			playerName: target.name
		});

		World.msgPlayer(target, {msg: 'Nothing happens. Why would it?', styleClass: 'error' });
	});
};

/**********************************************************************************************************
* ADMIN COMMANDS  
************************************************************************************************************/

/*
* View a string representation of the JSON behind a world object.
* Syntax: json objectType (item, room, monster or player)
* typing 'json' alone will give the json object for the entire current room. 
*/
Cmd.prototype.json = function(target, command) {
	if (target.role === 'admin' && command.msg) {
		Character.checkInventory(r,s,function(fnd,item) {
			if (fnd) {
				World.msgPlayer(target, {msg: util.inspect(item, {depth: null})});
			} else {
				Room.checkItem(r, s, function (fnd, item) {
					if (fnd) {
						World.msgPlayer(target, {msg: util.inspect(item, {depth: null})});
					} else {
						Room.checkMonster(r, s, function (fnd, monster) {
								if (fnd) {
									World.msgPlayer(target, {msg: util.inspect(monster, {depth: null})});
								} else {
									World.msgPlayer(target, {msg: 'Target not found.', styleClass: 'error' });
								}
							}
						);
					}
				});
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Jason who?', styleClass: 'error' });
	}
};

/*
* An in game reboot. 
* Stops all combat, reloads all active areas, saves players, and clears all corpses / items with a decay flag
*/
Cmd.prototype.reboot = function(target, command) {
	if (target.role === 'admin') {

	} else {
		World.msgPlayer(target, {msg: 'No.', styleClass: 'error' });
	}
};

// Fully heal everyone on the MUD
Cmd.prototype.restore = function(target, command) {
	if (target.role === 'admin') {

	} else {
		World.msgPlayer(target, {msg: 'You do not possess that kind of power.', styleClass: 'error' });
	}
};

// Stops all game combat, does not heal
Cmd.prototype.peace = function(target, command) {
	if (target.role === 'admin') {

	} else {
		World.msgPlayer(target, {msg: 'You do not possess that kind of power.', styleClass: 'error' });
	}
};

module.exports.cmd = new Cmd();
