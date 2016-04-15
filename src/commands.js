/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
* the actual combat loop is, of course, in combat.js
*/
'use strict';
var fs = require('fs'),
util = require('util'),
Character = require('./character').character,
World = require('./world').world,
Room = require('./rooms').room,
Combat = require('./combat').combat,
Skills = require('./skills').skills,
Spells = require('./spells').spells,
players = World.players,
time = World.time,
areas = World.areas,

Cmd = function () {};

Cmd.prototype.scan = function(target, command) {
	var roomObj,
	rooms,
	i = 0,
	scanStr = '';

	if (target.position !== 'sleeping') { 
		roomObj = World.getRoomObject(target.area, target.roomid);
		rooms = Room.getAdjacent(roomObj);

		for (i; i < rooms.length; i += 1) {
			scanStr += Room.getBrief(rooms[i]);
		}

		World.msgPlayer(target, {msg: scanStr});
	} else {
		World.msgPlayer(target, {msg: 'Scan while sleeping?', styleClass: 'error'});
	}
};

Cmd.prototype.emote = function(target, command) {
	var roomObj;
	
	if (target.position !== 'sleeping') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		World.msgRoom(roomObj, {
			msg: '<div class="cmd-emote">' + target.displayName + ' ' + command.msg + '</div>'
		});
	} else {
		World.msgPlayer(target, {msg: 'You can\'t emote right now.', styleClass: 'error'});
	}
};

