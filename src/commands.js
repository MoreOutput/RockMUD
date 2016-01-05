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
players = World.players,
time = World.time,
areas = World.areas,

Cmd = function () {};

Cmd.prototype.fire = function(commandName, target, command, fn) {
	return this[commandName](target, command, fn);
};

// Puts any target object into a defined room after verifying criteria
Cmd.prototype.move = function(target, command, fn) {
	var world = this,
	direction = command.msg,
	dexMod = World.dice.getDexMod(target);

	if (target.position === 'standing' || target.position 
		=== 'fleeing' && target.cmv > (4 - dexMod) && target.wait === 0) {

		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			Room.checkExit(roomObj, direction, function(exitObj) {
				if (exitObj) {
					if (!exitObj.area) {
						exitObj.area = roomObj.area;
					}

					Room.getDisplay(exitObj.area, exitObj.id, function(displayHTML, targetRoom) {
						Room.checkExitCriteria(target, targetRoom, function(clearToMove) {
							Room.checkEntranceCriteria(target, targetRoom, function(clearToMove) {
								/*
								World.checkEntranceEvents(targetRooom, function() {
									World.checkEvent('onExit', targetRoom, function() {

									});
								});
								*/

								if (clearToMove) {
									World.dice.roll(1, 4, function(moveRoll) {
										target.cmv -= Math.round(4 + moveRoll - dexMod);

										if (target.cmv < 0) {
											target.cmv = 0;
										}

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

											Room.removePlayer(roomObj, target, function(roomObj, target) {
												targetRoom.playersInRoom.push(target);
											});
										} else {
											Room.removeMob(roomObj, target, function(roomObj, target) {
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

									if (target.cmv < 0) {
										target.cmv = 0;
									}

									if (typeof fn === 'function') {
										return fn(true, roomObj, targetRoom);
									}
								}
							});
						});
					});
				} else {
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
	if (command.msg !== '') {
		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			var i = 0,
			item,
			itemLen;

			if (command.msg !== 'all') {
				World.search(roomObj.items, command, function(item) {
					if (item) {
						Room.removeItem(roomObj, item, function(roomObj, item) {
							Character.addToInventory(target, item, function(target, item) {
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
							});
						});
					} else {
						World.msgPlayer(target, {msg: 'That item is not here.', styleClass: 'error'});

						if (typeof fn === 'function') {
							return fn(target, roomObj, false);
						}
					}
				});
			} else {
				itemLen = roomObj.items.length;

				for (i; i < itemLen; i += 1) {
					if (i === 0) {
						item = roomObj.items[i];
					} else {
						item = roomObj.items[i - 1];
					}

					Room.removeItem(roomObj, item, function(roomObj, item) {
						Character.addToInventory(target, item, function(target, item) {
							if (i === itemLen - 1) {
								World.msgRoom(roomObj, {
									msg: target.displayName + ' picks up everything he can.',
									playerName: target.name,
									styleClass: 'cmd-get-all yellow'
								});

								World.msgPlayer(target, {
									msg: 'You grab everything',
									styleClass: 'cmd-get-all blue'
								});

								if (typeof fn === 'function') {
									return fn(target, roomObj, item);
								}
							}
						});
					});
				}
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Get what? Specify a target or try get all.', styleClass: 'error'});

		if (typeof fn === 'function') {
			return fn(target, roomObj, item);
		}
	}
};

Cmd.prototype.drop = function(target, command, fn) {
	if (command.msg !== '' && target.items.length !== 0) {
		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			var i = 0,
			itemLen,
			itemArr,
			item;

			if (command.msg !== 'all') {
				World.search(target.items, command, function(item) {
					if (item) {
						Character.removeItem(target, item, function(target, item) {
							if (item) {
								Room.addItem(roomObj, item, function(roomObj, item) {

									World.msgRoom(roomObj, {
										msg: target.displayName + 'drops a ' + item.short,
										playerName: target.name,
										styleClass: 'cmd-drop yellow'
									});

									World.msgPlayer(target, {
										msg: 'You drop a ' + item.short,
										styleClass: 'cmd-drop blue'
									});
								});
							} else {
								World.msgPlayer(target, {msg: 'Could not drop a ' + item.short, styleClass: 'error'});
							}
						});
					} else {
						World.msgPlayer(target, {msg: 'You do not have that item.', styleClass: 'error'});
					}
				});
			} else {
				itemLen = target.items.length;
				itemArr = target.items;

				for (i; i < itemLen; i += 1) {
					item = itemArr[i];
					
					Character.removeItem(target, item, function(target, item) {
						if (item) {
							Room.addItem(roomObj, item, function(roomObj, item) {
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
							});
						} else {
							World.msgPlayer(target, {msg: 'Could not drop a ' + item.short, styleClass: 'error'});
						}
					});
				}
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Drop nothing? How do you drop nothing?', styleClass: 'error'});
	}
};

Cmd.prototype.flee = function(player, command) {
	var cmd = this;

	if (player.opponent) {
		World.dice.roll(1, 20, World.dice.getDexMod(player), function(fleeCheck) {
			if (fleeCheck > 10 && player.wait === 0) {
				player.position = 'fleeing';
				player.opponent.position = 'standing';

				if (!command.msg) {
					command.msg = 'south';
				}

				cmd.move(player, command, function() {
					player.wait += 1;
					
					player.position = 'standing';

					World.msgPlayer(player.opponent, {msg: '<p>' + player.displayName + ' fled south!</p>', styleClass: 'grey'});
					World.msgPlayer(player, {msg: '<p>You fled south!</p>', styleClass: 'grey'});
				});
			} else {
				player.wait += 1;
				player.position = 'fighting';

				World.msgPlayer(player, {msg: 'You try to flee and fail!', styleClass: 'green'});
			}
		});
	}
};

// For attacking in-game monsters
Cmd.prototype.kill = function(player, command) {
	if (player.position !== 'sleeping' && player.position !== 'resting') {
		World.getRoomObject(player.area, player.roomid, function(roomObj) {
			World.search(roomObj.monsters, command, function(opponent) {
				if (opponent && opponent.roomid === player.roomid) {
					opponent.position = 'fighting';
					player.position = 'fighting';

					opponent.opponent = player;
					player.opponent = opponent;

					World.msgPlayer(player, {
						msg: 'You scream and charge at a ' + opponent.name,
						noPrompt: true
					});

					Combat.round(player, opponent, roomObj, function(player, opponent, roomObj) {
						var combatInterval;
						player.wait += 2;

						World.prompt(player);

						if (opponent.chp > 0) {
							combatInterval = setInterval(function() {
								World.getRoomObject(player.area, player.roomid, function(roomObj) {
									Combat.round(player, opponent, roomObj, function(player, opponent, roomObj) {
										Combat.round(opponent, player, roomObj, function(opponent, player, roomObj) {
											if (player.position !== 'fighting' || opponent.position !== 'fighting') {
												World.prompt(player);
												clearInterval(combatInterval);
											} else {
												if (opponent.chp <= 0) {
													clearInterval(combatInterval);

													opponent.position = 'dead';
													opponent.opponent = null;
													opponent.killed = player.name;

													player.opponent = null;
													player.position = 'standing';

													Room.removeMob(roomObj, opponent, function(roomObj, opponent) {
														World.dice.calXP(player, opponent, function(earnedXP) {
															Room.addCorpse(roomObj, opponent, function(roomObj, corpse) {
																player.xp += earnedXP;
																player.position = 'standing';
																
																if (player.wait > 0) {
																	player.wait -= 1;
																} else {
																	player.wait = 0;
																}

																if (earnedXP > 0) {
																	World.msgPlayer(player, {msg: 'You won the fight! You learn some things, resulting in ' + earnedXP + ' experience points.', styleClass: 'victory'});
																} else {
																	World.msgPlayer(player, {msg: 'You won but learned nothing.', styleClass: 'victory'});
																}
															});
														});
													});
												} else if (player.chp <= 0 || player.position === 'dead') {
													clearInterval(combatInterval);
													// Player Death
													opponent.position = 'standing';
													opponent.chp = opponent.hp;
													opponent.opponent = null;

													player.position = 'standing';
													player.chp = player.hp;
													player.opponent = null;

													World.msgPlayer(player, {msg: 'You should be dead, but since this is unfinished we will just reset everything.', styleClass: 'victory'});
												} else {
													World.prompt(player);
												}
											}
										});
									});
								});
							}, 1900);
						}
					});
				} else {
					World.msgPlayer(player, {msg: 'There is nothing by that name here.', styleClass: 'error'});
				}
			});
		});
	} else {
		World.msgPlayer(player, {msg: 'Hard to do that from this position.', styleClass: 'combat-death'});
	}
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
		World.getRoomObject(target.area, target.roomid, function(roomObj) {
			World.search(roomObj.items, command, function(item) {
				if (item) {
					World.msgPlayer(target, {
						msg: item.long,
						styleClass: 'cmd-look'
					});
				} else {
					 World.search(roomObj.monsters, command, function(monster) {
						if (monster) {
							World.msgPlayer(target, {
								msg: monster.long,
								styleClass: 'cmd-look'
							});
						} else {
							 World.search(target.items, command, function(item) {
								if (item) {
									return World.msgPlayer(target, {
										msg: item.long,
										styleClass: 'cmd-look'
									});
								} else {
									return  World.msgPlayer(target, {msg: 'You do not see that here.', styleClass: 'error'});
								}
							});
						}
					});
				}
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

	return World.msgPlayer(target, r);
};


/** Communication Channels **/
Cmd.prototype.say = function(target, command) {
	World.msgPlayer(target, {
		msg: '<div class="cmd-say"><span class="msg-name">You say></span> ' + command.msg + '</div>'
	});

	World.getRoomObject(target.area, target.roomid, function(roomObj) {
		World.msgRoom(roomObj, {
			msg: '<div class="cmd-say"><span class="msg-name">' + target.displayName + ' says></span> ' + command.msg + '</div>',
			playerName: target.name
		});
	});
};

Cmd.prototype.yell = function(target, command) {
	World.msgPlayer(target, {
		msg: '<div class="cmd-yell"><span class="msg-name">You yell></span> ' + command.msg + '</div>'
	});
	
	World.msgArea(target.area, {
		msg: '<div class="cmd-yell"><span class="msg-name">' + target.displayName + ' yells></span> ' + command.msg + '</div>',
		playerName: target.name
	});
};


Cmd.prototype.chat = function(target, command) {
	World.msgPlayer(target, {
		msg: '<div class="cmd-chat"><span class="msg-name">You chat></span> ' + command.msg + '</div>'
	});

	World.msgWorld(target, {
		msg: '<div class="cmd-chat"><span class="msg-name">' + target.displayName + '></span> ' + command.msg + '</div>',
		playerName: target.name
	});
};

Cmd.prototype.tell = function(target, command, fn) {
	if (command.msg) {
		World.getPlayerByName(command.msg, function(player) {
			if (player) {
				World.msgPlayer(player, {
					msg: '<strong>' + player.displayName + ' tells you></strong> ' + command.msg,
					styleClass: 'red'
				}, function() {
					target.reply = player.name;

					return fn(target, player);
				});

				World.msgPlayer(target, {msg: 'You tell ' + target.displayName + '> ' + command.msg, styleClass: 'cmd-say red'});
			} else {
				World.msgPlayer(target, {msg: 'You do not see that person.', styleClass: 'error'});
			}
		});
	} else {
		return World.msgPlayer(target, {msg: 'Tell who?', styleClass: 'error'});
	}
};

Cmd.prototype.reply = function(target, command) {
	if (command.msg && target.reply) {
		World.getPlayerByName(target.reply, function(player) {
			if (player) {
				World.msgPlayer(player, {
					msg: '<strong>' + player.displayName + ' replies></strong> ' + command.msg,
					styleClass: 'red'
				}, function() {
					target.reply = player.name;

					return fn(target, player);
				});

				World.msgPlayer(target, {msg: 'You reply ' + target.displayName + '> ' + command.msg, styleClass: 'cmd-say red'});
			} else {
				World.msgPlayer(target, {msg: 'They arent there anymore.', styleClass: 'error'});
			}
		});
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

Cmd.prototype.remove = function(target, command) {
	if (command.msg !== '') {
		Character.getItem(target.eq, command, function(item) {
			if (item) {
				Character.removeEq(target, item, function(target, item) {
					if (item) {
						World.msgPlayer(target, {msg: 'Removed a ' + item.short, styleClass: 'cmd-wear'});
					} else {
						World.msgPlayer(target, {msg: 'Could not remove a ' + item.short, styleClass: 'error'});
					}
				});
			} else {
				World.msgPlayer(target, {msg: 'You are not wearing that.', styleClass: 'error'});
			}
		});
	} else {
		World.msgPlayer(target, {msg: 'Remove what?', styleClass: 'error'});
	}
}

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

Cmd.prototype.score = function(target, command, fn) {
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
					'<li class="stat-level">You are a level ' + target.level + ' ' + target.race + ' '+  target.charClass + '.</li>' +
					'<li class="stat-carry">You are carrying ' + target.weight + '/' + target.maxWeight + ' pounds.</li>' +
					'<li class="stat-xp">You need <strong>' + target.xp + '</strong> experience for your next level.</li>' +
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

	fs.readFile('./help/' + command.msg + '.json', function (err, data) {
		var helpTxt = '';
		if (!err) {
			data = JSON.parse(data);

			helpTxt = '<h2>Help: ' + data.name + '</h2> ' + data.description + 
			'<p class="small">Related: '+ data.related.toString().replace(/,/g, ', ') + '</p>';

			World.msgPlayer(target, {msg: helpTxt, styleClass: 'cmd-help' });
		} else {
			World.msgPlayer(target, {msg: 'No help file found.', styleClass: 'error' });
		}
	});
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
Cmd.prototype.restore = function(target, command) {
	var i = 0,
	s;

	if (target.role === 'admin') {
		for (i; i < World.players.length; i += 1) {
			s = World.io.sockets.connected[World.players[i].sid];
			s.player.chp = s.player.hp;
			s.player.cmana = s.player.mana;
			s.player.cmv = s.player.mv;
		}

		World.msgWorld(target, {msg: 'You feel refreshed!'});
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
