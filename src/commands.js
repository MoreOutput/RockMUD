/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
* the actual combat loop is, of course, in combat.js.
* 
* Events fired on particular commands are also fired here; for example onEnter, onLeave
*/
'use strict';
var fs = require('fs'),
util = require('util'),
Character = require('./character').character,
World = require('./world').world,
Room = require('./rooms').room,
Combat = require('./combat').combat,
Spells = require('./spells').spells,
players = World.players,
time = World.time,
areas = World.areas,

Cmd = function () {};

/*
	command object = {
		cmd: cmdArr[0].toLowerCase(), // {cast} spark boar
		msg: cmdArr.slice(1).join(' '), // cast {spark boar}
		arg: cmdArr[1].toLowerCase(), // cast {spark} boar
		input: cmdArr.slice(2).join(' '), // cast spark {boar ...}
		number: 1 // argument target -- cast spark 2.boar
	};
*/
Cmd.prototype.createCommandObject = function(resFromClient) {
	var cmdArr = resFromClient.msg.split(' '),
	cmdObj = {};

	if (cmdArr.length === 1) {
		cmdArr[1] = '';
	}

	if (/[`~@#$%^&*()-+={}[]|<>]+$/g.test(resFromClient.msg) === false) {
		cmdObj = {
			cmd: cmdArr[0].toLowerCase(),
			msg: cmdArr.slice(1).join(' '),
			arg: cmdArr[1].toLowerCase(),
			input: cmdArr.slice(2).join(' '),
			number: 1
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
	}

	return cmdObj;
};

Cmd.prototype.buy = function(target, command) {
	var i = 0,
	roomObj = World.getRoomObject(target.area, target.roomid),
	item,
	canBuy = true,
	merchant;
	
	if (target.position !== 'sleeping') {
		merchant = Room.getMerchants(roomObj)[0];
		
		if (merchant) {
			if (merchant.beforeSell) {
				canBuy = merchant.beforeSell(target, roomObj);
			}

			if (canBuy) {
				item = Character.getItem(merchant, command);
				
				if (item) {
					if (item.worth <= target.gold) {
						target.gold -= item.worth;
						merchant.gold += item.worth;
					
						Character.removeItem(merchant, item);

						Character.addItem(target, item);
					
						World.msgPlayer(target, {
							msg: 'You buy ' + item.short
						});

						if (merchant.onSell) {
							merchant.onSell(target, roomObj);
						}
					} else {
						World.msgPlayer(target, {
							msg: 'You do not enough gold.',
							styleClass: 'yellow'
						});
					}
				} else {
					World.msgPlayer(target, {
						msg: 'Should probably recheck the name again, this isn\'t registering with the merchant.'
					});
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'There doesn\'t seem to be anyone selling anything here.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'Wake up first.'
		});
	}
};

Cmd.prototype.sell = function(target, command) {
	var i = 0,
	roomObj = World.getRoomObject(target.area, target.roomid),
	item,
	merchant;
	
	if (target.position !== 'sleeping') {
		merchant = Room.getMerchants(roomObj)[0];
		
		if (merchant) {
			item = Character.getItem(target, command);

			if (item) {
				if (item.worth <= merchant.gold) {
					merchant.gold -= item.worth - 5;
					target.gold += item.worth - 5;
					
					Character.removeItem(target, item);

					Character.addItem(merchant, item);
					
					World.msgPlayer(target, {
						msg: 'You sell something.'
					});
				} else {
					World.msgPlayer(target, {
						msg: 'He seems to be strapped at the moment.',
						styleClass: 'yellow'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: 'Should probably recheck the name.'
				});
			}
		} else {

		}
	} else {
	
	}
};

Cmd.prototype.list = function(target, command) {
	var i = 0,
	items,
	roomObj = World.getRoomObject(target.area, target.roomid),
	storeDisplay = '',
	merchant;

	if (target.sight) {
		if (target.position === 'standing') {
			merchant = Room.getMerchants(roomObj)[0];
	
			if (merchant) {
				if (merchant.items.length > 0) {
					for (i; i < merchant.items.length; i += 1) {
						storeDisplay += '<li>' + merchant.items[i].name  +
							' <span class="yellow">(' + merchant.items[i].worth + 'gp)</span></li>';
					}

					World.msgPlayer(target, {
						msg: '<h4>' + merchant.short + ' item list</h4><ul class="list">' + storeDisplay  + '</ul>'
					});
				} else {
			
				}
			} else {
				World.msgPlayer(target, {
					msg: 'No one here to buy from.'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t shop from that position.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t see so browsing goods is a little difficult at the moment.'
		});
	}
};

Cmd.prototype.scan = function(target, command) { 
	var roomObj,
	rooms,
	i = 0,
	scanStr = '';

	if (target.position === 'standing') { 
		roomObj = World.getRoomObject(target.area, target.roomid);
		rooms = Room.getAdjacent(roomObj);

		for (i; i < rooms.length; i += 1) {
			scanStr += Room.getBrief(rooms[i]);
		}

		World.msgPlayer(target, {msg: scanStr});
	} else {
		World.msgPlayer(target, {
			msg: 'You must be standing to scan the surrounding area.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.emote = function(target, command) {
	var roomObj;
	
	if (target.position !== 'sleeping') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		World.msgRoom(roomObj, {
			msg: '<div class="cmd-emote yellow">' + target.displayName + ' ' + command.msg + '</div>'
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
				World.msgPlayer(target, {
					msg: 'You can\'t eat something you dont have.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'Eat what?',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t eat while sleeping.',
			styleClass: 'error'
		});
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
			World.msgPlayer(target, {
				msg: 'You can\'t drink something you dont have.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'Drink from what?',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.fill = function() {
	
};

Cmd.prototype.sleep = function(target, command) {
	var roomObj;

	if (target.position !== 'sleeping') {
		if (target.position === 'standing' || target.position === 'resting') {
			target.position = 'sleeping';

			World.msgPlayer(target, {
				msg: 'You lie down and go to sleep.',
				styleClass: 'cmd-sleep'
			});

			roomObj = World.getRoomObject(target.area, target.roomid);

			World.msgRoom(roomObj, {
				msg: target.displayName + ' lies down and goes to sleep.',
				playerName: target.name,
				styleClass: 'cmd-sleep'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t go to sleep in this position.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are already asleep...'
		});
	}
};

Cmd.prototype.rest = function(target, command) {
	var roomObj;

	if (target.position !== 'resting') {
		if (target.position === 'standing' || target.position === 'sleeping') {
			target.position = 'sleeping';

			World.msgPlayer(target, {
				msg: 'You begin resting.',
				styleClass: 'cmd-rest'
			});

			roomObj = World.getRoomObject(target.area, target.roomid);

			World.msgRoom(roomObj, {
				msg: target.displayName + ' begins to rest.',
				playerName: target.name,
				styleClass: 'cmd-sleep'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t rest right now.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are resting now...do you expect to rest harder?'
		});
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

					World.msgPlayer(target, {
						msg: 'You unlock the ' + exitObj.door.name + ' with a ' + key.short,
						styleClass: 'error'
					});
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

					World.msgPlayer(target, {
						msg: 'You lock the ' + exitObj.door.name + ' with a ' + key.short,
						styleClass: 'error'
					});
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

// Light an object that has a light and decayLight property
Cmd.prototype.light = function(target, command, fn) {

};

// Snuff out an object with the needed light properties
Cmd.prototype.snuff = function(target, command, fn) {

};

// Puts any target object into a defined room after verifying criteria
Cmd.prototype.move = function(target, command, fn) {
	var direction = command.arg,
	dexMod = World.dice.getDexMod(target),
	exitObj,
	displayHTML,
	targetRoom,
	exitObj,
	moveRoll = World.dice.roll(1, 6),
	sneakAff,
	roomObj,
	canEnter = true, // event result, must be true to move into targetRoom
	canLeave = true, // event result, must be true to leave roomObj	
	i = 0,
	parseMovementMsg = function(exitObj) {
		if (!exitObj.cmdMsg) {
			if (exitObj.cmd === 'up') {
				return 'below';
			} else if (exitObj.cmd === 'down') {
				return 'above';
			} else {
				return ' the ' + exitObj.cmd;
			}
		} else {
			return exitObj.cmdMsg;
		}
	};

	if (target.position === 'standing' 
		|| target.position === 'fleeing' 
		&& target.cmv > (4 - dexMod) 
		&& target.wait === 0) {

		if (!command.roomObj) {
			roomObj = World.getRoomObject(target.area, target.roomid);
		} else {
			roomObj = command.roomObj;
		}

		exitObj = Room.getExit(roomObj, direction);

		if (exitObj) {
			if (!exitObj || !exitObj.door || exitObj.door.isOpen === true) {
				sneakAff = Character.getAffect(target, 'sneak');
				
				targetRoom = World.getRoomObject(exitObj.area, exitObj.id);

				if (targetRoom && (!targetRoom.size || (targetRoom.size.value >= target.size.value))) {
					if (targetRoom.beforeEnter) {
						canEnter = targetRoom.beforeEnter(target, roomObj, command);
					}

					if (target.beforeMove) {
						canEnter = target.beforeMove(target, roomObj, command);
					}
					
					target.cmv -= Math.round(4 + moveRoll - dexMod);

					if (exitObj.area !== target.area) {
						target.area = exitObj.area;
					}

					if (target.cmv < 0) {
						target.cmv = 0;
					}

					target.roomid = targetRoom.id;

					if (roomObj.onExit) {
						roomObj.onExit(target, roomObj, command);
					}

					for (i; i < roomObj.monsters.length; i += 1) {
						if (roomObj.monsters[i].onLeave) {
							roomObj.monsters[i].onLeave(target, roomObj, command);
						}
					}

					i = 0;

					for (i; i < roomObj.playersInRoom.length; i += 1) {
						if (roomObj.playersInRoom[i].onLeave) {
							roomObj.playersInRoom[i].onLeave(target, roomObj, command);
						}
					}

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
						msg: function(receiver, fn) {
							var msg = '';

							if (!sneakAff) {
								if (Character.canSee(receiver, targetRoom)) {
									if (!target.inName) {
										if (target.long) {
											msg = '<strong>' + target.long
												+ '</strong> walks in from '
												+ parseMovementMsg(exitObj) + '.';
										} else {
											msg = '<strong>' + target.displayName
												+ '</strong> walks in from '
												+ parseMovementMsg(exitObj) + '.';
										}	
									} else if (target.inName && !target.inMessage) {
										msg = '<strong>' + target.inName
											+ '</strong> enters from '
											+ parseMovementMsg(exitObj) + '.';
									} else {
										msg = '<strong>' + target.inName
											+ '</strong> ' + target.inMessage  + ' '
											+ parseMovementMsg(exitObj) + '.';
									}
								} else if (receiver.hearing) {
									if (World.dice.roll(1, 2) === 1) {
										msg = '<strong>Something</strong> enters from '
											+ parseMovementMsg(exitObj) + '.';
									} else {
										msg = '<strong>Something</strong> comes in from '
											+ parseMovementMsg(exitObj) + '.';
									}
								}
							}

							return fn(true, msg);
						},
						playerName: target.name
					});

					World.msgRoom(roomObj, {
						msg: function(receiver, fn) {
							var msg = '';
					
							if (!sneakAff) {
								if (Character.canSee(receiver, roomObj)) {
									if (!target.outName) {
										if (target.long) {
											msg = '<span class="yellow">' + target.long
											+ ' leaves heading <strong>' + direction + '</strong></span>';
										} else {
											msg = '<span class="yellow">' + target.displayName
											+ ' leaves going <strong>' + direction + '</strong></span>';
										}
									} else if (target.outName && !target.outMessage) {
										msg = '<span class="yellow">' + target.outName
										+ ' leaves heading <strong>' + direction + '</strong></span>';
									} else {
										msg = '<span class="yellow">' + target.outName + target.outMessage
										+ ' <strong>' + direction + '</strong></span>';
									}
								} else if (receiver.hearing) {
									msg = '<span class="yellow">You can sense some movement in the area.</span>';
								}
							}
							
							return fn(true, msg);
						},
						playerName: target.name
					});

					if (targetRoom.onEnter) {
						targetRoom.onEnter(target, roomObj, command);
					}

					if (target.onMove) {
						target.onMove(target, roomObj, command);
					}

					i = 0;
					
					for (i; i < targetRoom.monsters.length; i += 1) {
						if (targetRoom.monsters[i].onVisit) {
							targetRoom.monsters[i].onVisit(target, targetRoom, command);
						}
					}

					i = 0;

					for (i; i < targetRoom.playersInRoom.length; i += 1) {
						if (targetRoom.playersInRoom[i].onVisit) {
							targetRoom.playersInRoom[i].onVisit(target, targetRoom, command);
						}
					}
				} else {
					if (targetRoom.size) {
						World.msgPlayer(target, {
							msg: 'You are too large to move there.' ,
							styleClass: 'error'
						});
					}

					if (typeof fn === 'function') {
						return fn(false, roomObj, targetRoom);
					}
				}
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
			player = World.players[i];

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

		str = '<div class="cmd-who"><h2>Visible Players</h2>' +
			'<table class="table table-condensed table-no-border who-list">' +
			'<thead>' +
				'<tr>' +
					'<td width="5%">Level</td>' +
					'<td width="5%">Race</td>' +
					'<td width="5%">Class</td>' +
					'<td width="85%">Name</td>' +
				'</tr>' +
			'</thead><tbody>' + str + '</tbody>' +
		'</table></div>';
		
		World.msgPlayer(target, {
			msg: str, 
			styleClass: 'cmd-who'
		});
	} else {
		World.msgPlayer(target, {
			msg: '<h2>No Visible Players</h2>',
			styleClass: 'cmd-who'
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
		roomObj = World.getRoomObject(target.area, target.roomid);

		if (command.msg !== '' && Character.canSee(target, roomObj)) {
			container = Character.getContainer(target, command);

			if (!container) {
				if (command.msg !== 'all') {
					item = Room.getItem(roomObj, command);

					if (item) {
						Room.removeItem(roomObj, item);

						Character.addItem(target, item);

						if (item) {
							World.msgRoom(roomObj, {
								msg: target.displayName + ' picks up ' + item.short,
								playerName: target.name,
								styleClass: 'yellow'
							});

							World.msgPlayer(target, {
								msg: 'You pick up ' + item.short,
								styleClass: 'blue'
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

						Character.addItem(target, item);
					}
					
					World.msgRoom(roomObj, {
						msg: target.displayName + ' grabs everything they can.',
						playerName: target.name,
						styleClass: 'yellow'
					});

					World.msgPlayer(target, {
						msg: 'You grab everything!',
						styleClass: 'blue'
					});

					if (typeof fn === 'function') {
						return fn(target, roomObj, item);
					}
				}
			} else {
				item = Character.getFromContainer(container, command);
				
				if (item) {
					Character.removeFromContainer(container, item);
					Character.addItem(target, item);

					World.msgPlayer(target, {msg: 'You remove a <strong>'
						+ item.displayName + '</strong> from a '
						+ container.displayName + '.', styleClass: 'green'});
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
						msg: 'You put a <strong>' + item.displayName + '</strong> into ' + container.short + '.',
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
	canDrop = true,
	item;

	if (target.position !== 'sleeping') {
		if (command.msg !== '' && target.items.length !== 0) {
			roomObj = World.getRoomObject(target.area, target.roomid);
		
			if (command.msg !== 'all') {
				item = World.search(target.items, command);

				if (item && !item.equipped) {
					if (item.beforeDrop) {
						canDrop = item.beforeDrop(target, roomObj);
					}

					if (canDrop) {
						if (roomObj.beforeDrop) {
							canDrop = roomObj.beforeDrop(target, item);
						}
					}
						
					if (canDrop) {
						Character.removeItem(target, item);

						Room.addItem(roomObj, item);

						World.msgRoom(roomObj, {
							msg: target.displayName + '  drops ' + item.short,
							playerName: target.name,
							styleClass: 'yellow'
						});

						World.msgPlayer(target, {
							msg: 'You drop ' + item.short,
							styleClass: 'blue'
						});

						if (item.onDrop) {
							item.onDrop(target, roomObj);
						}

						if (roomObj.onDrop) {
							roomObj.onDrop(target, item);
						}
					}
				} else {
					if (!item) {
						World.msgPlayer(target, {
							msg: 'You do not have that item.',
							styleClass: 'error'
						});
					} else {
						World.msgPlayer(target, {
							msg: 'You must remove ' + item.short + ' before you can drop it.',
							styleClass: 'error'
						});
					}
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
								styleClass: 'yellow'
							});

							World.msgPlayer(target, {
								msg: 'You drop everything',
								styleClass: 'blue'
							});
						}
					} else {
						World.msgPlayer(target, {
							msg: 'Could not drop ' + item.short,
							styleClass: 'error'
						});
					}
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You aren\'t carrying anything.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You are sleeping at the moment.',
			styleClass: 'error'
		});
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

					World.msgPlayer(player.opponent, {
						msg: player.displayName + ' fled ' + command.msg +'!',
						styleClass: 'grey'
					});

					World.msgPlayer(player, {
						msg: 'You fled ' + command.msg +'!',
						styleClass: 'red'
					});
					
					player.opponent.opponent = null;
					player.opponent = null;
					
				} else {
					player.position = 'fighting';

					World.msgPlayer(player.opponent, {
						msg: '<p>' + player.displayName + ' tries to flee ' + command.msg + '.</p>',
						styleClass: 'grey'
					});
					
					World.msgPlayer(player, {
						msg: 'You cannot flee in that direction!',
						styleClass: 'red'
					});
				}
			});
		} else {
			player.position = 'fighting';

			World.msgPlayer(player, {
				msg: 'You try to flee and fail!',
				styleClass: 'green'
			});
		}

		if (World.dice.roll(1, 10) < 6) {
			player.wait += 1;
		}
	} else {
		World.msgPlayer(player, {
			msg: 'Flee from what? You aren\'t fighting anything...',
			styleClass: 'green'
		});
	}
};

// triggering spell skills
Cmd.prototype.cast = function(player, command, fn) {
	var cmd = this,
	mob,
	skillObj,
	roomObj;

	if (player.position !== 'sleeping') {
		if (command.arg) {
			if (command.arg in Spells) {
				skillObj = Character.getSkillById(player, command.arg);

				if (skillObj) {
					if (player.position !== 'sleeping' && player.position !== 'resting' && player.position !== 'fleeing') {
						roomObj = World.getRoomObject(player.area, player.roomid);

						if (!command.input && player.opponent) {
							return Spells[command.arg](skillObj, player, player.opponent, roomObj, command, function() {
								if (!player.opponent && player.position !== 'fighting') {
									cmd.kill(player, command, roomObj, fn);
								}
							});
						} else {
							mob = World.search(roomObj.monsters, command);

							if (mob) {
								return Spells[command.arg](skillObj, player, mob, roomObj, command, function() {
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
						msg: 'You do not know that spell.',
						styleClass: 'blue'
					});				
				}
			} else {
				World.msgPlayer(player, {
					msg: 'That is not a known spell.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(player, {
				msg: 'Cast what?'
			});
		}
	} else {
		World.msgPlayer(player, {
			msg: 'You cannot use magic while asleep.'
		});
	}
};

// For attacking in-game monsters
Cmd.prototype.kill = function(player, command, roomObj, fn) {
	var roomObj,
	opponent;

	if (player.position !== 'sleeping' && player.position !== 'resting' && player.position !== 'fighting') {
		if (!roomObj) {
			roomObj = World.getRoomObject(player.area, player.roomid);
		}
		
		opponent = World.search(roomObj.monsters, command);

		if (opponent && opponent.roomid === player.roomid) {

			World.msgPlayer(player, {
				msg: '<strong class="grey large">You scream and charge at a ' + opponent.name + '!</strong>',
				noPrompt: true
			});

			World.msgPlayer(opponent, {
				msg: 'A ' + player.displayName + ' screams and charges at you!',
				noPrompt: true
			});
			
			Combat.processFight(player, opponent, roomObj);
		} else {
			opponent = World.search(roomObj.playersInRoom, command);

			if (opponent && opponent.roomid === player.roomid) {

				World.msgPlayer(player, {
					msg: 'You scream and charge at a ' + opponent.name,
					noPrompt: true
				});

				World.msgPlayer(opponent, {
					msg: 'A ' + player.displayName + ' screams and charges at you!',
					noPrompt: true
				});

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
	var roomObj,
	displayHTML,
	monster,
	itemDescription,	
	item,
	i = 0;

	if (!command || !command.roomObj) {
		roomObj = World.getRoomObject(target.area, target.roomid);
	} else {
		roomObj = command.roomObj;
	}
	
	if (target.sight) {
		if (target.position !== 'sleeping') {
			if (!command || command.msg === '' || !command.msg) {
				if (Character.canSee(target, roomObj)) {
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
	var roomObj,
	i = 0;

	if (target.position !== 'sleeping') {
		if (command.msg !== '') {
			World.msgPlayer(target, {
				msg: '<div class="cmd-say"><span class="msg-name">You say></span> ' + command.msg + '</div>'
			});
			
			if (!command.roomObj) {
				roomObj = World.getRoomObject(target.area, target.roomid);
			} else {
				roomObj = command.roomObj
			}
			
			World.msgRoom(roomObj, {
				msg: function(receiver, fn) {
					var msg;
	
					if (Character.canSee(receiver, roomObj)) {
						msg = '<div class="cmd-say"><span class="msg-name">' +
						target.displayName + ' says></span> ' + command.msg + '</div>';
					} else {
						msg = '<div class="cmd-say"><span class="msg-name">Someone says></span> ' + command.msg + '</div>';
					}

					return fn(true, msg);
				},
				playerName: target.name
			});

			if (target.onSay) {
				target.onSay(target, roomObj, command);
			}

			if (roomObj.onSay) {
				roomObj.onSay(target, roomObj, command);
			}

			for (i; i < roomObj.monsters.length; i += 1) {
				if (roomObj.monsters[i].onSay) {
					roomObj.monsters[i].onSay(target, roomObj, command);
				}
			}
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
			msg: '<span class="msg-name">You chat></span> ' + command.msg,
			styleClsss: 'cmd-chat'
		});

		World.msgWorld(target, {
			msg: '<div class="cmd-chat"><span class="msg-name">' + target.displayName + '></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	} else {
		World.msgPlayer(target, {
			msg: 'To send a message to everyone on the game use <strong>chat [message]</strong>. ' 
				+ 'To learn more about communication try <strong>help communication</strong>',
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

Cmd.prototype.quit = function(target, command) {
	if (target.isPlayer) {
		if (target.position !== 'fighting' && target.wait === 0) {
			target.logged = false;
			target.verifiedName = false;
			target.verifiedPassword = false;
			
			Character.save(target, function() {
				World.msgPlayer(target, {
					msg: 'Add a little to a little and there will be a big pile.',
					evt: 'onDisconnect',
					styleClass: 'logout-msg',
					noPrompt: true
				});

				target.socket.leave('mud');
				target.socket.disconnect();
			});
		} else {
			if (target.position === 'fighting') {
				World.msgPlayer(target, {
					msg: 'You are fighting! Finish up before quitting.',
					styleClass: 'logout-msg'
				});
			} else {
				World.msgPlayer(target, {
					msg: 'You can\'t quit just yet!',
					styleClass: 'error'
				});
			}
		}
	}
};

/** Related to Saving and character adjustment/interaction **/
Cmd.prototype.train = function(target, command) {

};

Cmd.prototype.practice = function(target, command) {
	var	pracSkill = function() {
		if (!skillObj.learned) {
			skillObj.learned = true;
		}		

		if (skillObj.train < 100) {
			if (skillObj.mainStat === target.mainStat) {
				cost -= 1;
			}

			if (target.trains >= cost) {
				skillObj.train += World.dice.roll(1, 3, intMod);
				
				if (skillObj.train > 100) {
					skillObj.train = 100;

					if (target.onSkillMastery) {
						target.onSkillMastery(skillObj, trainer);
					}

					if (trainer.onTrainMastery) {
						trainer.onTrainMastery(skillObj, trainer);	
					}
				}

				if (trainer.onTrain) {
					trainer.onTrain(target, skillObj);
				}

				if (!trainer.trainMsg) {
					if (trainer.long) {
						World.msgPlayer(target, {
							msg: trainer.long + ' trains you in the art of ' +
								skillObj.display + '.',
							styleClass: 'green'
						});
					} else {
						World.msgPlayer(target, {
							msg: trainer.displayName + ' trains you in the art of '
								+ skillObj.display + '.',
							styleClass: 'green'
						});
					}
				} else {
					World.msgPlayer(target, {
						msg: trainer.trainMsg,
						styleClass: 'green'
					});
				}

				World.msgRoom(roomObj, {
					msg: trainer.long + ' trains ' + target.displayName  + ' in the art of ' +
						skillObj.display + '.',
					styleClass: 'green',
					playerName: target.name
				});
			}
		} else {
			if (!trainer.onSkillMaster) {
				World.msgPlayer(target, {
					msg: 'You are already a master of ' + skillObj.display + '.',
					styleClass: 'error'
				});
			} else {
				trainer.onSkillMaster(target, skillObj, trainerSkillObj);
			}
		}
	},
 	roomObj = World.getRoomObject(target.area, target.roomid),
	trainers = Room.getTrainers(roomObj, command),
	trainer,
	trainerSkillObj,
	practiceDisplay = '',
	i = 0,
	cost = 5,
	skillObj,
	canTrain = true,
	canSee = Character.canSee(target, roomObj),
	intMod = World.dice.getIntMod(target);
	
	if (target.position !== 'sleeping') {
		if (canSee) {
			if (trainers.length) {
				trainer = trainers[0];
		
				if (command.arg) {
					trainerSkillObj = Character.getSkill(trainer, command.arg);				
					skillObj = Character.getSkill(target, command.arg);
					
					if (trainer.beforeTrain) {
						canTrain = trainer.beforeTrain(target, trainerSkillObj, skillObj);
					}	
					
					if (canTrain) {
						if (trainerSkillObj && skillObj && skillObj.learned) {
							pracSkill();
						} else {
							if (skillObj) {
								pracSkill();
							} else {
								World.msgPlayer(target, {
									msg: 'You don\'t know how to ' + command.arg + '.',
									styleClass: 'error'
								});
							}
						}
					}
				} else {
					practiceDisplay = '<p>The table below showcases the <strong>skills currently known by '
						+ trainer.displayName + '</strong></p><table class="table table-condensed prac-table">'
						+ '<thead><tr><td class="prac-name-header yellow"><strong>' + trainer.displayName +  ' Skills</strong></td>'
						+ '<td class="prac-max-header yellow"><strong>Practice Status</strong></td>'
						+ '</tr></thead><tbody>';

					for (i; i < trainer.skills.length; i += 1) {
						if (trainer.skills[i].prerequisites.level <= trainer.level) {
							skillObj = Character.getSkillById(target, trainer.skills[i].id);

							practiceDisplay += '<tr><td class="prac-skill">'
								+ trainer.skills[i].display + '</td>';

							if (!skillObj) {
								practiceDisplay += '<td class="prac-known blue">Unknown skill</td>';
							} else {
								if (!Character.meetsSkillPrepreqs(target, skillObj)) {
									practiceDisplay += '<td class="prac-known red">Unmet prerequisites</td>';
								} else {
									if (trainer.skills[i].train >= skillObj.train || trainer.maxTrain) {
										practiceDisplay += '<td class="prac-known green">Trainable</td>';
									} else {
										practiceDisplay += '<td class="prac-known">Already have superior knowledge</td>';
									}
								}
							}

							practiceDisplay += '</tr>';
						}
					}
							
					World.msgPlayer(target, {
						msg: practiceDisplay + '</tbody></table>'
					});
				}
			} else {
				if (roomObj.monsters || roomObj.playersInRoom) {
					World.msgPlayer(target, {
						msg: 'No one here is offering training.',
						styleClass: 'error'
					});
				} else {
					World.msgPlayer(target, {
						msg: 'There is no one here to train with.',
						styleClass: 'error'
					});
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t see anyone to train with!',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: '<strong>You can\'t train while sleeping!</strong>',
			styleClass: 'error'
		});
	} 
};

Cmd.prototype.save = function(target, command) {
	if (target.isPlayer) {
		if (target.position === 'standing' && target.wait === 0) {
			Character.save(target, function() {
				World.msgPlayer(target, {
					msg: target.displayName + ' was saved. Whew!',
					styleClass: 'save green'
				});
			});
		} else if (target.position !== 'standing') {
			World.msgPlayer(target, {
				msg: 'You can\'t save while ' + target.position + '.',
				styleClass: 'save'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t save just yet!',
				styleClass: 'error'
			});
		}
	}
};

Cmd.prototype.title = function(target, command) {
	if (command.msg.length < 40) {
		if (command.msg != 'title') {
			target.title = command.msg;
		} else {
			target.title = ' a level ' + target.level + ' ' + target.race + ' ' + target.charClass;
		}

		World.msgPlayer(target, {
			msg: 'Your title was changed!',
			styleClass: 'save'
		});
	} else {
		World.msgPlayer(target, {
			msg: 'Title is too long. There is a 40 character limit.',
			styleClass: 'save'
		});
	}
};

// View equipment
Cmd.prototype.equipment = function(target, command) {
	var eqStr = '',
	item,
	i = 0;
	
	for (i; i < target.eq.length; i += 1) {
		if (target.eq[i].item) {
			item = Character.getItemByRefId(target, target.eq[i].item);
		} else {
			item = false;
		}

		eqStr += '<li class="eq-slot-' + target.eq[i].slot.replace(/ /g, '') + 
			'"><label>' + target.eq[i].name + '</label>: ';
		
		if (!item || target.eq[i].item === '') {
			eqStr += ' Nothing</li>';
		} else {
			if (!item.light) {
				eqStr += '<label class="yellow">' + item.displayName + '</label></li>';
			} else {
				if (item.lightDecay > 0) {
					eqStr += '<label class="yellow">' + item.displayName
						+ ' (<span class="red">Providing light</span>)</label></li>';
				} else {
					eqStr += '<label class="yellow">' + item.displayName
						+ ' (<span class="red">Not providing light</span>)</label></li>';
				}
			}
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
	skillObj,
	learnedStatus,
	i = 0,
	skillLevel = 1,
	trainedLevel,
	skillId;
	
	if (target.skills) {
		for (i; i < target.skills.length; i += 1) {
			skillObj = target.skills[i];
			
			if (skillObj.learned) {
				learnedStatus = 'a <strong>learned</strong>';
				trainedLevel = '<strong class="yellow">(' + skillObj.train + '%)</strong>';
			} else {
				learnedStatus = 'an unpracticed';
			}

			if (skillObj.prerequisites.level) {
				skillLevel = skillObj.prerequisites.level; 
			}

			skills += '<li><strong>' + skillObj.display + '</strong> ' + learnedStatus  + ' ' +  skillObj.type
				+ ' skill at  level ' + skillLevel + '.';
				
			if (trainedLevel) {
				skills += trainedLevel;
			}
		}

		skills = '<ul class="list">' + skills + '</ul>';
		
		World.msgPlayer(target, {msg: skills, styleClass: 'eq' });
	} else {
		World.msgPlayer(target, {msg: 'What skills?', styleClass: 'error' });
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
						msg: 'You can\'t figure out how to wear a ' + item.short,
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

			iStr += '<td class="i-type">' + player.items[i].itemType + '</td>'
				+ '<td class="i-weight">' + player.items[i].weight + '</td></tr>';
		}

		if (player.level <= 2) {
			iStr = '<p><strong class="red">NEWBIE TIP:</strong> You can see the items below on your person. '
				+ 'Type <strong>eq</strong> or <strong>equipment</strong> to see worn equipment and empty slots.</p>'
				+ iStr;
		}

		World.msgPlayer(player, {
			msg: '<h1>Your Inventory</h1>'
				+ iStr + '</tbody></table>'
		});
	} else {
		World.msgPlayer(player, {
			msg: 'No items in your inventory, can carry ' + player.carry + ' pounds of items and treasure.'
		});
	}
};

Cmd.prototype.score = function(target, command) {
	var score = '<div class="row score"><div class="col-md-12"><h1>' + 
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
					'<li class="stat-str first"><label>STR:</label> ' + target.baseStr + ' (' + target.str + ')</li>' +
					'<li class="stat-wis"><label>WIS:</label> ' + target.baseWis + ' (' + target.wis + ') </li>' +
					'<li class="stat-int"><label>INT:</label> ' + target.baseInt + ' (' + target.int + ')</li>' +
					'<li class="stat-dex"><label>DEX:</label> ' + target.baseDex + ' (' + target.dex + ')</li>' +
					'<li class="stat-con"><label>CON:</label> ' + target.baseCon + ' (' + target.con + ')</li>' +
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
						'<li class="stat-hitroll"><label>Hit Bonus: </labels> ' + target.hitRoll + '</li>' +
						'<li class="stat-damroll"><label>Damage Bonus: </label> ' + target.damRoll + '</li>' +
						'<li class="stat-magicRes"><label>Magic resistance: </label> ' + target.magicRes + '</li>' +
						'<li class="stat-meleeRes"><label>Melee resistance: </label> ' + target.meleeRes + '</li>' +
						'<li class="stat-poisonRes"><label>Poison resistance: </label> ' + target.poisonRes + '</li>' +
						'<li class="stat-detection"><label>Detection: </label> ' + target.detection + '</li>' +
						'<li class="stat-knowlege"><label>Knowledge: </label> ' + target.knowledge + '</li>' +
					'</ul>' +
					'<div class="col-md-3 score-affects">' +
						'<h6 class="sans-serif">Affected by:</h6>' +
						'<p>You don\'t feel affected by anything.</p>' +
					'</div>' +
				'</div>' +
				'<ul class="col-md-12 list-unstyled">' +
					'<li class="stat-position">You are currently <span class="green">' + target.position + '</span></li>' +
					'<li class="stat-level">You are a level ' + target.level + ' ' + target.race + ' '
						+  target.charClass + ' of ' + target.size.display + ' size.</li>' +
					'<li class="stat-carry">You are carrying ' + target.weight + '/' + target.maxWeight + ' pounds.</li>' +
					'<li class="stat-xp">You need <strong>' + (target.expToLevel - target.exp)
						+ '</strong> experience for your next level.</li>' +
					'<li class="stat-killcnt last">You have won ' + target.killed + ' battles.</li>' +
				'</ul>' +
			'</div>'
		'</div></div>';
	
	World.msgPlayer(target, {
		msg: score
	});
};

Cmd.prototype.help = function(target, command) {
	if (!command.msg) {
		command.msg = 'help';
	}

	fs.readFile('./help/' + command.msg.replace(/ /g, '_') + '.html', 'utf8', function (err, data) {
		if (!err) {
			World.msgPlayer(target, {msg: data, noPrompt: command.noPrompt, styleClass: 'cmd-help' });
		} else {
			World.msgPlayer(target, {msg: 'No help file found.', noPrompt: command.noPrompt, styleClass: 'error' });
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