Cmd.prototype.eat = function(target, command) {
	var roomObj,
	item;

	if (target.position !== 'sleeping') {
		if (command.msg !== '') {
			roomObj = World.getRoomObject(target.area, target.roomid);

			item = World.search(target.items, command);

			if (item.itemType === 'food') {
				Character.removeItem(target, item);

				target.hunger -= World.dice.roll(item.diceNum, item.diceSides);

				if (target.hunger < 0) {
					target.hunger = 0;
				}

				World.msgRoom(roomObj, {
					msg: target.displayName + ' eats a ' + item.short,
					playerName: target.name,
					styleClass: 'cmd-drop yellow'
				});

				World.msgPlayer(target, {
					msg: 'You eat a ' + item.short,
					styleClass: 'cmd-drop blue'
				});
			} else {
				World.msgPlayer(target, {msg: 'You can\'t eat something you dont have.', styleClass: 'error'});
			}
		} else {
			World.msgPlayer(target, {msg: 'Eat what?', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You can\'t eat while sleeping.', styleClass: 'error'});
	}
};

Cmd.prototype.drink = function(target, command) {
	var roomObj,
	bottle;

	if (command.msg !== '') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		bottle = Character.getBottle(target, command);

		if (bottle) {
			bottle.drinks -= World.dice.roll(1, 2);

			if (bottle.drinks <= 0) {
				bottle.drinks = 0;
			}

			if (bottle.drinks > 0) {
				target.thirst -= World.dice.roll(1, 3);

				if (target.thirst < 0) {
					target.thirst = 0;
				}

				if (typeof bottle.onDrink === 'function') {
					bottle.onDrink(target, roomObj, bottle);
				}

				World.msgRoom(roomObj, {
					msg: target.displayName + ' drinks from a ' + bottle.short,
					playerName: target.name,
					styleClass: 'cmd-drop yellow'
				});

				World.msgPlayer(target, {
					msg: 'You drink from a ' + bottle.short,
					styleClass: 'cmd-drop blue'
				});
			} else {
				World.msgPlayer(target, {
					msg: 'A ' + bottle.short + ' is bone dry.',
					styleClass: 'cmd-drop red'
				});
			}
		} else {
			World.msgPlayer(target, {msg: 'You can\'t drink something you dont have.', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {msg: 'Drink from what?', styleClass: 'error'});
	}
};

Cmd.prototype.fill = function() {
	
};

Cmd.prototype.sleep = function(target, command) {
	var roomObj;

	if (target.position !== 'sleeping') {
		if (target.position === 'standing' || target.position === 'resting') {
			target.position = 'sleeping';

			World.msgPlayer(target, {msg: 'You lie down and go to sleep.', styleClass: 'cmd-sleep'});

			roomObj = World.getRoomObject(target.area, target.roomid);

			World.msgRoom(roomObj, {
				msg: target.displayName + ' lies down and goes to sleep.',
				playerName: target.name,
				styleClass: 'cmd-sleep'
			});
		} else {
			World.msgPlayer(target, {msg: 'You can\'t go to sleep in this position.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You are already asleep...'});
	}
};

Cmd.prototype.rest = function(target, command) {
	var roomObj;

	if (target.position !== 'resting') {
		if (target.position === 'standing' || target.position === 'sleeping') {
			target.position = 'sleeping';

			World.msgPlayer(target, {msg: 'You begin resting.', styleClass: 'cmd-rest'});

			roomObj = World.getRoomObject(target.area, target.roomid);

			World.msgRoom(roomObj, {
				msg: target.displayName + ' begins to rest.',
				playerName: target.name,
				styleClass: 'cmd-sleep'
			});
		} else {
			World.msgPlayer(target, {msg: 'You can\'t rest right now.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You are resting now...do you expect to rest harder?'});
	}
};

Cmd.prototype.stand = function(target, command) {
	var roomObj;

	if (target.position === 'sleeping' || target.position === 'resting') {
		target.position = 'standing';

		World.msgPlayer(target, {
			msg: 'You wake and stand up.',
			styleClass: 'cmd-wake'
		});

		roomObj = World.getRoomObject(target.area, target.roomid);

		World.msgRoom(roomObj, {
			msg: target.displayName + ' stands up.',
			playerName: target.name,
			styleClass: 'cmd-sleep'
		});
	} else {
		World.msgPlayer(target, {msg: 'You aren\'t sleeping.'});
	}
};

Cmd.prototype.open = function(target, command, fn) {
	var roomObj,
	targetRoom,
	targetExit,
	exitObj;

	if (target.position === 'standing' 
		|| target.position === 'resting' 
		|| target.position === 'fighting') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		exitObj = Room.getExit(roomObj, command.arg);

		if (exitObj && exitObj.door && !exitObj.door.isOpen) {
			targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

			targetExit = Room.getAdjacentExit(targetRoom, exitObj, target);

			if (targetExit && !exitObj.door.locked) {
				exitObj.door.isOpen = true;
				targetExit.door.isOpen = true;

				World.msgPlayer(target, {
					msg: 'You open a ' 
						+ exitObj.door.name + ' ' + exitObj.cmd 
						+ ' from here.',
					styleClass: 'cmd-wake'
				});

				World.msgRoom(roomObj, {
					msg: target.displayName + ' opens a ' + exitObj.door.name + '.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});

				if (exitObj.door.openMsg) {
					World.msgPlayer(target, {msg: exitObj.door.openMsg, styleClass: 'yellow'});
				}

				World.msgRoom(targetRoom, {
					msg: 'A ' + exitObj.door.name + ' opens to the ' + targetExit.cmd +'.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});
			} else {
				World.msgPlayer(target, {msg: 'It can\'t be opened right now.'});
			}
		} else {
			World.msgPlayer(target, {msg: 'Nothing to open in that direction.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You cannot open things right now.'});
	}
};

Cmd.prototype.close = function(target, command, fn) {
	var roomObj,
	targetRoom,
	targetExit,
	exitObj;
	
	if (target.position === 'standing' 
		|| target.position === 'resting' 
		|| target.position === 'fighting') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		exitObj = Room.getExit(roomObj, command.arg);

		if (exitObj && exitObj.door && exitObj.door.isOpen === true) {
			targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

			targetExit = Room.getAdjacentExit(targetRoom, exitObj, target);

			if (targetExit && !exitObj.door.locked) {
				exitObj.door.isOpen = false;
				targetExit.door.isOpen = false;

				World.msgPlayer(target, {
					msg: 'You close a ' + exitObj.door.name + ' ' + exitObj.cmd + ' from here.',
					styleClass: 'cmd-wake'
				});

				if (exitObj.closeMsg) {
					World.msgPlayer(target, exitObj.closeMsg);
				}

				World.msgRoom(roomObj, {
					msg: target.displayName + ' closes a ' + exitObj.door.name + '.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});

				World.msgRoom(targetRoom, {
					msg: 'A ' + exitObj.door.name + ' closes to the ' + targetExit.cmd +'.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});
			} else {
				World.msgPlayer(target, {msg: 'Nothing you can close in that direction.'});
			}
		} else {
			World.msgPlayer(target, {msg: 'Nothing to close.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You cannot close anything right now.'});
	}
};

Cmd.prototype.unlock = function(target, command) {
	var roomObj,
	exitObj,
	targetRoom,
	targetExit,
	key;

	if (command.msg) {
		if (target.position === 'standing' 
			|| target.position === 'resting' 
			|| target.position === 'fighting') {
			
			roomObj = World.getRoomObject(target.area, target.roomid);
			exitObj = Room.getExit(roomObj, command.arg);
			
			if (exitObj && exitObj.door && exitObj.door.locked === true) {
				targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

				targetExit = Room.getAdjacentExit(targetRoom, exitObj, target);

				key = Character.getKey(target, targetExit.door.key);

				if (key) {
					exitObj.door.locked = false;
					World.msgPlayer(target, {msg: 'You unlock the ' + exitObj.door.name + ' with a ' + key.short, styleClass: 'error'});
				} else {
					World.msgPlayer(target, {msg: 'You don\'t seem to have the key.', styleClass: 'error'});
				}
			} else {
				World.msgPlayer(target, {msg: 'That doesn\'t require unlocking.', styleClass: 'error'});
			}
		} else {
			World.msgPlayer(target, {msg: 'You aren\'t in a position to unlock anything right now.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You try to unlock nothing and look like an idiot.'});
	}
};

Cmd.prototype.lock = function(target, command, fn) {
	var roomObj,
	exitObj,
	targetRoom,
	targetExit,
	key;

	if (command.msg) {
		if (target.position === 'standing' 
			|| target.position === 'resting' 
			|| target.position === 'fighting') {
			
			roomObj = World.getRoomObject(target.area, target.roomid);
			exitObj = Room.getExit(roomObj, command.arg);

			if (exitObj && exitObj.door && exitObj.door.locked === false) {
				targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

				targetExit = Room.getAdjacentExit(targetRoom, exitObj, target);

				key = Character.getKey(target, targetExit.door.key);

				if (key) {
					if (exitObj.door.isOpen === true) {
						exitObj.door.isOpen = false;
					}

					exitObj.door.locked = true;

					World.msgPlayer(target, {msg: 'You lock the ' + exitObj.door.name + ' with a ' + key.short, styleClass: 'error'});
				} else {
					World.msgPlayer(target, {msg: 'You don\'t seem to have the key.', styleClass: 'error'});
				}
			} else {
				World.msgPlayer(target, {msg: 'You cant lock that.', styleClass: 'error'});
			}
		} else {
			World.msgPlayer(target, {msg: 'You aren\'t in a position to lock anything right now.'});
		}
	} else {
		World.msgPlayer(target, {msg: 'Lock what?'});
	}
};

// Puts any target object into a defined room after verifying criteria
Cmd.prototype.move = function(target, command, fn) {
	var direction = command.arg,
	dexMod = World.dice.getDexMod(target),
	exitObj,
	displayHTML,
	targetRoom,
	exitObj,
	moveRoll = World.dice.roll(1, 4),
	roomObj;

	if (target.position === 'standing' 
		|| target.position === 'fleeing' 
		&& target.cmv > (4 - dexMod) 
		&& target.wait === 0) {
		roomObj = World.getRoomObject(target.area, target.roomid);

		exitObj = Room.getExit(roomObj, direction);

		if (exitObj) {
			if (!exitObj || !exitObj.door || exitObj.door.isOpen === true) {
				targetRoom = World.getRoomObject(roomObj.area, exitObj.id);
				
				target.cmv -= Math.round(4 + moveRoll - dexMod);

				if (target.cmv < 0) {
					target.cmv = 0;
				}

				target.roomid = targetRoom.id;
				
				if (targetRoom.terrianMod) {
					target.wait += targetRoom.terrianMod;
				}

				if (target.isPlayer) {
					this.look(target);

					Room.removePlayer(roomObj, target);

					targetRoom.playersInRoom.push(target);
				} else {
					Room.removeMob(roomObj, target);

					targetRoom.monsters.push(target);
				}

				World.msgRoom(targetRoom, {
					msg: '<strong>' + target.displayName + '</strong> enters the room from the ' + exitObj.cmd,
					playerName: target.name
				});

				World.msgRoom(roomObj, {
					msg: '<span class="yellow">' + target.displayName
						+ ' leaves the room heading <strong>' + direction + '</strong></div>',
					playerName: target.name
				});

				Room.processEvents(targetRoom, target, 'onVisit', function(targetRoom, target) {
					if (typeof fn === 'function') {
						return fn(true, roomObj, targetRoom);
					}
				});
			} else {
				World.msgPlayer(target, {
					msg: 'You need to open a ' + exitObj.door.name + ' first.' ,
					styleClass: 'error'
				});

				if (typeof fn === 'function') {
					return fn(false);
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'There is no exit in that direction.',
				styleClass: 'error'
			});

			if (typeof fn === 'function') {
				return fn(false);
			}
		}
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
			player = World.players[i]; // A visible player in players[]

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
					'<td width="85%">Name</td>' +
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
	var roomObj,
	i = 0,
	item,
	container,
	itemLen;

	if (target.position !== 'sleeping') {
		if (command.msg !== '') {
			container = Character.getContainer(target, command);

			if (!container) {
				roomObj = World.getRoomObject(target.area, target.roomid);

				if (command.msg !== 'all') {
					item = Room.getItem(roomObj, command);

					if (item) {
						Room.removeItem(roomObj, item);

						Character.addToInventory(target, item);

						if (item) {
							World.msgRoom(roomObj, {
								msg: target.displayName + ' picks up a ' + item.short,
								playerName: target.name,
								styleClass: 'cmd-get yellow'
							});

							World.msgPlayer(target, {
								msg: 'You pick up a ' + item.short,
								styleClass: 'cmd-get blue'
							});

							if (typeof fn === 'function') {
								return fn(target, roomObj, item);
							}
						}
					} else {
						World.msgPlayer(target, {msg: 'That item is not here.', styleClass: 'error'});

						if (typeof fn === 'function') {
							return fn(target, roomObj, false);
						}
					}
				} else {
					itemLen = roomObj.items.length;

					while (roomObj.items.length > 0) {
						item = roomObj.items[0];
						
						Room.removeItem(roomObj, item);

						Character.addToInventory(target, item);
					}
					
					World.msgRoom(roomObj, {
						msg: target.displayName + ' grabs everything they can.',
						playerName: target.name,
						styleClass: 'cmd-get-all yellow'
					});

					World.msgPlayer(target, {
						msg: 'You grab everything!',
						styleClass: 'cmd-get-all blue'
					});

					if (typeof fn === 'function') {
						return fn(target, roomObj, item);
					}
				}
			} else {
				item = Character.getFromContainer(container, command);
				
				if (item) {
					Character.removeFromContainer(container, item);
					Character.addToInventory(target, item);

					World.msgPlayer(target, {msg: 'You remove a <strong>'
						+ item.short + '</strong> from a '
						+ container.short + '.', styleClass: 'green'});
				} else {
					World.msgPlayer(target, {msg: 'You don\'t see that in there.', styleClass: 'error'});
				}
			}
		} else {
			World.msgPlayer(target, {msg: 'Get what? Specify a target or try get all.', styleClass: 'error'});

			if (typeof fn === 'function') {
				return fn(target, roomObj, item);
			}
		}
	} else {
		World.msgPlayer(target, {msg: 'Get something while sleeping?', styleClass: 'error'});
	}
};

Cmd.prototype.put = function(target, command) {
	var roomObj,
	i = 0,
	item,
	container,
	itemLen;

	if (target.position !== 'sleeping') {
		if (command.msg !== '') {
			container = Character.getContainer(target, command);

			if (container) {
				item = Character.getItem(target, command);

				if (item) {
					Character.removeItem(target, item);
					Character.addToContainer(container, item);

					World.msgPlayer(target, {
						msg: 'You put a <strong>' + item.short + '</strong> into a ' + container.short + '.',
						styleClass: 'green'
					});
				} else {
					World.msgPlayer(target, {msg: 'You aren\'t carrying anything by that name.', styleClass: 'error'});
				}
			} else {
				World.msgPlayer(target, {msg: 'Into what? You don\'t seem to have that item.', styleClass: 'error'});
			}
		} else {
			World.msgPlayer(target, {msg: 'Put what? Specify a target.', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You are currently sleeping.', styleClass: 'error'});
	}
};

Cmd.prototype.drop = function(target, command, fn) {
	var roomObj,
	i = 0,
	itemLen,
	itemArr,
	item;

	if (target.position !== 'sleeping') {
		if (command.msg !== '' && target.items.length !== 0) {
			roomObj = World.getRoomObject(target.area, target.roomid);

			if (command.msg !== 'all') {
				item = World.search(target.items, command);

				if (item) {
					Character.removeItem(target, item);

					if (item) {
						Room.addItem(roomObj, item);

						World.msgRoom(roomObj, {
							msg: target.displayName + 'drops a ' + item.short,
							playerName: target.name,
							styleClass: 'cmd-drop yellow'
						});

						World.msgPlayer(target, {
							msg: 'You drop a ' + item.short,
							styleClass: 'cmd-drop blue'
						});
					} else {
						World.msgPlayer(target, {msg: 'Could not drop a ' + item.short, styleClass: 'error'});
					}
				} else {
					World.msgPlayer(target, {msg: 'You do not have that item.', styleClass: 'error'});
				}
			} else {
				itemLen = target.items.length;
				itemArr = target.items;

				for (i; i < itemLen; i += 1) {
					item = itemArr[i];
					
					Character.removeItem(target, item);

					if (item) {
						Room.addItem(roomObj, item);

						if (roomObj.items.length === itemLen) {
							World.msgRoom(roomObj, {
								msg: target.displayName + ' drops everything they are carrying',
								playerName: target.name,
								styleClass: 'cmd-drop-all yellow'
							});

							World.msgPlayer(target, {
								msg: 'You drop everything',
								styleClass: 'cmd-drop-all blue'
							});
						}
					} else {
						World.msgPlayer(target, {msg: 'Could not drop a ' + item.short, styleClass: 'error'});
					}
				}
			}
		} else {
			World.msgPlayer(target, {msg: 'Drop nothing? How do you drop nothing?', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {msg: 'You are sleeping at the moment.', styleClass: 'error'});
	}
};

Cmd.prototype.flee = function(player, command) {
	var cmd = this,
	fleeCheck,
	directions = ['north', 'east', 'west', 'south', 'down', 'up'];

	if (player.opponent) {
		fleeCheck = World.dice.roll(1, 20, World.dice.getDexMod(player));

		if (fleeCheck > 10 && player.wait === 0) {
			player.position = 'fleeing';

			if (!command.msg) {
				command.msg = directions[World.dice.roll(1, directions.length) - 1];
			}

			cmd.move(player, command, function(moved) {
				if (moved) {
					player.position = 'standing';
					player.opponent.position = 'standing';

					World.msgPlayer(player.opponent, {msg: player.displayName + ' fled ' + command.msg +'!', styleClass: 'grey'});
					World.msgPlayer(player, {msg: 'You fled ' + command.msg +'!', styleClass: 'red'});
					
					player.opponent.opponent = null;
					player.opponent = null;
					
				} else {
					player.position = 'fighting';

					World.msgPlayer(player.opponent, {msg: '<p>' + player.displayName + ' tries to flee ' + command.msg + '.</p>', styleClass: 'grey'});
					World.msgPlayer(player, {msg: 'You cannot flee in that direction!', styleClass: 'red'});
				}
			});
		} else {
			player.position = 'fighting';

			World.msgPlayer(player, {msg: 'You try to flee and fail!', styleClass: 'green'});
		}

		if (World.dice.roll(1, 10) < 6) {
			player.wait += 1;
		}
	} else {
		World.msgPlayer(player, {msg: 'Flee from what? You aren\'t fighting anything...', styleClass: 'green'});
	}
};

// triggering spell skills
Cmd.prototype.cast = function(player, command, fn) {
	var cmd = this,
	mob,
	roomObj;

	if (player.position !== 'sleeping') {
		if (command.arg) {
			if (command.arg in Spells) {
					if (player.position !== 'sleeping' && player.position !== 'resting' && player.position !== 'fleeing') {
						roomObj = World.getRoomObject(player.area, player.roomid);

						if (!command.input && player.opponent) {
							return Spells[command.arg](player, player.opponent, roomObj, command, function() {
								if (!player.opponent && player.position !== 'fighting') {
									cmd.kill(player, command, roomObj, fn);
								}
							});
						} else {
							mob = World.search(roomObj.monsters, command);

							if (mob) {
								return Spells[command.arg](player, mob, roomObj, command, function() {
									if (!player.opponent && player.position !== 'fighting') {
										cmd.kill(player, command, roomObj, fn);
									}
								});
							} else {
								World.msgPlayer(player, {
									msg: 'You do not see anything by that name here.',
									styleClass: 'error'
								});
							}
						}
					}
			} else {
				World.msgPlayer(player, {
					msg: 'You do not know that spell.'
				});
			}
		} else {
			World.msgPlayer(player, {
				msg: 'You do not know that spell.'
			});
		}
	} else {
		World.msgPlayer(player, {
			msg: 'You cannot use magic while asleep.'
		});
	}
};

// For attacking in-game monsters
Cmd.prototype.kill = function(player, command, attackObj, fn) {
	var roomObj,
	opponent;

	if (player.position !== 'sleeping' && player.position !== 'resting'
		&& player.position !== 'fighting') {
		roomObj = World.getRoomObject(player.area, player.roomid);

		opponent = World.search(roomObj.monsters, command);

		if (opponent && opponent.roomid === player.roomid) {
			Combat.processFight(player, opponent, roomObj);
		} else {
			opponent = World.search(roomObj.playersInRoom, command);

			if (opponent && opponent.roomid === player.roomid) {
				Combat.processFight(player, opponent, roomObj);
			} else {
				World.msgPlayer(player, {
					msg: 'There is nothing by that name here.',
					styleClass: 'error'
				});
			}
		}
	} else {
		World.msgPlayer(player, {
			msg: 'Hard to do that from this position.',
			styleClass: 'combat-death'
		});
	}
};

Cmd.prototype.look = function(target, command) {
	var roomObj = World.getRoomObject(target.area, target.roomid),
	displayHTML,
	monster,
	// boolean. when it is false it indicates we need a light source to see.
	// the initial value of target.sight should be true inless target is blind.	
	canSee = target.sight,
	light,
	itemDescription,	
	item, // looking at an item
	i = 0;
	
	if (canSee) {
		if (target.position !== 'sleeping') {
			if ((!World.time.isDay && !roomObj.dark) || roomObj.dark === true) {
				canSee = false;

				light = Character.getLights(target)[0];
			}
			
			if (!command || command.msg === '') {
				// if no arguments are given we display the current room

				if (canSee || (!canSee && light)) {
					roomObj = World.getRoomObject(target.area, target.roomid);

					displayHTML = Room.getDisplayHTML(roomObj, {
						hideCallingPlayer: target.name
					});

					World.msgPlayer(target, {
						msg: displayHTML,
						styleClass: 'room'
					});
				} else {
					World.msgPlayer(target, {
						msg: 'It is too dark to see anything!',
						styleClass: 'error'
					});
				}
			} else {
				roomObj = World.getRoomObject(target.area, target.roomid);

				item = Character.getItem(target, command);
				
				if (item) {
					itemDescription = '<p>' + item.long + '</p>';
					
					if (item.items) {
						itemDescription += '<p>Inside you can see:</p><ul class="list container-list">'

						for (i; i < item.items.length; i += 1) {
							itemDescription += '<li>' + item.items[i].displayName  + '</li>';
						}
					}
					
					itemDescription += '</ul>';
					
					World.msgPlayer(target, {
						msg: itemDescription,
						styleClass: 'cmd-look'
					});
				} else {
					monster = Room.getMonster(roomObj, command);

					if (monster) {
						if (!monster.long) {
							itemDescription = monster.short;
						}
						
						World.msgPlayer(target, {
							msg: itemDescription,
							styleClass: 'cmd-look'
						});
					} else {
						item = Room.getItem(target, command);

						if (item) {
							return World.msgPlayer(target, {
								msg: item.long,
								styleClass: 'cmd-look'
							});
						} else {
							return World.msgPlayer(target, {
								msg: 'You do not see that here.',
								styleClass: 'error'
							});
						}
					}
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You cannot see anything because you are asleep.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You cannot see anything when you\'re blind.'
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

	return World.msgPlayer(target, r);
};

/** Communication Channels **/
Cmd.prototype.say = function(target, command) {
	var roomObj;

	if (target.position !== 'sleeping') {
		if (command.msg !== '') {
			World.msgPlayer(target, {
				msg: '<div class="cmd-say"><span class="msg-name">You say></span> ' + command.msg + '</div>'
			});

			roomObj = World.getRoomObject(target.area, target.roomid);

			World.msgRoom(roomObj, {
				msg: '<div class="cmd-say"><span class="msg-name">' + target.displayName + ' says></span> ' + command.msg + '</div>',
				playerName: target.name
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You have nothing to say.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t say anything while sleeping!',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.yell = function(target, command) {
	if (command.msg !== '') {
		World.msgPlayer(target, {
			msg: '<div class="cmd-yell"><span class="msg-name">You yell></span> ' + command.msg + '</div>'
		});
		
		World.msgArea(target.area, {
			msg: '<div class="cmd-yell"><span class="msg-name">' + target.displayName + ' yells></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You open your mouth to yell and nothing comes out. You feel like an idiot.',
			styleClass: 'error'
		});
	}
};


Cmd.prototype.chat = function(target, command) {
	if (command.msg !== '') {
		World.msgPlayer(target, {
			msg: '<div class="cmd-chat"><span class="msg-name">You chat></span> ' + command.msg + '</div>'
		});

		World.msgWorld(target, {
			msg: '<div class="cmd-chat"><span class="msg-name">' + target.displayName + '></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You cannot chat nothing, no one can.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.tell = function(target, command) {
	var player;

	if (command.msg) {
		player = World.getPlayerByName(command.msg);

		if (player) {
			World.msgPlayer(player, {
				msg: '<strong>' + player.displayName + ' tells you></strong> ' + command.msg,
				styleClass: 'red'
			});

			target.reply = player.name;

			World.msgPlayer(target, {msg: 'You tell ' + target.displayName + '> ' + command.msg, styleClass: 'cmd-say red'});
		} else {
			World.msgPlayer(target, {msg: 'You do not see that person.', styleClass: 'error'});
		}
	} else {
		return World.msgPlayer(target, {msg: 'Tell who?', styleClass: 'error'});
	}
};

Cmd.prototype.reply = function(target, command) {
	var player;

	if (command.msg && target.reply) {
		player = World.getPlayerByName(target.reply);

		if (player) {
			World.msgPlayer(player, {
				msg: '<strong>' + player.displayName + ' replies></strong> ' + command.msg,
				styleClass: 'red'
			});

			target.reply = player.name;

			World.msgPlayer(target, {msg: 'You reply ' + target.displayName + '> ' + command.msg, styleClass: 'cmd-say red'});
		} else {
			World.msgPlayer(target, {msg: 'They arent there anymore.', styleClass: 'error'});
		}
	} else {
		return World.msgPlayer(target, {msg: 'Takes more than that to reply to someone.', styleClass: 'error'});
	}
};

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
			msg: '<div class="error">You are not powerful enough to speak directly with gods!</div>'
		});
	}
};

// Viewing the time
Cmd.prototype.time = function(target, command) {
	var timeStr,
	hr,
	min;

	if (World.time.hour < 10) {
		hr = '0' + World.time.hour;
	} else {
		hr = World.time.hour;
	}

	if (World.time.minute < 10) {
		min = '0' + World.time.minute;
	} else {
		min = World.time.minute;
	}

	timeStr = 'Todays date: ' + World.time.month.id + '/' + World.time.day + '/' 
		+ World.time.year + ' (' + hr + ':' + min + '), the ' + World.time.title;

	if (World.time.isDay) {
		timeStr += ' (Day)';
	} else {
		timeStr += ' (Night)';
	}

	World.msgPlayer(target, {
		msg: timeStr,
		styleClass: 'cmd-time'
	});
};

/** Related to Saving and character adjustment/interaction **/

Cmd.prototype.save = function(target, command) {
	if (target.position === 'standing' && target.wait === 0) {
		Character.save(target, function() {
			World.msgPlayer(target, {msg: target.displayName + ' was saved. Whew!', styleClass: 'save'});
		});
	} else if (target.position !== 'standing') {
		World.msgPlayer(target, {msg: 'You can\'t save while ' + target.position + '.', styleClass: 'save'});
	} else {
		World.msgPlayer(target, {msg: 'You can\'t save just yet!', styleClass: 'error'});
	}
};

Cmd.prototype.title = function(target, command) {
	if (command.msg.length < 40) {
		if (command.msg != 'title') {
			target.title = command.msg;
		} else {
			target.title = ' a level ' + target.level + ' ' + target.race + ' ' + target.charClass;
		}

		World.msgPlayer(target, {msg: 'Your title was changed!', styleClass: 'save'});
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
			eqStr += '<label class="yellow">'  + target.eq[i].item.short + '</label></li>';
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
	var item;

	if (target.position !== 'sleeping' && target.position !== 'resting') {
		if (command.msg !== '') {
			item = Character.getItem(target, command);

			if (item) {
				if (Character['wear' + item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)]) {
					Character['wear' + item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)](target, item);
				} else {
					World.msgPlayer(target, {
						msg: 'You cant figure out how to wear a ' + item.short,
						styleClass: 'error'
					});	
				}
			} else {
				World.msgPlayer(target, {
					msg: 'You do not have that item.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {msg: 'Wear what?', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You cannot wear anything while in this position.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.remove = function(target, command) {
	var item,
	removed;

	if (target.position !== 'sleeping' && target.position !== 'resting') {
		if (command.msg !== '') {
			item = Character.getItem(target, command);

			if (item) {
				Character.removeEq(target, item);
			} else {
				World.msgPlayer(target, {msg: 'You are not wearing that.', styleClass: 'error'});
			}
		} else {
			World.msgPlayer(target, {msg: 'Remove what?', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {msg: 'It is impossible to remove items in this position.', styleClass: 'error'});
	}
};

Cmd.prototype.inventory = function(player, command) {
	var iStr = '',
	i = 0;

	iStr += '<table class="table table-condensed table-no-border i-table"><thead><tr>' +
		'<td class="i-name-header">Item Name</td>' +
		'<td class="i-equipped-header green">Equipped</td>' +
		'<td class="i-type-header">Type</td>' +
		'<td class="i-weight-header">Weight</td>' +
		'</tr></thead><tbody>';
	
	if (player.items.length > 0) {
		iStr += '<tr>';

		for (i; i < player.items.length; i += 1) {
			iStr += '<td class="i-name">' + player.items[i].name + '</td>';

			if (!player.items[i].equipped) {
				iStr += '<td class="i-equipped">No</td>';
			} else {
				iStr += '<td class="i-equipped">Yes</td>';
			}

			iStr += '<td class="i-type">' + player.items[i].itemType + '</td>';

			iStr += '<td class="i-weight">' + player.items[i].weight + '</td></tr>';
		}

		World.msgPlayer(player, {msg: '<h1>Your Inventory</h1>' + iStr + '</tbody></table>'});
	} else {
		World.msgPlayer(player, {msg: 'No items in your inventory, can carry ' + player.carry + ' pounds of items and treasure.'});
	}
};

Cmd.prototype.score = function(target, command) {
	var i = 0,
	score = '<section class="row score"><div class="col-md-12"><h1>' + 
		'<span class="score-name">' + target.displayName + '</span> ' + 
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
				'<ul class="col-md-2 score-stats list-unstyled">' +
					'<li class="stat-str first"><label>STR:</label> ' + target.str + ' (20)</li>' +
					'<li class="stat-wis"><label>WIS:</label> ' + target.wis + ' (26) </li>' +
					'<li class="stat-int"><label>INT:</label> ' + target.int + ' (18)</li>' +
					'<li class="stat-dex"><label>DEX:</label> ' + target.dex + ' (14)</li>' +
					'<li class="stat-con"><label>CON:</label> ' + target.con + ' (20)</li>' +
				'</ul>' +
				'<ul class="col-md-2 score-stats list-unstyled">' +
					'<li class="stat-armor"><label>Armor:</label> ' + target.ac + '</li>' +
					'<li class="stat-gold"><label>Gold:</label> ' + target.gold + '</li>' +
					'<li class="stat-hunger"><label>Hunger:</label> ' + target.hunger +'</li>' +
					'<li class="stat-thirst"><label>Thirst:</label> ' + target.thirst +'</li>' +
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
					'<div class="col-md-3 score-affects">' +
						'<h6 class="sans-serif">Affected by:</h6>' +
						'<p>You don\'t feel affected by anything.</p>' +
					'</div>' +
				'</div>' +
				'<ul class="col-md-12 list-unstyled">' +
					'<li class="stat-position">You are currently <span class="green">' + target.position + '</span></li>' +
					'<li class="stat-level">You are a level ' + target.level + ' ' + target.race + ' '+  target.charClass + ' of ' + target.size.display + ' size.</li>' +
					'<li class="stat-carry">You are carrying ' + target.weight + '/' + target.maxWeight + ' pounds.</li>' +
					'<li class="stat-xp">You need <strong>' + (target.expToLevel - target.exp) + '</strong> experience for your next level.</li>' +
					'<li class="stat-killcnt last">You have slain ' + target.killed +' foes.</li>' +
				'</ul>' +
			'</div>'
				'</div>' +
		'</div></section>';

	World.msgPlayer(target, { msg: score });
};

Cmd.prototype.help = function(target, command) {
	if (!command.msg) {
		command.msg = 'help';
	}

	fs.readFile('./help/' + command.msg + '.html', 'utf8', function (err, data) {
		if (!err) {
			World.msgPlayer(target, {msg: data, styleClass: 'cmd-help' });
		} else {
			World.msgPlayer(target, {msg: 'No help file found.', styleClass: 'error' });
		}
	});
};

Cmd.prototype.xyzzy = function(target, command) {
	var roomObj

	if (target.position !== 'sleeping') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		World.msgRoom(roomObj, {
			msg: target.name + 	' tries to xyzzy but nothing happens.', 
			roomid: target.roomid,
			playerName: target.name
		});

		World.msgPlayer(target, {msg: 'Nothing happens. Why would it?', styleClass: 'error' });
	} else {
		World.msgPlayer(target, {msg: 'You dream of powerful forces.', styleClass: 'error' });
	}
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
	// try to use JSON.stringify(cmdObj, null, 4) so we can remove util module
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
Cmd.prototype.restore = function(admin, command) {
	var i = 0,
	player;

	if (admin.role === 'admin') {
		for (i; i < World.players.length; i += 1) {
			player = World.players[i];
			player.chp = player.hp;
			player.cmana = player.mana;
			player.cmv = player.mv;
		}

		World.msgWorld(admin, {msg: 'You feel refreshed!'});
	} else {
		World.msgPlayer(admin, {msg: 'You do not possess that kind of power.', styleClass: 'error' });
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
