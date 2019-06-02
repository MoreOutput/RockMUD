/*
* All non-combat commands that one would consider 'general' to a all
* users (like get, look, and movement). Anything combat (even potentially) related is in skills.js
* the actual combat loop is in combat.js.
* 
* Events fired on particular commands are also triggered here; for example onEnter, onLeave
*/
'use strict';
var fs = require('fs'),
util = require('util'),
World = require('../world'),
players = World.players,
time = World.time,
areas = World.areas,

Cmd = function () {};

/*
	command object = {
		cmd: cmdArr[0].toLowerCase(), // {cast} detect hidden player
		msg: cmdArr.slice(1).join(' '), // cast {detect hidden player}
		arg: cmdArr[1].toLowerCase(), // cast {detect hidden} player
		input: cmdArr.slice(2).join(' '), // cast detect hidden {player}
		last: // cast detect hidden {player} -- always the last word
		second: command.arg.split(' ')[0] // the second word // cast {{ detect }} hidden player
		number: 1, // argument target -- cast detect hidden 2.player
	};
*/
Cmd.prototype.createCommandObject = function(resFromClient) {
	var cmdArr = resFromClient.msg.split(' '),
	cmdObj = {};

	if (cmdArr.length === 1) {
		cmdArr[1] = '';
	}

	if (/[`~@#$%^&*()-+={}[]|<>]+$/g.test(resFromClient.msg) === false) {
		cmdObj.cmd = cmdArr[0];
		cmdObj.msg = cmdArr.slice(1).join(' ');
		cmdObj.last = cmdArr[cmdArr.length - 1].toLowerCase();
		cmdObj.number = 1;

		if (cmdArr.length < 4) {
			if (cmdArr.length === 3) {
				cmdObj.arg = cmdArr[1].toLowerCase();
				cmdObj.input = cmdArr[2].toLowerCase();
			} else if (cmdArr.length === 2) {
				cmdObj.arg = cmdArr[1].toLowerCase();
				cmdObj.input = cmdObj.msg;
			}
		} else {
			cmdObj.arg = cmdArr[1].toLowerCase() + ' ' + cmdArr[2].toLowerCase(),
			cmdObj.input = cmdArr.slice(3).join(' ')
		}

		if (cmdObj.input && !isNaN(parseInt(cmdObj.input[0]))
			|| (!cmdObj.input && !isNaN(parseInt(cmdObj.msg[0]))) ) {

			cmdObj.arg = cmdObj.arg.replace(/.*[.]/g, '');
			cmdObj.number = parseInt(cmdObj.last[0]);

			if (!cmdObj.input) {
				cmdObj.msg = cmdObj.msg.replace(/^[0-9][.]/, '');
			} else {
				cmdObj.input = cmdObj.input.replace(/^[0-9][.]/, '');
			}
		}

		if (cmdObj.arg.indexOf(' ') !== -1) {
			cmdObj.second = cmdObj.arg.split(' ')[0];
		} else {
			cmdObj.second = cmdObj.arg;
		}
	}

	console.log(cmdObj);

	return cmdObj;
};

Cmd.prototype.whizinvis = function(target, command) {
	World.addAffect(target, {
		id: 'whizinvis',
		affect: 'invis',
		display: 'Admin Invisiblity',
		caster: target.refId,
		modifiers: null,
		decay: -1
	});
};

Cmd.prototype.buy = function(target, command) {
	var i = 0,
	roomObj,
	item,
	canBuy = true,
	merchant;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (target.position === 'standing' || target.position === 'resting') {
		merchant = World.room.getMerchants(roomObj)[0];

		if (merchant) {
			if (merchant.beforeSell) {
				canBuy = World.processEvents('beforeSell', merchant, roomObj, target);
			}

			if (canBuy) {
				item =  World.character.getItem(merchant, command);

				if (item) {
					if (item.value <= target.gold) {
						target.gold -= item.value;
						merchant.gold += item.value;

						World.character.removeItem(merchant, item);

						World.character.addItem(target, item);
					
						World.msgPlayer(target, {
							msg: 'You buy ' + item.short
						});

						World.processEvents('onSell', merchant, roomObj, target);
						World.processEvents('onBuy', target, roomObj, merchant);
					} else {
						World.msgPlayer(target, {
							msg: 'You can\'t afford that.',
							styleClass: 'warning'
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
		if (target.position === 'sleep') {
			World.msgPlayer(target, {
				msg: 'Wake up first.'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You cannot buy anything while in this position.'
			});
		}
	}
};

Cmd.prototype.sell = function(target, command) {
	var i = 0,
	roomObj,
	item,
	merchant;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (target.position === 'standing') {
		merchant = World.room.getMerchants(roomObj)[0];
		
		if (merchant) {
			item =  World.character.getItem(target, command);

			if (item) {
				if (item.value <= merchant.gold) {
					merchant.gold -= item.value - 5;
					target.gold += item.value - 5;

					World.character.removeItem(target, item);

					World.character.addItem(merchant, item);
					
					World.msgPlayer(target, {
						msg: 'You sell ' + item.short,
						styleClass: 'green'
					});

					World.processEvents('onSell', target, roomObj, merchant);
					World.processEvents('onBuy', merchant, roomObj, target);
				} else {
					World.msgPlayer(target, {
						msg: 'They can\'t afford to buy ' + item.short,
						styleClass: 'yellow'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: marchant.displayName + ' doesn\'t seem to recognize the name.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'There doesn\'t seem to be a merchant here by that name.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You should be standing if you intend to sell something.',
			styleClass: 'error'
		});
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
			merchant = World.room.getMerchants(roomObj)[0];

			if (merchant) {
				if (merchant.items.length > 0) {
					for (i; i < merchant.items.length; i += 1) {
						storeDisplay += '<li>' + merchant.items[i].name  +
						' <span class="warning">(' + merchant.items[i].value + 'gp)</span></li>';
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

// Genric command for giving items or gold
Cmd.prototype.give = function(target, command) {
	var i = 0,
	roomObj,
	item,
	canSee = true,
	goldToTransfer = 0,
	receiver;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (target.position === 'standing' || target.position === 'resting') {
		if (command.msg) {
			if (command.msg.indexOf(' ' + World.config.coinage) === -1) {
				if (canSee) {
					receiver = World.room.getEntity(roomObj, {
						arg: command.input,
						input: command.arg
					});

					if (receiver) {
						item = World.character.getItem(target, command);

						if (item) {
							World.character.removeItem(target, item);

							World.character.addItem(receiver, item);

							World.msgPlayer(target, {
								msg: 'You give ' + item.short + ' to ' + receiver.displayName + '.',
								styleClass: 'green'
							});

							if (receiver.isPlayer) {
								World.msgPlayer(receiver, {
									msg: target.displayName + ' gives you ' + item.short + '.',
									styleClass: 'green'
								});
							}

							World.msgRoom(roomObj, {
								msg: 'roomMsg',
								styleClass: 'grey',
								playerName: [receiver.name, target.name]
							});
							
							if (receiver.onNewItem) {
								World.processEvents('onNewItem', receiver, roomObj, item, target);
							}
						} else {
							World.msgPlayer(target, {
								msg: 'You don\'t have an item by that name.',
								styleClass: 'error'
							});
						}
					} else {
						World.msgPlayer(target, {
							msg: 'You don\'t see anyone by that name.',
							styleClass: 'error'
						});
					}
				}
			} else if (!Number.isNaN(parseInt(command.second)) && (command.arg.indexOf(World.config.coinage) !== -1 || command.arg.indexOf('coin') !== -1)) {
				if (command.arg !== 'all') {
					goldToTransfer = parseInt(command.second);
				} else {
					goldToTransfer = target.gold;
				}

				if (goldToTransfer) {
					if (goldToTransfer <= target.gold) {
						if (command.input.indexOf('to') === -1) {
							command.input = command.input.replace(World.config.coinage, '').replace(/ /g, '');
						} else {
							command.input = command.input.replace(World.config.coinage + ' to', '').replace(/ /g, '');
						}

						receiver = World.room.getEntity(roomObj, {
							arg: command.input
						});

						if (receiver) {
							target.gold -= goldToTransfer;
							receiver.gold += goldToTransfer;

							World.msgPlayer(target,  {
								msg: 'You give ' + receiver.displayName + ' some ' + World.config.coinage + '.',
								styleClass: 'warning'
							});

							World.msgPlayer(receiver,  {
								msg: target.displayName + ' gives you ' + goldToTransfer + ' ' + World.config.coinage + 's.',
								styleClass: 'green'
							});

							if (receiver.onGoldReceived) {
								World.processEvents('onGoldReceived', receiver, roomObj, goldToTransfer, target);
							}
						}
					} else {
						World.msgPlayer(target,  {
							msg: 'That\'s more ' + World.config.coinage + ' than you have.',
							styleClass: 'error'
						});
					}
				} else {
					World.msgPlayer(target,  {
						msg: 'Not a valid number of ' + World.config.coinage  + '.',
						styleClass: 'error'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: 'Give what? Example: <strong>give sword elf</strong> OR <strong>give 100 coins elf</strong>',
					styleClass: 'error'
				});
			}
		}
	} else {
	
	}
};

Cmd.prototype.scan = function(target, command) { 
	var roomObj,
	rooms,
	i = 0,
	canSee = true,
	scanStr = '';

	if (target.position === 'standing') {
		if (command.roomObj) {
			roomObj = command.roomObj;
		} else {
			roomObj = World.getRoomObject(target.area, target.roomid);
		}

		canSee = World.character.canSee(target, roomObj);

		if (canSee) {
			rooms = World.room.getAdjacent(roomObj);

			for (i; i < rooms.length; i += 1) {
				scanStr += '<h4>' + rooms[i].direction.cmd + '</h4> ' + World.room.getBrief(rooms[i].room);
			}

			World.msgPlayer(target, {
				msg: scanStr
			});

			if (World.dice.roll(1, 10) < 4) {
				World.msgRoom(roomObj, {
					msg: target.displayName + ' scans the area.',
					playerName: target.name
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You can\'t see anything!',
				styleClass: 'error'
			});
		}
	} else {
		if (!target.fighting) {
			World.msgPlayer(target, {
				msg: 'You must be standing to scan the surrounding area.',
				styleClass: 'error'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You cannot scan while in combat!.',
				styleClass: 'error'
			});
		}
	}
};

Cmd.prototype.follow = function(target, command) {
	var roomObj = World.getRoomObject(target.area, target.roomid),
	entityToFollow,
	roomObj,
	canSee = World.character.canSee(target, roomObj);

	roomObj = command.roomObj;

	if (target.position === 'standing' && !target.following) {
		if (canSee) {
			entityToFollow = World.room.getPlayer(roomObj, command);

			if (!entityToFollow) {
				entityToFollow = World.room.getMonster(roomObj, command);
			}

			if (entityToFollow && !entityToFollow.noFollow) {
				entityToFollow.followers.push(target);
			
				target.following = entityToFollow;

				World.msgPlayer(entityToFollow, {
					msg: target.displayName + ' begins following you.'
				});

				World.msgPlayer(target, {
					msg: 'You begin following ' + entityToFollow.displayName + '.'
				});
			} else {
				World.msgPlayer(target, {
					msg: 'You dont see anything here by that name.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You don\'t see them here.'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You need to be standing if you want to follow something.'
		});
	}
};

Cmd.prototype.unfollow = function(target, command) {
	var i = 0;
 
	if (target.following) {
		for (i; i < target.following.followers.length; i += 1) {
			if (target.following.followers[i].refId === target.refId) {
				target.following.followers.splice(i, 1);
			}
		}

		target.following = '';

		World.msgPlayer(target, {
			msg: 'You are not longer following anyone.'
		});
	} else {
		target.following = '';

		World.msgPlayer(target, {
			msg: 'You are not following anyone at the moment.'
		});
	}
};

Cmd.prototype.group = function(target, command) {
	var roomObj = World.getRoomObject(target.area, target.roomid),
	entityJoiningGroup,
	leadMax = World.dice.getConMod(target) + 1,
	roomObj,
	i = 0,
	groupListStr = '',
	groupMemberIsInSameRoom = true,
	canSee = World.character.canSee(target, roomObj);

	roomObj = command.roomObj;

	if (command.arg) {
		if (target.position === 'standing' || target.position === 'resting') {
			if (target.followers.length) {
				entityJoiningGroup = World.room.getPlayer(roomObj, command);
				
				if (target.group.indexOf(entityJoiningGroup) === -1) {
					if (target.followers.indexOf(entityJoiningGroup) !== -1) {
						if (target.group.length < leadMax) {
							if (!entityJoiningGroup.noGroup) {
								if (canSee) {
									target.group.push(entityJoiningGroup);
									
									World.msgPlayer(entityJoiningGroup, {
										msg: target.displayName + ' groups up with you.'
									});

									World.msgPlayer(target, {
										msg: 'You group up with ' + entityJoiningGroup.displayName + '.'
									});

									if (entityJoiningGroup.group.indexOf(target) === -1) {
										entityJoiningGroup.group.push(target);
									}
								} else {
									World.msgPlayer(target, {
										msg: 'You don\'t see anyone by that name.',
										styleClass: 'error'
									});
								}
							 } else {
								World.msgPlayer(target, {
									msg: 'You can\'t group with ' + entityJoiningGroup.displayName + '.',
									styleClass: 'error'
								});
							 }
						} else {
							World.msgPlayer(target, {
								msg: 'You are not strong enough to head a larger party.'
							});
						}
					} else {
						World.msgPlayer(target, {
							msg: 'Theres nothing following you by that name.',
							styleClass: 'error'
						});
					}
				} else {
					World.character.ungroup(target, entityJoiningGroup);
					
					World.msgPlayer(target, {
						msg: 'You are no longer partied with ' + entityJoiningGroup.displayName + '.'
					});

					World.msgPlayer(entityJoiningGroup, {
						msg: 'You are no longer partied with ' + target.displayName + '.'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: 'Nothing seems to be following you.',
					styleClass: 'warning'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You are in no position to lead a group.'
			});
		}
	} else {
		if (target.group.length) {
			for (i; i < target.group.length; i += 1) {
				groupListStr += '<tr>'
					+ '<td>' + target.group[i].displayName + '</td>'
					+ '<td>' + target.group[i].level + '</td>'
					+ '<td>' + target.group[i].chp + '</td>';

					if (target.area === target.group[i].area && target.roomid === target.group[i].roomid) {
						groupListStr += '<td>' + target.group[i].position + '</td>';
					} else {
						groupListStr += '<td>Not here</td>';
					}

					groupListStr += '</tr>';
			}

			groupListStr = '<h2>Party List</h2>'
				+ '<table class="table table-condensed table-no-border who-list">'
				+ '<thead>'
					+ '<tr>'
						+ '<td width="5%">Name</td>'
						+ '<td width="5%">Level</td>'
						+ '<td width="15%">Hp</td>'
						+ '<td width="75%">Position</td>'
					+ '</tr>'
				+ '</thead><tbody>' + groupListStr + '</tbody>'
			+ '</table>';
		} else {
			groupListStr = 'Not currently in a group.';
		}

		World.msgPlayer(target, {
			msg: groupListStr
		});
	}
};

Cmd.prototype.emote = function(target, command) {
	var roomObj;

	if (!target.fighting && target.position === 'standing' || target.position === 'resting') {
		if (!command.roomObj) {
			roomObj = World.getRoomObject(target.area, target.roomid);
		} else {
			roomObj = command.roomObj;
		}

		World.msgRoom(roomObj, {
			msg: '<i>' +  target.displayName + ' ' + command.msg + '</i>',
			darkMsg: 'You sense some movement in the area.',
			styleClass: 'cmd-emote warning',
			checkSight: true,
			playerName: target.name // pass in players to omit
		});

		World.msgPlayer(target, {
			msg: '<i>' +  target.displayName + ' ' + command.msg + '</i>',
			styleClass: 'cmd-emote'
		});
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t emote right now.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.eat = function(target, command) {
	var roomObj,
	item;

	if (target.position === 'standing' || target.position === 'resting') {
		if (command.msg !== '') {
			roomObj = World.getRoomObject(target.area, target.roomid);

			item = World.search(target.items, command);

			if (item.itemType === 'food') {
				World.character.removeItem(target, item);

				World.character.reduceHunger(target, item);

				World.processEvents('onEat', item, roomObj, target);

				World.msgRoom(roomObj, {
					msg: target.displayName + ' eats a ' + item.short,
					playerName: target.name,
					styleClass: 'cmd-drop warning'
				});

				if (target.hunger !== 0) {
					World.msgPlayer(target, {
						msg: 'You eat a ' + item.short,
						styleClass: 'cmd-drop success'
					});
				} else {
					World.msgPlayer(target, {
						msg: 'You eat a ' + item.short + '. You are stuffed!',
						styleClass: 'cmd-drop success'
					});
				}
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
			msg: 'You can\'t eat while in this position.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.drink = function(target, command) {
	var roomObj,
	watersource,
	bottle;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (command.msg) {
		bottle = World.character.getBottle(target, command);

		if (bottle) {
			bottle.drinks -= World.dice.roll(1, 2);

			if (bottle.drinks <= 0) {
				bottle.drinks = 0;
			}

			if (bottle.drinks > 0) {
				World.character.reduceThirst(target, bottle);

				World.processEvents('onDrink', bottle, roomObj, target);

				World.msgRoom(roomObj, {
					msg: target.displayName + ' drinks from a ' + bottle.short,
					playerName: target.name,
					styleClass: 'cmd-drop warning'
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
			watersource = World.room.getWatersource(roomObj, command);

			if (!watersource) {
				World.msgPlayer(target, {
					msg: 'You can\'t drink something you dont have.',
					styleClass: 'error'
				});
			} else {
				watersource.drinks -= World.dice.roll(1, 2);

				World.character.reduceThirst(target, watersource);

				World.processEvents('onDrop', watersource, roomObj, target);

				World.msgPlayer(target, {
					msg: 'You drink from ' + watersource.short + '.',
					styleClass: 'success'
				});

				World.msgRoom(roomObj, {
					msg: target.displayName + ' drinks from a ' + watersource.short,
					playerName: target.name
				});
			}
		}
	} else {
		World.msgPlayer(target, {
			msg: 'Drink from what?',
			styleClass: 'error'
		});
	}
};

// replishing a watersource, only admins can fill room level watersource items
// watersources within a players inventory can be poured into one another
Cmd.prototype.fill = function(target, command) {
	var roomObj,
	toEmptyWatersource, // the item to be emptied, must also be a watersource
	toFillWatersource; // the item to be filled

	if (target.position === 'standing') {
		if (command.roomObj) {
			roomObj = command.roomObj;
		} else {
			roomObj = World.getRoomObject(target.area, target.roomid);
		}

		toFillWatersource = World.character.getBottle(target, command);

		if (toFillWatersource) {
			toEmptyWatersource = World.room.getWatersource(roomObj, command);

			if (!toEmptyWatersource) {
				// if no room level item was found to fill from try the characters inventory
				toEmptyWatersource = World.character.getBottle(target, command);
			}

			if (toEmptyWatersource) {
				toFillWatersource.drinks = toFillWatersource.maxDrinks;

				World.msgPlayer(target, {
					msg: 'You fill ' + toFillWatersource.short + ' to the brim.'
				});
			} else {
				World.msgPlayer(target, {
					msg: 'Theres nothing by that name around that can be used to fill ' + toFillWatersource.short,
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'It is impossible to fill something you do not have in your inventory...',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You cannot do that from this position. Try standing up first.'
		});
	}
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

			if (World.dice.roll(1, 4) === 1) {
				Character.save(target);
			}
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
			target.position = 'resting';

			World.msgPlayer(target, {
				msg: 'You try to make yourself comfortable and begin resting.',
				styleClass: 'cmd-rest'
			});

			if (command.roomObj) {
				roomObj = command.roomObj;
			} else {
				roomObj = World.getRoomObject(target.area, target.roomid);
			}

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

	if (target.position === 'standing' || target.position === 'resting') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		exitObj = World.room.getExit(roomObj, command.arg);

		if (exitObj && exitObj.door && !exitObj.isOpen) {
			targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

			targetExit = World.room.getAdjacentExit(targetRoom, exitObj, target);

			if (targetExit && !exitObj.locked) {
				exitObj.isOpen = true;
				targetExit.isOpen = true;

				World.msgPlayer(target, {
					msg: 'You open a ' + exitObj.name + ' ' + exitObj.cmd + ' from here.',
					styleClass: 'cmd-wake'
				});

				World.msgRoom(roomObj, {
					msg: target.displayName + ' opens a ' + exitObj.name + '.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});

				if (exitObj.openMsg) {
					World.msgPlayer(roomObj, {msg: exitObj.openMsg, styleClass: 'warning'});
				}

				World.msgRoom(targetRoom, {
					msg: 'A ' + exitObj.name + ' opens to the ' + targetExit.cmd +'.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});
			} else {
				World.msgPlayer(target, {msg: 'Appears to be locked.'});
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
		|| target.position === 'resting') {
		roomObj = World.getRoomObject(target.area, target.roomid);

		exitObj = World.room.getExit(roomObj, command.arg);

		if (exitObj && exitObj.door && exitObj.isOpen === true) {
			targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

			targetExit = World.room.getAdjacentExit(targetRoom, exitObj, target);

			if (targetExit && !exitObj.locked) {
				exitObj.isOpen = false;

				targetExit.isOpen = false;

				World.msgPlayer(target, {
					msg: 'You close a ' + exitObj.name + ' ' + exitObj.cmd + ' from here.',
					styleClass: 'cmd-wake'
				});

				if (exitObj.closeMsg) {
					World.msgPlayer(target, exitObj.closeMsg);
				}

				World.msgRoom(roomObj, {
					msg: target.displayName + ' closes a ' + exitObj.name + '.',
					playerName: target.name,
					styleClass: 'cmd-sleep'
				});

				World.msgRoom(targetRoom, {
					msg: 'A ' + exitObj.name + ' closes to the ' + targetExit.cmd +'.',
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
			|| target.position === 'resting') {
			
			roomObj = World.getRoomObject(target.area, target.roomid);

			exitObj = World.room.getExit(roomObj, command.arg);

			if (exitObj && exitObj.door && exitObj.locked === true) {
				targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

				targetExit = World.room.getAdjacentExit(targetRoom, exitObj, target);

				key = World.character.getKey(target, targetExit.key);
				
				if (key) {
					exitObj.locked = false;

					World.msgPlayer(target, {
						msg: 'You unlock the ' + exitObj.name + ' with a ' + key.short,
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
			|| target.position === 'resting') {
			
			roomObj = World.getRoomObject(target.area, target.roomid);
			exitObj = World.room.getExit(roomObj, command.arg);

			if (exitObj && exitObj.door && exitObj.locked === false) {
				targetRoom = World.getRoomObject(roomObj.area, exitObj.id);

				targetExit = World.room.getAdjacentExit(targetRoom, exitObj, target);

				key = World.character.getKey(target, targetExit.key);

				if (key) {
					if (exitObj.isOpen === true) {
						exitObj.isOpen = false;
					}

					exitObj.locked = true;

					World.msgPlayer(target, {
						msg: 'You lock the ' + exitObj.name + ' with a ' + key.short,
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

Cmd.prototype.recall = function(target, command) {
	var targetRoom,
	roomObj;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (!target.fighting && !roomObj.preventRecall) {
		if (!command.msg && target.recall.roomid && target.recall.area) {
			if (roomObj.area !== target.recall.area || roomObj.id !== target.recall.roomid) {
				targetRoom = World.getRoomObject(target.recall.area, target.recall.roomid);

				if (targetRoom) {
					target.area = target.recall.area;
					target.roomid = target.recall.roomid;

					if (target.isPlayer) {
						World.room.removePlayer(roomObj, target);

						targetRoom.playersInRoom.push(target);

						this.look(target, {roomObj: targetRoom});
					} else {
						World.room.removeMob(roomObj, target);

						targetRoom.monsters.push(target);
					}

					World.msgPlayer(target, {
						msg: '<strong>You have recalled to ' + target.recall.area  + '!</strong>',
						styleClass: 'green'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: '<strong>You are already there!</strong>',
					styleClass: 'error'
				});
			}
		} else if (command.msg && command.second === 'set' && !targetRoom.preventRecall) {
			target.recall.area = roomObj.area;
			target.recall.roomid = roomObj.id;

			World.msgPlayer(target, {
				msg: 'You will now recall to the current room!',
				styleClass: 'green'
			});
		} else if (!command.msg && target.recall.roomid && target.recall.area) {
			if (roomObj.area !== target.recall.area || roomObj.id !== target.recall.roomid) {
				targetRoom = World.getRoomObject(target.recall.area, target.recall.roomid);

				if (targetRoom) {
					target.area = target.recall.area;
					target.roomid = target.recall.roomid;

					if (target.isPlayer) {
						World.room.removePlayer(roomObj, target);

						targetRoom.playersInRoom.push(target);

						this.look(target, {roomObj: targetRoom});
					} else {
						World.room.removeMob(roomObj, target);

						targetRoom.monsters.push(target);
					}

					World.msgPlayer(target, {
						msg: '<strong>You have recalled to ' + target.recall.area  + '!</strong>',
						styleClass: 'green'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: '<strong>You are already there!</strong>',
					styleClass: 'error'
				});
			}
		} else if (command.msg && command.second === 'set' && !targetRoom.preventRecall) {
			target.recall.area = roomObj.area;
			target.recall.roomid = roomObj.id;

			World.msgPlayer(target, {
				msg: 'You will now recall to the current room!',
				styleClass: 'green'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t recall!',
			styleClass: 'warning'
		});
	}
};

// Puts any target object into a defined room after verifying criteria
Cmd.prototype.move = function(target, command, fn) {
	var cmd = this,
	direction = command.arg,
	dexMod = World.dice.getDexMod(target),
	exitObj,
	displayHTML,
	targetRoom,
	exitObj,
	sneakAff,
	roomObj,
	canEnter = true, // event result, must be true to move into targetRoom
	canLeave = true, // event result, must be true to leave roomObj	
	i = 0,
	cost = 1 + target.size.value,
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

	if (target.size.value > 3) {
		cost += 1;
	}

	cost -= dexMod;

	if (!target.fighting && (target.position === 'standing' || target.position === 'fleeing') 
		&& (target.cmv > cost && target.wait === 0 && target.chp > 0)) {

		if (!command.roomObj) {
			roomObj = World.getRoomObject(target.area, target.roomid);
		} else {
			roomObj = command.roomObj;
		}

		if (roomObj.moveMod) {
			cost += World.dice.roll(1, roomObj.moveMod);
		}

		exitObj = World.room.getExit(roomObj, direction);

		if (exitObj) {
			if (!exitObj.door || exitObj.isOpen === true) {
				sneakAff = World.getAffect(target, 'sneak');

				if (!command.targetRoom) {
					targetRoom = World.getRoomObject(exitObj.area, exitObj.id);
				} else {
					targetRoom = command.targetRoom;
				}

				if (targetRoom && (!targetRoom.size || (targetRoom.size.value >= target.size.value))) {
					canEnter = World.processEvents('beforeEnter', targetRoom, target, roomObj, command);

					if (canEnter) {
						canEnter = World.processEvents('beforeMove', roomObj, target, targetRoom, command);
					}

					if (canEnter) {
						if (target.followers.length) {
							for (i; i < target.followers.length; i += 1) {
								(function(index) {
									setTimeout(function() {
										cmd.move(target.followers[index], {
											arg: command.arg,
											roomObj: roomObj,
											targetRoom: targetRoom
										});
									}, 150);
								}(i));
							}
						}

						target.cmv -= cost;

						if (exitObj.area !== target.area) {
							target.area = exitObj.area;
						}

						if (target.cmv < 0) {
							target.cmv = 0;
						}

						target.area = targetRoom.area;
						target.roomid = targetRoom.id;

						World.processEvents('onExit', roomObj, target, targetRoom, command);
						World.processEvents('onMove', roomObj, target, targetRoom, command);

						if (roomObj.waitMod) {
							target.wait += roomObj.waitMod;
						}

						if (target.isPlayer) {
							this.look(target);

							World.room.removePlayer(roomObj, target);

							targetRoom.playersInRoom.push(target);
						} else {
							World.room.removeMob(roomObj, target);

							targetRoom.monsters.push(target);
						}

						World.msgRoom(targetRoom, {
							msg: function(receiver, fn2) {
								var msg = '';

								if (!sneakAff) {
									if (World.character.canSee(receiver, targetRoom)) {
										if (!target.inName) {
											if (target.short) {
												msg = '<strong>' + target.capitalizeShort
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

								return fn2(true, msg);
							},
							playerName: target.name
						});

						World.msgRoom(roomObj, {
							msg: function(receiver, fn2) {
								var msg = '';

								if (!sneakAff) {
									if (World.character.canSee(receiver, roomObj)) {
										if (!target.outName) {
											if (target.short) {
												if (World.dice.roll(1, 2) === 1) {
													msg = '<span class="warning">' + target.capitalShort
														+ ' leaves heading <strong class="grey">'
														+ direction + '</strong>.</span>';	
												} else {
													msg = '<span class="warning">' + target.capitalShort
														+ ' leaves traveling <strong class="grey">'
														+ direction + '</strong>.</span>';
												}
											} else {
												msg = '<span class="warning">' + target.displayName
													+ ' leaves going <strong class="grey">' + direction 
													+ '</strong>.</span>';
											}
										} else if (target.outName && !target.outMessage) {
											msg = '<span class="warning">' + target.outName
											+ ' leaves traveling <strong class="grey">' + direction + '</strong>.</span>';
										} else {
											msg = '<span class="warning">' + target.outName + target.outMessage
											+ ' <strong class="grey">' + direction + '</strong>.</span>';
										}
									} else if (receiver.hearing) {
										msg = '<span class="warning">You can sense some movement in the area.</span>';
									}
								}

								return fn2(true, msg);
							},
							playerName: target.name
						});

						World.processEvents('onMove', target, targetRoom, roomObj, command);
						World.processEvents('onEnter', targetRoom, target, roomObj, command);
						World.processEvents('onVisit', targetRoom.monsters, targetRoom, targetRoom, target, command);

						if (typeof fn === 'function') {
							return fn(true);
						}
					}
				} else {
					if (targetRoom.size) {
						World.msgPlayer(target, {
							msg: 'You are too large to fit into that space!',
							styleClass: 'error'
						});
					}

					if (typeof fn === 'function') {
						return fn(false, roomObj, targetRoom);
					}
				}
			} else {
				World.msgPlayer(target, {
					msg: 'You need to open the ' + exitObj.name + ' first.',
					styleClass: 'error'
				});

				if (typeof fn === 'function') {
					return fn(false);
				} 
			}
		} else {
			if (command.cmd !== 'flee') {
				World.msgPlayer(target, {
					msg: 'There is no exit in that direction.',
					styleClass: 'error'
				});
			}

			if (typeof fn === 'function') {
				return fn(false);
			}
		}
	} else {
		if (target.cmv > cost) {
			if (target.position !== 'standing') {
				if (!target.fighting) {
					World.msgPlayer(target, {
						msg: 'You\'re not even <strong>stand</strong>ing up!',
						styleClass: 'error'
					});
				} else {
					World.msgPlayer(target, {
						msg: 'You can\'t do that right now! Try fleeing combat first!',
						styleClass: 'error'
					});
				}
			} else {
				World.msgPlayer(target, {
					msg: 'You cannot do that right now.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(target, {
				msg: 'You are too tired to move.',
				styleClass: 'error'
			});
		}

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

			if (player.creationStep === 0) {
				displayName = player.displayName;

				if (player.title === '') {
					displayName += ' a level ' + player.level + ' ' + player.race + ' ' + player.charClass;
				} else {
					displayName += ' ' + player.title;
				}

				str += '<tr>' +
					'<td class="who-lvl">' + player.level + '</td>' +
					'<td class="who-race green">' + player.race + '</td>' +
					'<td class="who-class red">' + player.classAbbr + '</td>' +
					'<td class="who-player"><strong>' + displayName + '</strong></td>' +
				'</tr>';
			}
		}

		str = '<div class="cmd-who"><h2>Visible Heros</h2>' +
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
	canGet = true,
	itemLen = 0,
	containerInRoom = false,
	maxCarry = World.character.getMaxCarry(target);

	if (target.position !== 'sleeping') {
		if (command.roomObj) {
			roomObj = command.roomObj;
		} else {
			roomObj = World.getRoomObject(target.area, target.roomid);
		}

		if (command.msg !== '' && World.character.canSee(target, roomObj)) {
			if (command.input) {
				container = World.character.getContainer(target, command);
			}

			if (!container) {
				container = World.room.getContainer(roomObj, command);

				containerInRoom = true;
			}

			if (!container) {
				if (command.msg !== 'all') {
					item = World.room.getItem(roomObj, command);
			
					if (item && !World.character.canSeeObject(target, item)) {
						item = false;
					}

					if (item) {
						canGet = World.processEvents('beforeGet', item, roomObj, target);
						canGet = World.processEvents('beforeGet', roomObj, target, item);

						if (canGet) {
							if (item.weight <= maxCarry) {
								World.room.removeItem(roomObj, item);

								World.character.addItem(target, item);

								if (item && item.weight < World.character.getMaxCarry(target)) {
									World.msgRoom(roomObj, {
										msg: target.displayName + ' picks up ' + item.short,
										playerName: target.name,
										styleClass: 'warning'
									});

									World.msgPlayer(target, {
										msg: 'You pick up ' + item.short,
										styleClass: 'blue'
									});	
								} else {

								}

								if (typeof fn === 'function') {
									return fn(target, roomObj, item);
								}
							} else {
								World.msgPlayer(target, {
									msg: 'You try to pick up ' + item.short + ' but <strong>it is too heavy</strong>.',
									styleClass: 'error'
								});
							}

							World.processEvents('onGet', roomObj, target, item); // when the player enters get in the room
							World.processEvents('onGet', item, roomObj, target); // when the item has get acted on it
							World.processEvents('onGet', target, roomObj, item); // when the player issues a get command

							World.character.save(target);
						}
					} else {
						if (!item) {
							World.msgPlayer(target, {msg: 'That item is not here.', styleClass: 'error'});
						}

						if (typeof fn === 'function') {
							return fn(target, roomObj, false);
						}
					}
				} else {
					itemLen = roomObj.items.length;

					if (itemLen) {
						for (i; i < itemLen; i += 1) {
							item = roomObj.items[i];

							if (item.weight <= maxCarry) {
								World.room.removeItem(roomObj, item);

								World.character.addItem(target, item);

								i -= 1;

								itemLen = roomObj.items.length;
							}
						}
					
						World.msgRoom(roomObj, {
							msg: target.displayName + ' grabs everything they can.',
							playerName: target.name,
							styleClass: 'warning'
						});

						World.msgPlayer(target, {
							msg: 'You grab everything!',
							styleClass: 'blue'
						});

						World.processEvents('onGet', roomObj.items, roomObj, null, target);
						World.processEvents('onGet', target, roomObj, roomObj.items);

						World.character.save(target);

						if (typeof fn === 'function') {
							return fn(target, roomObj, item);
						}
					} else {
						World.msgPlayer(target, {
							msg: 'You don\'t see any items here.',
							styleClass: 'error'
						});
					}
				}
			} else {
				if (command.second !== 'all') {
					if (!containerInRoom) {
						item = World.character.getFromContainer(container, command);
					} else {
						item = World.character.getFromContainer(container, command);
					}

					if (item) {
						World.character.removeFromContainer(container, item);

						World.character.addItem(target, item);

						World.msgPlayer(target, {
							msg: 'You remove a <strong>' + item.displayName + '</strong> from a '
								+ container.displayName + '.', 
							styleClass: 'green'
						});

						World.processEvents('onGet', container, roomObj, item, target);
						World.processEvents('onGet', target, roomObj, item, container);

						World.character.save(target);
					} else {
						World.msgPlayer(target, {
							msg: 'You don\'t see that in there.',
							styleClass: 'error'
						});
					}
				} else {
					itemLen = container.items.length;

					if (itemLen) {
						for (i; i < itemLen; i += 1) {
							item = container.items[i];

							if (item.weight <= maxCarry) {
								World.character.removeFromContainer(container, item);

								World.character.addItem(target, item);

								i -= 1;

								itemLen = container.items.length;
							}
						}

						World.msgRoom(roomObj, {
							msg: target.displayName + ' grabs everything they can.',
							playerName: target.name,
							styleClass: 'warning'
						});

						World.msgPlayer(target, {
							msg: 'You grab everything!',
							styleClass: 'blue'
						});

						World.processEvents('onGet', roomObj.items, roomObj, null, target);
						World.processEvents('onGet', target, roomObj, roomObj.items);

						World.character.save(target);

						if (typeof fn === 'function') {
							return fn(target, roomObj, item);
						}
					}
				}
			}
		} else {
			World.msgPlayer(target, {
				msg: 'Get what? Specify a target or try get all.',
				styleClass: 'error'
			});

			if (typeof fn === 'function') {
				return fn(target, roomObj, item);
			}
		}
	} else {
		World.msgPlayer(target, {
			msg: 'Get something while sleeping?',
			styleClass: 'error'
		});
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
			container = World.character.getContainer(target, command);

			if (container) {
				command.arg = command.second;

				item = World.character.getItem(target, command);

				if (item && item.refId !== container.refId && item.id !== container.id) {
					World.character.removeItem(target, item);

					World.character.addToContainer(container, item);

					World.msgPlayer(target, {
						msg: 'You put a <strong>' + item.displayName + '</strong> into ' + container.short + '.',
						styleClass: 'green'
					});

					World.processEvents('onPut', container, roomObj, item);

					World.character.save(target);
				} else {
					if (item && item.refId !== container.refId) {
						World.msgPlayer(target, {
							msg: 'You aren\'t carrying anything by that name.',
							styleClass: 'error'
						});
					} else {
						World.msgPlayer(target, {
							msg: 'You cannot put this item into itself.',
							styleClass: 'error'
						});
					}
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
	dropCnt = 0,
	item;

	if (target.position !== 'sleeping') {
		if (command.msg !== '' && target.items.length !== 0) {
			roomObj = World.getRoomObject(target.area, target.roomid);

			if (command.msg !== 'all') {
				itemArr = World.character.getItems(target, command);

				for (i; i < itemArr.length; i += 1) {
					if (itemArr[i].equipped === false) {
						item = itemArr[i];
					}
				}

				if (!item && itemArr.length) {
					item = itemArr[0];
				}

				if (item && !item.equipped) {
					canDrop = World.processEvents('beforeDrop', item, roomObj, target);

					if (canDrop) {
						World.character.removeItem(target, item);

						World.room.addItem(roomObj, item);

						World.msgRoom(roomObj, {
							msg: target.displayName + ' drops ' + item.short,
							playerName: target.name,
							styleClass: 'warning'
						});

						World.msgPlayer(target, {
							msg: 'You drop ' + item.short,
							styleClass: 'blue'
						});

						World.processEvents('onDrop', target, roomObj, item);
						World.processEvents('onDrop', roomObj, target, item);
						World.processEvents('onDrop', item, roomObj, target);

						World.character.save(target);
					} else {
						World.msgPlayer(target, {
							msg: 'You could not drop ' + item.short + '!',
							styleClass: 'warning'
						});
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

				if (itemLen) {
					for (i; i < itemLen; i += 1) {
						item = itemArr[i];

						canDrop = World.processEvents('beforeDrop', item, roomObj, target);

						if (canDrop) {
							if (!item.equipped) {
								dropCnt += 1;

								World.character.removeItem(target, item);

								World.room.addItem(roomObj, item);
							}
						}
					}

					if (dropCnt > 1) {
						World.msgPlayer(target, {
							msg: 'You drop everything that you can.',
							styleClass: 'blue'
						});

						World.msgRoom(roomObj, {
							msg: target.displayName + ' drops some things.',
							playerName: target.name,
							styleClass: 'warning'
						});
					} else if (dropCnt === 1) {
						World.msgPlayer(target, {
							msg: 'You drop everything that you can.',
							styleClass: 'blue'
						});

						World.msgRoom(roomObj, {
							msg: target.displayName + ' drops ' + item.short + '.',
							playerName: target.name,
							styleClass: 'warning'
						});
					} else {
						World.msgPlayer(target, {
							msg: 'You\'re not carrying anything you can drop!',
							styleClass: 'warning'
						});
					}

					World.character.save(target);
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
	chanceRoll,
	directions = ['north', 'east', 'west', 'south', 'down', 'up'];

	if (player.fighting) {
		chanceRoll = World.dice.roll(1, 20, World.dice.getDexMod(player));

		if (player.mainStat === 'dex') {
			chanceRoll += 1;
		}

		if (chanceRoll > 7 && player.wait === 0) {
			player.position = 'fleeing';

			if (!command.arg) {
				command.arg = directions[World.dice.roll(1, directions.length) - 1];
			}

			cmd.move(player, command, function(moved) {
				if (moved) {
					player.fighting = false;
					player.position = 'standing';

					if (World.dice.roll(1, 10) > 8 && player.wait < 2) {
						player.wait += 1;
					}

					World.msgPlayer(player.opponent, {
						msg: player.displayName + ' fled ' + command.arg +'!',
						styleClass: 'grey'
					});

					World.msgPlayer(player, {
						msg: '<strong>You fled ' + command.arg + '</strong>!',
						styleClass: 'success'
					});

					player.opponent.opponent = false;
					player.opponent = false;
				} else {
					player.fighting = true;;
/*
					World.msgPlayer(player.opponent, {
						msg: '<p>' + player.displayName + ' tries to flee ' + command.arg + '.</p>',
						styleClass: 'warning'
					});
*/
					World.msgPlayer(player, {
						msg: 'You cannot flee in that direction!',
						styleClass: 'error'
					});
				}
			});
		} else {
			if (World.dice.roll(1, 2) === 1) {
				World.msgPlayer(player, {
					msg: '<strong>You are in no position to flee!</strong>',
					styleClass: 'error'
				});
			} else {
				World.msgPlayer(player, {
					msg: '<strong>Your attempt to flee fails!</strong>',
					styleClass: 'error'
				});
			}
		}
	} else {
		World.msgPlayer(player, {
			msg: 'Flee from what?',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.mlist = function(player, command) {
	var mods = World.dice.getMods(player),
	msg = '<strong>Modifiers: </strong> Str: ' + mods.str + ', Wis: ' + mods.wis
		+ ', Int: ' + mods.int + ', Dex: ' + mods.dex
		+ ', Con: ' + mods.con;

	World.msgPlayer(player, {
		msg: msg
	});
};

// TODO update brandish so items can leverage a set of spells under enhancements[]
// that way each spell can have its own level and meta information
Cmd.prototype.brandish = function(player, command) {
	var scroll = World.character.getItem(player, command),
	castCmd = 'cast ',
	playerLevel = player.level;

	if (player.mainStat !== 'int') {
		playerLevel -= 5;
	}

	if (playerLevel < 0) {
		playerLevel = 0;
	}

	if (scroll && scroll.spell) {
		if (!scroll.spellLevel || scroll.spellLevel <= playerLevel) {
			if (scroll.spell.type.indexOf('passive') === -1) {
				if (command.msg === command.arg) {

				}
			} else {
				if (command.msg === command.arg) {

				}
			}

			castCmd = this.createCommandObject({msg: castCmd});

			castCmd.skillObj = scroll.spell;

			this.cast(player, castCmd);
		} else {

		}
	} else {
		
	}
};

// triggering spell skills
Cmd.prototype.cast = function(player, command, fn) {
	var cmd = this,
	mob,
	skillObj,
	roomObj,
	skillProfile,
	spellTarget;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(player.area, player.roomid);
	}

	if (command.skillObj) {
		skillObj = command.skillObj;
	}

	if (player.position !== 'sleeping' && player.position !== 'resting') {
		if (command.arg || skillObj) {
			if (!skillObj) {
				skillObj = World.character.getSkill(player, command.arg);
			}

			if (skillObj && skillObj.id in World.spells) {
				if (player.cmana > 0) {
					if (player.position === 'standing') {
						spellTarget = World.combat.getBattleTargetByRefId(player.refId);

						if (skillObj.type.indexOf('passive') === -1) {
							// combat skills
							if (spellTarget) {
								skillProfile = World.spells[skillObj.id](skillObj, player, player.opponent, roomObj, command);

								World.processEvents('onSpell', player, roomObj, skillObj);
								World.processEvents('onSpell', player.items, roomObj, skillObj);
								World.processEvents('onSpell', roomObj, player, skillObj);
							} else {
								spellTarget = World.search(roomObj.monsters, {arg: command.last, input: command.arg});

								if (spellTarget) {
									skillProfile = World.spells[skillObj.id](skillObj, player, spellTarget, roomObj, command);
								} else {
									World.msgPlayer(player, {
										msg: 'You need to specify a target!'
									});
								}
							}
						} else {
							// passive skills
							if (command.last === 'self' || command.last === 'me' || (command.last === skillObj.display)) {
								spellTarget = player;
							} else {
								spellTarget = World.search(roomObj.monsters, {arg: command.last, input: command.arg});
							}

							if (spellTarget) {
								World.spells[skillObj.id](skillObj, player, spellTarget, roomObj, command);

								World.processEvents('onSpell', player, roomObj, skillObj);
								World.processEvents('onSpell', player.items, roomObj, skillObj);
								World.processEvents('onSpell', roomObj, player, skillObj);
							} else {
								World.msgPlayer(player, {
									msg: 'You do not see anything by that name here.',
									styleClass: 'error'
								});
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
						msg: 'You don\'t have any mana!',
						styleClass: 'error'
					});

				}
			} else {
				World.msgPlayer(player, {
					msg: '<strong>You dont\'t know any spells by that name</strong>.',
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

// We pass in a Skill Profile Object (the output of a skill) when we start combat with a combat skill
Cmd.prototype.kill = function(player, command) {
	var roomObj,
	i = 0,
	opponent;

	if (command.arg !== player.name && !player.fighting) {
		if (player.position === 'standing') {
			if (command.roomObj) {
				roomObj = command.roomObj;
			} else {
				roomObj = World.getRoomObject(player.area, player.roomid);
			}

			if (!command.target) {
				opponent = World.search(roomObj.monsters, command);

				if (!opponent) {
					opponent = World.search(roomObj.playersInRoom, command);
				}
			} else {
				opponent = command.target;
			}

			if (opponent && opponent.roomid === player.roomid) {
				World.msgPlayer(player, {
					msg: '<strong class="grey">You scream and charge at a '
						+ opponent.name + '! (Level: ' + opponent.level + ')</strong>',
					noPrompt: true
				});

				World.msgPlayer(opponent, {
					msg: '<strong class="red">A ' + player.displayName 
						+ ' screams and charges at you!</strong>',
					noPrompt: true
				});

				World.msgRoom(roomObj, {
					msg: '<strong class="red">A ' + player.displayName 
						+ ' screams and charges at ' + opponent.long + '</strong>',
					noPrompt: true,
					playerName: player.name
				});

				World.combat.processFight(player, opponent, roomObj);
			} else {
				World.msgPlayer(player, {
					msg: 'There is nothing by that name here.',
					styleClass: 'error'
				});
			}
		} else {
			World.msgPlayer(player, {
				msg: 'Hard to do that from this position.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(player, {
			msg: 'That\'s impossible.',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.worth = function(target, command) {
	World.msgPlayer(target, {
		msg: 'You have ' + target.gold + ' gold.',
		styleClass: 'green'
	});
};

Cmd.prototype.look = function(target, command) {
	var roomObj,
	displayHTML,
	monster,
	itemDescription,
	item,
	i = 0;
	
	if (!command) {
		command = {};
	}

	if (!command.roomObj) {
		roomObj = World.getRoomObject(target.area, target.roomid);
	} else {
		roomObj = command.roomObj;
	}

	if (target.sight) {
		if (target.position !== 'sleeping') {
			if (!command.msg) {
				if (World.character.canSee(target, roomObj)) {
					displayHTML = World.room.getDisplayHTML(roomObj, target);

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
				item = World.character.getItem(target, command);

				if (!item) {
					item = World.character.getItem(roomObj, command);
				}

				if (item) {
					if (item.description) {
						itemDescription = item.description;
					} else {
						itemDescription = item.short;
					}

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
					monster = World.room.getMonster(roomObj, command);

					if (monster) {
						if (monster.description) {
							itemDescription = monster.description;
						} else if (monster.long) {
							itemDescription = monster.long + ' is ' + monster.position + ' ' + ' here.';
						}
						
						World.msgPlayer(target, {
							msg: itemDescription,
							styleClass: 'cmd-look'
						});
					} else {
						World.msgPlayer(target, {
							msg: 'You do not see that here.',
							styleClass: 'error'
						});
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
	var msgObj = {
		msg: '<h2>' + target.area + '</h2><ul>'
	},
	players = World.getPlayersByArea(target.area),
	i = 0;

	msgObj.styleClass = 'playerinfo where';
	
	if (players.length <= 1) {
		msgObj.msg += '<li>You don\'t see anyone else around.</li>';
	} else {
		for (i; i < players.length; i += 1) {
			msgObj.msg += '<li>Name: ' + players[i].displayName + '</li>'
				+ '<li>Current Area: ' + players[i].area + '</li>';	
		}
	}

	msgObj.msg += '</ul>';
	
	return World.msgPlayer(target, msgObj);
};

/** Communication Channels **/
Cmd.prototype.say = function(target, command) {
	var roomObj,
	i = 0;

	if (!target.mute) {
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

						if (World.character.canSee(receiver, roomObj)) {
							msg = '<div class="cmd-say"><span class="msg-name">'
								+ target.displayName + ' says></span> ' + command.msg + '</div>';
						} else {
							msg = '<div class="cmd-say"><span class="msg-name">Someone says></span> ' + command.msg + '</div>';
						}

						return fn(true, msg);
					},
					playerName: target.name
				});

				World.processEvents('onSay', target, roomObj, command);
				World.processEvents('onSay', roomObj, target, command);
				World.processEvents('onSay', roomObj.monsters, roomObj, target, command);
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
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t speak!',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.yell = function(target, command) {
	if (!target.mute) {
		if (command.msg !== '') {
			World.msgPlayer(target, {
				msg: '<div class="cmd-yell"><span class="msg-name">You yell></span> ' 
					+ command.msg + '</div>'
			});

			World.msgArea(target.area, {
				msg: '<div class="cmd-yell"><span class="msg-name">' + target.displayName 
					+ ' yells></span> ' + command.msg + '</div>',
				playerName: target.name
			});
		} else {
			World.msgPlayer(target, {
				msg: 'You open your mouth to yell and nothing comes out. You feel like an idiot.',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t speak!',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.chat = function(target, command) {
	if (!target.mute) {
		if (command.msg !== '') {
			command.msg = World.capitalizeFirstLetter(command.msg);

			World.msgPlayer(target, {
				msg: '<span class="msg-name">You chat></span> ' + command.msg,
				styleClass: 'cmd-chat'
			});

			World.msgWorld(target, {
				msg: '<span class="msg-name">' + target.displayName + '></span> ' + command.msg,
				playerName: target.name,
				styleClass: 'cmd-chat'
			});
		} else {
			World.msgPlayer(target, {
				msg: 'To send a message to everyone on the game use <strong>chat [message]</strong>. ' 
					+ 'To learn more about communication try <strong>help communication</strong>',
				styleClass: 'error'
			});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t speak!',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.tell = function(target, command) {
	var player;

	if (!target.mute) {
		if (command.msg) {
			player = World.getPlayerByName(command.arg);

			if (player) {
				World.msgPlayer(player, {
					msg: '<strong>' + target.displayName + ' tells you></strong> ' + command.input,
					styleClass: 'red'
				});

				player.reply = target.name;

				World.msgPlayer(target, {msg: 'You tell ' + player.displayName + '> ' + command.input, styleClass: 'cmd-say red'});
			} else {
				World.msgPlayer(target, {msg: 'You do not see that person.', styleClass: 'error'});
			}
		} else {
			return World.msgPlayer(target, {msg: 'Tell who?', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t speak!',
			styleClass: 'error'
		});
	}
};

Cmd.prototype.alert = function(target, command) {
	if (target.isPlayer) {
		World.msgPlayer(target, command);
	}
};

Cmd.prototype.reply = function(target, command) {
	var player;

	if (!target.mute) {
		if (command.msg && target.reply) {
			player = World.getPlayerByName(target.reply);

			if (player) {
				World.msgPlayer(player, {
					msg: '<strong>' + target.displayName + ' replies></strong> ' + command.msg,
					styleClass: 'green'
				});

				target.reply = player.name;

				World.msgPlayer(target, {
					msg: 'You reply to ' + player.displayName + '> ' + command.msg, 
					styleClass: 'cmd-say warning'
				});
			} else {
				World.msgPlayer(target, {msg: 'They arent there anymore.', styleClass: 'error'});
			}
		} else {
			return World.msgPlayer(target, {msg: 'Takes more than that to reply to someone.', styleClass: 'error'});
		}
	} else {
		World.msgPlayer(target, {
			msg: 'You can\'t speak!',
			styleClass: 'error'
		});
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
		if (!target.fighting && target.wait === 0) {
			target.logged = false;
			target.verifiedName = false;
			target.verifiedPassword = false;
			target.following = '';

			World.character.save(target, function() {
				World.msgPlayer(target, {
					msg: 'Add a little to a little and there will be a big pile.',
					evt: 'onDisconnect',
					styleClass: 'logout-msg',
					noPrompt: true
				});

				target.socket.terminate();

				World.character.removePlayer(target);
			});
		} else {
			if (target.fighting) {
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
	var roomObj = World.getRoomObject(target.area, target.roomid),
	trainDisplay = '',
	stat,
	i = 0,
	cost = 5,
	costDisplay = cost,
	canTrain = true,
	trainers = World.room.getTrainers(roomObj),
	trainer,
	stats = World.getGameStatArr(),
	canSee = World.character.canSee(target, roomObj);

	if (target.position !== 'sleeping' && !target.fighting) {
		if (canSee) {
			if (trainers.length) {
				trainer = trainers[0];

				if (target.level > 30) {
					cost += 3;
				}

				if (target.trainMod) {
					cost += target.trainMod;
				}

				if (command.arg) {
					if (trainer.beforeTrain) {
						canTrain = trainer.beforeTrain(target);
					}

					if (command.arg.indexOf('str') !== -1) {
						stat = 'str';
					} else if (command.arg.indexOf('int') !== -1) {
						stat = 'int';
					} else if (command.arg.indexOf('dex') !== -1) {
						stat = 'dex';
					} else if (command.arg.indexOf('wis') !== -1) {
						stat = 'wis';
					} else if (command.arg.indexOf('con') !== -1) {
						stat = 'con';
					}

					if (canTrain) {
						if (stat) {
							if (target['base' + World.capitalizeFirstLetter(stat)] < 12) {
								cost += 3;
							}
						
							if (stat === target.mainStat) {
								cost -= 1;
							}

							if (target.mainStat === 'str' && stat === 'int') {
								cost += 1;
							} else if (target.mainStat === 'int' && stat === 'con') {
								cost += 1;
							}

							if (trainer.level > target.level) {
								if (cost <= target.trains) {
									if (trainer.onTrain) {
										trainer.onTrain(target);
									}

									target.trains -= cost;
									target[stat] += 1;
									target['base' + World.capitalizeFirstLetter(stat)] += 1;

									World.msgPlayer(target, {
										msg: 'You train with ' + trainer.displayName 
											+ '. (<strong>' + World.capitalizeFirstLetter(stat) 
											+ ' +1 for ' + cost +  ' trains</strong>)',
										styleClass: 'green'
									});
								} else {
									World.msgPlayer(target, {
										msg: 'You don\'t have enough trains to work with ' 
											+ trainer.displayName + '.',
										styleClass: 'error'
									});
								}
							} else {
								World.msgPlayer(target, {
									msg: 'You already know much more than ' + trainer.displayName 
										+ '. You should find someone stronger to train with.',
									styleClass: 'error'
								});
							}
						} else {
							World.msgPlayer(target, {
								msg: 'You can\'t train <strong class="grey">' + command.arg + '</strong>.',
								styleClass: 'error'
							});
						}
					}
				} else {
					trainDisplay = '<p>You can train the follow stats with ' + trainer.displayName 
						+ '. <strong>You currently have ' + target.trains 
						+ ' Trains to spend</strong>.</p><table class="table table-condensed train-table">'
						+ '<thead><tr><td class="train-name-header"><strong>Stat</strong></td>'
						+ '<td class="train-cost-header"><strong>Current Value</strong></td>'
						+ '<td class="train-cost-header"><strong>Cost</strong></td>'
						+ '</tr></thead><tbody>';

					for (i; i < stats.length; i += 1) {
						if (target['base' + World.capitalizeFirstLetter(stats[i].id)] < 12) {
							costDisplay += 3;
						}

						if (stats[i].id === target.mainStat) {
							costDisplay -= 1;
						}

						if (target.mainStat === 'str' && stats[i].id === 'int') {
							costDisplay += 1;
						} else if (target.mainStat === 'int' && stats[i].id === 'con') {
							costDisplay += 1;
						}

						trainDisplay += '<tr>';
						trainDisplay += '<td>' + stats[i].display + '</td>';
						trainDisplay += '<td>' + target['base' + World.capitalizeFirstLetter(stats[i].id)] + '</td>';
						trainDisplay += '<td>' + costDisplay  + '</td>';
						trainDisplay += '</tr>';

						costDisplay = cost;
					}

					World.msgPlayer(target, {
						msg: trainDisplay + '</tbody></table><p class="red"></p>'
					});
				}
			} else {
				if (roomObj.monsters.length || roomObj.playersInRoom.length) {
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

Cmd.prototype.practice = function(target, command) {
	var	pracSkill = function() {
		if (!skillObj.learned) {
			skillObj.train = 40;
			skillObj.learned = true;
		}

		if (skillObj.train < 100) {
			if (skillObj.mainStat === target.mainStat) {
				cost -= 1;
			}

			if (skillObj.prerequisites.charClass && skillObj.prerequisites.charClass === target.charClass) {
				cost -= 1;
			}

			if (target.trains >= cost) {
				skillObj.train += World.dice.roll(1, 4, intMod);
				
				target.trains -= cost;

				if (skillObj.train > 100) {
					skillObj.train = 100;

					if (skillObj.train >= trainerSkillObj.train && target.onSkillMastery) {
						target.onSkillMastery(trainer, roomObj, skillObj, trainerSkillObj);
					}

					if (skillObj.train >= trainerSkillObj.train && trainer.onTrainMastery) {
						trainer.onTrainMastery(target, roomObj, trainerSkillObj, skillObj);	
					}
				}

				if (trainer.onPractice) {
					trainer.onPractice(target, skillObj, trainerSkillObj);
				}

				if (!trainer.trainMsg) {
					World.msgPlayer(target, {
						msg: trainer.capitalShort + ' trains you in the art of '
							+ skillObj.display + '.',
						styleClass: 'green'
					});
				} else {
					World.msgPlayer(target, {
						msg: trainer.trainMsg,
						styleClass: 'green'
					});
				}

				World.msgRoom(roomObj, {
					msg: trainer.capitalShort + ' trains ' + target.displayName
						+ ' in the art of ' + skillObj.display + '.',
					styleClass: 'green',
					playerName: target.name
				});
			} else {
				World.msgPlayer(target, {
					msg: 'You do not have enough Trains to practice ' + skillObj.display + '.',
					styleClass: 'error'
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
	roomObj,
	trainers,
	trainer,
	trainerSkillObj,
	practiceDisplay = '',
	i = 0,
	cost = 6,
	skillObj,
	canPrac = true,
	canSee,
	intMod = World.dice.getIntMod(target);

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	trainers = World.room.getTrainers(roomObj);

	canSee = World.character.canSee(target, roomObj);

	if (!target.fighting && target.position === 'standing') {
		if (canSee) {
			if (trainers.length) {
				trainer = trainers[0];

				if (command.arg) {
					trainerSkillObj = World.character.getSkill(trainer, command.arg);

					skillObj = World.character.getSkill(target, command.arg);

					if (trainer.beforePractice) {
						canPrac = trainer.beforePractice(target, skillObj, trainerSkillObj);
					}

					if (canPrac) {
						if (trainerSkillObj && skillObj && skillObj.learned) {
							pracSkill();
						} else {
							if (skillObj) {
								if (trainerSkillObj && World.character.meetsSkillPrepreqs(target, skillObj)) {
									pracSkill();
								} else {
									if (trainerSkillObj) {
										this.say(trainer, {
											msg: 'You are not ready to learn ' + skillObj.display 
												+ ', you have unmet prerequisites.',
											styleClass: 'error',
											roomObj: roomObj
										});
									} else {
										this.say(trainer, {
											msg: 'I cannot teach you something I do not know.',
											styleClass: 'warning',
											roomObj: roomObj
										});
									}
								}
							} else {
								World.msgPlayer(target, {
									msg: 'You don\'t know how to ' + command.arg 
										+ '. If you want to increase a stat use the train command.',
									styleClass: 'error'
								});
							}
						}
					}
				} else {
					practiceDisplay = '<p>The table below showcases the <strong class="yellow">skills currently offered by '
						+ trainer.displayName + '</strong></p><table class="table table-condensed prac-table">'
						+ '<thead><tr><td class="prac-name-header warning"><strong>' 
						+ trainer.possessivePronoun +  ' Skills</strong></td>'
						+ '<td class="prac-max-header warning"><strong>Status</strong></td>'
						+ '</tr></thead><tbody>';

					for (i; i < trainer.skills.length; i += 1) {
						if (trainer.skills[i].prerequisites.level <= trainer.level) {
							skillObj = World.character.getSkillById(target, trainer.skills[i].id);

							practiceDisplay += '<tr><td class="prac-skill">' + trainer.skills[i].display + '</td>';

							if (!skillObj) {
								practiceDisplay += '<td class="prac-known blue">Not Trainable</td>';
							} else {
								if (!World.character.meetsSkillPrepreqs(target, skillObj)) {
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
						msg: practiceDisplay + '</tbody></table><p class="red"><strong>' 
							+ 'To practice a skill you must have it on your' 
							+ ' skill list and any required prerequisites. Review help skills ' 
							+ 'for general skill system information.</strong></p>'
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
						msg: 'There is no one here to practice with.',
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
			World.character.save(target, function() {
				target.wait += 1;

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
			item = World.character.getItemByRefId(target, target.eq[i].item);
		} else {
			item = false;
		}

		eqStr += '<li class="eq-slot-' + target.eq[i].slot.replace(/ /g, '') +
			'"><label><strong>' + target.eq[i].name + '</strong></label>: ';

		if (!item || target.eq[i].item === '') {
			eqStr += ' <span class="grey">Nothing</span></li>';
		} else {
			if (!item.light) {
				eqStr += '<label class="warning">' + item.displayName + '</label></li>';
			} else {
				if (item.lightDecay > 0) {
					eqStr += '<label class="warning">' + item.displayName
						+ ' (<span class="red">Providing light</span>)</label></li>';
				} else {
					eqStr += '<label class="warning">' + item.displayName
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
				learnedStatus = '<strong>' + skillObj.train + '</strong>';
			} else {
				learnedStatus = 'Unpracticed';
			}

			if (skillObj.prerequisites.level) {
				skillLevel = skillObj.prerequisites.level; 
			}

			skills += '<tr>'
				+ '<td><strong>' + skillObj.display + '</strong></td>'
				+ '<td><strong>' + skillObj.type + '</strong></td>' 
				+ '<td><strong>' + skillLevel + '</strong></td>'
				+ '<td><strong>' + learnedStatus + '</strong></td>'
				+ '<td><strong>' + skillObj.mod + '</strong></td>'
				+ '</tr>';

			if (trainedLevel) {
				skills += trainedLevel;
			}
		}

		skills = '<table class="table table-condensed prac-table">'
			+ '<thead><tr>'
			+ '<td>Skill</td>'
			+ '<td>Type</td>'
			+ '<td>Level</td>'
			+ '<td>Proficiency</td>'
			+ '<td>Bonus</td>'
			+ '</tr></thead><tbody>'
			+ skills + '</tbody></table>';
		
		World.msgPlayer(target, {msg: skills, styleClass: 'eq' });
	} else {
		World.msgPlayer(target, {msg: 'What skills?', styleClass: 'error' });
	}
};

Cmd.prototype.wear = function(target, command) {
	var item,
	roomObj;

	if (command.roomObj) {
		roomObj = command.roomObj;
	} else {
		roomObj = World.getRoomObject(target.area, target.roomid);
	}

	if (target.position !== 'sleeping' && target.position !== 'resting') {
		if (command.msg !== '') {
			item = World.character.getItem(target, command);

			if (item) {
				if (World.character['wear' + item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)]) {
					World.character['wear' + item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)](target, item, roomObj);

					World.character.save(target);
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
			item = World.character.getItem(target, command);

			if (item) {
				World.character.removeEq(target, item);

				World.character.save(target);
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
		'<td class="i-equipped-header grey">Level</td>' +
		'<td class="i-equipped-header green">Equipped</td>' +
		'<td class="i-type-header">Type</td>' +
		'<td class="i-weight-header">Weight</td>' +
		'</tr></thead><tbody>';

	if (player.items.length > 0) {
		iStr += '<tr>';

		for (i; i < player.items.length; i += 1) {
			if (World.character.canSeeObject(player, player.items[i]) || player.items[i].equipped) {
				iStr += '<td class="i-name">' + player.items[i].name + '</td>';
				iStr += '<td class="i-level">' + player.items[i].level + '</td>';

				if (!player.items[i].equipped) {
					iStr += '<td class="i-equipped">No</td>';
				} else {
					iStr += '<td class="i-equipped">Yes</td>';
				}

				iStr += '<td class="i-type">' + player.items[i].itemType + '</td>'
					+ '<td class="i-weight">' + player.items[i].weight + '</td></tr>';
			} else {
				iStr += '<td class="i-name">Something</td>';
				iStr += '<td class="i-level">?</td>';
				iStr += '<td class="i-equipped">No</td>';

				iStr += '<td class="i-type">Unknown</td>'
					+ '<td class="i-weight">' + player.items[i].weight + '</td></tr>';
			}
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
			msg: 'No items in your inventory, can carry ' + World.character.getMaxCarry(player) + ' pounds of items and treasure.'
		});
	}
};

Cmd.prototype.quests = function(target, commands) {
	var i = 0,
	questsArr = World.character.getQuests(target),
	questObj,
	listStr = '',
	qStr = '<h2>Current Quests</h2><ul class="list-inline">';

	if (questsArr.length === 0) {
		qStr += '<li class="list-inline-item">No current quests.</li>';
	} else {
		for (i; i < questsArr.length; i += 1) {
			questObj = World.getQuest(questsArr[i].id);
			
			if (questObj.title) {
				listStr = '<h3 class="warning">' + questObj.title  + '</h3>';
			}

			listStr += questObj.steps[questsArr[i].step];

			if (questsArr[i].completed) {
				listStr += ' <strong class="green">(Complete)</strong>';
			}

			qStr += '<li class="list-inline-item"><p>' + listStr  + '</p></li>';
		}
	}

	qStr += '</ul>';

	World.msgPlayer(target, {msg: qStr});
};

Cmd.prototype.score = function(target, command) {
	var score = '<div class="row score"><div class="col-md-12"><h1>' + 
		'<span class="score-level"> (' + target.level + ')</span> ' +
		'<span class="score-name">' + target.displayName + '</span> ' + 
		'<span class="score-title">' + target.title + '</span> ' + 
		'</h1></div>' +
		'<div class="stats">' +
			'<div class="col-md-12">' +
				'<div class="row">' + 
				'<ul class="col-md-12 score-info list-inline">' +
					'<li class="stat-hp first list-inline-item"><label>HP:</label> <strong>' +  target.chp + '</strong>/' + target.hp + ' </li>' +
					'<li class="stat-mana list-inline-item"><label>Mana:</label> <strong>' + target.cmana + '</strong>/' + target.mana + '</li>' +
					'<li class="stat-mv list-inline-item"><label>Moves:</label> <strong>' + target.cmv + '</strong>/' + target.mv + '</li>' +
				'</ul>' +
				'<ul class="col-md-2 score-stats list-unstyled">' +
					'<li class="stat-str first"><label><strong>STR:</strong></label> ' + target.baseStr + ' <strong>(' + target.str + ')</strong></li>' +
					'<li class="stat-wis"><label><strong>WIS:</strong></label> ' + target.baseWis + ' <strong>(' + target.wis + ')</strong></li>' +
					'<li class="stat-int"><label><strong>INT:</strong></label> ' + target.baseInt + ' <strong>(' + target.int + ')</strong></li>' +
					'<li class="stat-dex"><label><strong>DEX:</strong></label> ' + target.baseDex + ' <strong>(' + target.dex + ')</strong></li>' +
					'<li class="stat-con"><label><strong>CON:</strong></label> ' + target.baseCon + ' <strong>(' + target.con + ')</strong></li>' +
				'</ul>' +
				'<ul class="col-md-2 score-stats list-unstyled">' +
					'<li class="stat-armor"><label><strong>Armor:</strong></label> ' + target.ac + '</li>' +
					'<li class="stat-hunger"><label><strong>Hunger:</strong></label> ' + target.hunger +'</li>' +
					'<li class="stat-thirst"><label><strong>Thirst:</strong></label> ' + target.thirst +'</li>' +
					'<li class="stat-trains last"><label><strong>Trains:</strong></label> ' + target.trains + '</li>' +
				'</ul>' +
				'<div class="stat-details col-md-3">' +
					'<ul class="score-stats list-unstyled">' +
						'<li class="stat-hitroll"><label><strong>Hit Bonus: </strong></labels> ' + World.character.getHitroll(target) + '</li>' +
						'<li class="stat-damroll"><label><strong>Damage Bonus: </strong></label> ' + World.character.getDamroll(target) + '</li>' +
						'<li class="stat-magicRes"><label><strong>Magic resistance: </strong></label> ' + target.magicRes + '</li>' +
						'<li class="stat-meleeRes"><label><strong>Melee resistance: </strong></label> ' + target.meleeRes + '</li>' +
					'</ul>' +
				'</div>' +
				'<div class="stat-details col-md-3">' +
					'<ul class="score-stats list-unstyled">' +
						'<li class="stat-poisonRes"><label><strong>Poison resistance: </strong></label> ' + target.poisonRes + '</li>' +
						'<li class="stat-detection"><label><strong>Detection: </strong></label> ' + target.detection + '</li>' +
						'<li class="stat-knowlege"><label><strong>Knowledge: </strong></label> ' + target.knowledge + '</li>' +
					'</ul>' +
				'</div>' +
				'<div class="col-md-12 score-affects">' +
					'<h6>Affected by:</h6>' +
					'<p>You don\'t feel affected by anything.</p>' +
				'</div>' +
				'<ul class="col-md-12 list-unstyled">' +
					'<li class="stat-position">You are currently <span class="green">' + (target.fighting === false ? target.position : target.position + ' and fighting') + '</span>.</li>' +
					'<li class="stat-level">You are a level ' + target.level + ' ' + target.sex + ' ' + target.race + ' <string class="red">'
						+ target.charClass + '</strong> of ' + target.size.display + ' size with ' 
						+ '<span class="warning">' + target.gold + ' ' + World.config.coinage  + '</span>.</li>' +
					'<li class="stat-carry">You are carrying ' 
						+ target.weight + '/' + World.character.getMaxCarry(target) + ' pounds.</li>' +
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

/**********************************************************************************************************
* ADMIN COMMANDS
************************************************************************************************************/

// List file names found in /players
Cmd.prototype.plist = function(target, command) {
	if (player.role === 'admin' || World.config.allAdmin) {
		fs.readdir('./players/', function(err, playerNames) {
			var i = 0;

			for (i; i < playerNames.length; i += 1) {
				if (playerNames[i].indexOf('.git') !== -1) {
					playerNames.splice(i, 1);
				}

				playerNames[i] = playerNames[i].replace('.json', '');
			}

			World.msgPlayer(target, {
				msg: '<h3>Created Players: ' + playerNames.length + '</h3>'
					+ '<p>' + playerNames.toString() + '</p>',
				styleClass: 'warning'
			});
		});
	}
};

Cmd.prototype.cripple = function(player, command) {
	if (player.role === 'admin' || World.config.allAdmin) {
		if (player.opponent && player.opponent.chp) {
			player.opponent.chp = 1;

			World.msgPlayer(player, {
				msg: 'You have crippled ' + player.opponent.short
			});
		}
	}
}

// list all areas with their total room count
Cmd.prototype.alist = function(target, command) {
	var i = 0,
	str = '';

	for (i; i < World.areas.length; i += 1) {
		str += '<li>' + World.areas[i].id  + ' (' + World.areas[i].rooms.length  + ')</li>';
	}

	World.msgPlayer(target, {
		msg: '<h3>Loaded Areas: ' + World.areas.length + '</h3>'
			+ '<ul>' + str + '</ul>',
		styleClass: 'warning'
	});
};

/*
* View a string representation of the JSON behind a world object.
* Syntax: json objectType (item, room, monster or player)
* typing 'json' alone will give the json object for the entire current room.
*/
Cmd.prototype.json = function(target, command) {
	if (target.role === 'admin' && command.msg || World.config.allAdmin) {
		World.character.checkInventory(r, s, function (fnd,item) {
			if (fnd) {
				World.msgPlayer(target, {msg: util.inspect(item, {depth: null})});
			} else {
				World.room.checkItem(r, s, function (fnd, item) {
					if (fnd) {
						World.msgPlayer(target, {msg: util.inspect(item, {depth: null})});
					} else {
						World.room.checkMonster(r, s, function (fnd, monster) {
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
* Stops all combat and reloads all core game modules.
* does not force area respawn.
*/
Cmd.prototype.reboot = function(target, command) {
	if (target.role === 'admin' || World.config.allAdmin) {
		require.cache[require.resolve('../src/rooms')] = null;
		require.cache[require.resolve('../src/ticks')] = null;
		require.cache[require.resolve('../src/dice')] = null;
		
		World.ticks = require('./ticks');
		World.dice = require('./dice');

		Room = require('./rooms');
	} else {
		World.msgPlayer(target, {msg: 'No.', styleClass: 'error' });
	}
};

// Fully heal everyone on the MUD
Cmd.prototype.restore = function(admin, command) {
	var i = 0,
	player;

	if (admin.role === 'admin' || World.config.allAdmin) {
		for (i; i < World.players.length; i += 1) {
			player = World.players[i];
			player.chp = player.hp;
			player.cmana = player.mana;
			player.cmv = player.mv;
			player.hunger = 0;
			player.thirst = 0;
			player.wait = 0;
		}

		World.msgWorld(admin, {msg: 'You feel refreshed!'});
	} else {
		World.msgPlayer(admin, {msg: 'You do not possess that kind of power.', styleClass: 'error' });
	}
};

// Stops all game combat, does not heal
Cmd.prototype.peace = function(target, command) {
	if (target.role === 'admin' || World.config.allAdmin) {

	} else {
		World.msgPlayer(target, {msg: 'You do not possess that kind of power.', styleClass: 'error' });
	}
};

module.exports = new Cmd();
