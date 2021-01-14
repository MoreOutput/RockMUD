'use strict';
var Ticks = function(newWorld) {
	var mudSecLen = newWorld.config.mudMinute;
	var previousTick = Date.now()
	var ticks = this;
	var gameLoop = function() {
	  var now = Date.now();

	  if (previousTick + mudSecLen <= now) {
		previousTick = now
	
		ticks.gameTime(newWorld);
	  }
	
	  if (Date.now() - previousTick < mudSecLen - 16) {
		setTimeout(gameLoop)
	  } else {
		setImmediate(gameLoop)
	  }
	}

	gameLoop();
}


Ticks.prototype.gameTime = function(World, runCombatLoop) {
	var timeMsgs = [{
		/*
		{
			msg: '',
			area: '' (falsey is all areas),
			awake: true (must be awake),
			outdoor: false (must be outdoors)
			filter: (entity) -> return true 
		}
		*/
	}];
	var areaMsg;

	World.time.minute += 1;

	if (World.time.minute === 60) {
		World.time.minute = 1;
		World.time.hour += 1;
	}

	if (World.time.hour === World.time.month.hoursInDay) {
		World.time.hour = 1;
		World.time.day += 1;
		World.time.month.day += 1;
	}

	if (World.time.hour === World.time.month.hourOfLight && World.time.minute === 1) {
		World.time.isDay = true;

		areaMsg = 'The sun appears over the horizon.';
	} else if (World.time.hour === World.time.month.hourOfNight && World.time.minute === 1) {
		World.time.isDay = false;

		areaMsg = 'The sun fades fully from view as night falls.';
	}

	if (World.time.month.day > World.time.month.days) {
		World.time.month = World.time.months[0];
	}

	if (World.cmds.length) {
		this.cmdLoop(World);
	}

	// combat loop and wait reduction
	if (World.battleLock === 0) {
		var i = 0;
		var battles = [...World.battles];
		var canRunExisting = (World.time.minute % 9) === 0;

		World.battleLock = battles.length;

		for (i; i < battles.length; i += 1) {
			if (World.combat.getNumberOfOpenBattlePositions(battles[i]) > 0) {
				// any battleObj on its initial round is ran immediately 
				if (canRunExisting || battles[i].round === 0 || runCombatLoop) {
					World.combat.round(battles[i]);
				}
				// TODO: round callback for immediate cleanup?
			} else {
				World.combat.removeBattle(battles[i]);
			}

			if (World.battleLock > 0) {
				World.battleLock -= 1;
			}
		}

		// TODO: extend wait state reduction to all game entites
		if (canRunExisting) {
			i = 0;

			for (i; i < World.players.length; i += 1) {
				var player = World.players[i];

				if (!player.fighting && (player.position === 'sleeping' ||
					player.position === 'resting' || player.position === 'standing')) {
					World.character.changeWait(player, -1);
				}
			}
		}
	}

	// ai loop
	if ((World.time.minute % 4) === 0) {
		var i = 0;
		var j = 0;
		var k = 0;
		var area;
		var players;
		var monsters;
		var room;
		var roomObj;

		if (!World.aiLock) {
			World.aiLock = true;

			for (i; i < World.areas.length; i += 1) {
				area = World.areas[i];
				players = World.getAllPlayersFromArea(area);

				if (players.length || area.runOnAliveWhenEmpty) {
					j = 0;

					for (j; j < area.rooms.length; j += 1) {
						roomObj = area.rooms[j];

						k = 0;

						for (k; k < roomObj.monsters.length; k += 1) {
							if ((area.runOnAliveWhenEmpty || players.length)
								|| (roomObj.monsters[k].originatingArea !== area.id)) {
								

								if (roomObj.monsters[k].chp >= 1 && (roomObj.monsters[k].runOnAliveWhenEmpty || roomObj.playersInRoom.length)) {
									World.processEvents('onAlive', roomObj.monsters[k], roomObj);
								}
							}
						}
					}

					j = 0;

					for (j; j < players.length; j += 1) {
						roomObj = World.getRoomObject(World.areas[i], players[j].roomid);

						if (players[j].chp >= 1) {
							World.processEvents('onAlive', players[j], roomObj);
						}

						if (players[j].position === 'standing' && !players[j].fighting && World.dice.roll(1, 100) >= 99) {
							World.character.save(players[j]);
						}
					}
				}
			}

			World.aiLock = false;
		}
	}

	// hunger, thirst
	if ((World.time.hour % 8) === 0 && World.time.minute === 30) {
		this.hungerThirstLoop(World);
	}

	if (areaMsg) {
		var i = 0;
		
		for (i; i < World.areas.length; i += 1) {
			roomCnt = World.areas[i].rooms.length;

			if (roomCnt) {
				j = 0;
	
				for (j; j < roomCnt; j += 1) {
					World.msgRoom(World.areas[i].rooms[j], {
						msg: areaMsg,
						styleClass: 'warning'
					});
				}
			} 
		}
	}

	// general game alerts
	var alerts = [
		'Use HELP COMMANDS to see a list of the most common commands.',
		'Use the SCAN command to get a quick look at the rooms adjacent to you.',
		'If you need to make some money try selling some furs and venison from the elks north of camp. You will need to learn how to SKIN animals first.',
		'Save your character with the <strong>save</strong> command.',
		'The <strong>say</strong> command is used when you want to send a message to everyone in your current room.',
		'You can see an items required level before picking it up!',
		'Use the QUEST command to see your current quests.',
		'RockMUD skills are dynamic. You can obtain and use skills beyond those of your core class.'
	];

	if (World.players.length && ((World.time.hour % 15) === 0) && World.time.minute === 1) {
		if (World.dice.roll(1, 2) === 1) {
			World.msgWorld({	
				msg: '<span><label class="red">Tip</label>: <span class="alertmsg"> ' 
					+ alerts[World.dice.roll(1, alerts.length) - 1] + '</span></span>'
			});
		}
	}

	// decay
	if ((World.time.hour % 10) === 0 && World.time.minute === 1) {
		var i = 0;
		var j;
		var mobs;
		var rooms;
		var roomCnt;
		var processItemDecay = function(obj) {
			var j = 0,
			decayMsg,
			lightFlickerMsg,
			lightDecayMsg,
			item;

			for (j; j < obj.items.length; j += 1) {
				item = obj.items[j];

				// Roll a dice to slow down decay for items found in player inventories
				if (item.decay >= 0 && World.dice.roll(1, 20) > 15) {
					if (item.decay && item.decay >= 1) {
						item.decay -= 1;
		
						// Level reduction for rotting corpses
						if (obj.itemType === 'corpse' && obj.level >= 2) {
							obj.level -= 1;
						}
					} else if (item.decay === 0) {
						obj.items.splice(j, 1);
		
						if (!item.decayMsg) {
							decayMsg = item.short + ' rots into nothing.';
						} else {
							decayMsg = item.short + ' ' + item.decayMsg;
						}
		
						if (obj.playersInRoom) {
							World.msgRoom(obj, {
								msg: decayMsg,
								styleClass: 'blue'
							});
						} else if (obj.isPlayer) {
							World.msgPlayer(obj, {
								msg: decayMsg,
								styleClass: 'blue'
							});
						}
					}
				}
		
				// light decay
				if (item.equipped && item.light && item.decayLight !== -1) {
					if (item.lightDecay >= 1) {
						item.lightDecay -= 1;
		
						if (World.dice.roll(1, 4) >= 2 && item.lightDecay !== 1) {
							if (!item.lightFlickerMsg) {
								lightFlickerMsg = 'The light from ' + item.short +' flickers.';
							} else {
								lightFlickerMsg = item.displayName + ' ' + item.lightFlickerMsg;
							}
		
							World.msgPlayer(obj, {
								msg: lightFlickerMsg,
								styleClass: 'yellow'
							});
						}
					} else if (item.lightDecay === 0) {
						if (!item.lightDecayMsg) {
							lightDecayMsg = 'The light from ' + item.short +' goes out!';
						} else {
							lightDecayMsg = item.displayName + ' ' + item.lightDecayMsg;
						}
		
						World.msgPlayer(obj, {
							msg: lightDecayMsg,
							className: 'yellow'
						});
					}
				}
			}
		};
		
		// decay player items
		if (World.dice.roll(1, 20) < 15) {
			if (World.players.length > 0) {
				for (i; i < World.players.length; i += 1) {
					if (World.players[i].items.length) {
						processItemDecay(World.players[i]);
					}
				}
			}
		} 
		
		// decay room items
		if (World.dice.roll(1, 20) < 18) {
			i = 0;
		
			for (i; i < World.areas.length; i += 1) {
				roomCnt = World.areas[i].rooms.length;
		
				if (roomCnt) {
					j = 0;
		
					for (j; j < roomCnt; j += 1) {
						if (!World.areas[i].rooms[j].preventDecay && World.areas[i].rooms[j].items.length) {
							processItemDecay(World.areas[i].rooms[j]);
						}
					}
				} 
			}
		}
		
		// decay mob items
		if (World.dice.roll(1, 20) < 10) {
			if (World.players.length > 0) {
				i = 0;
		
				for (i; i < World.areas.length; i += 1) {
					mobs = World.getAllMonstersFromArea(World.areas[i]);
		
					if (mobs) {
						j = 0;
		
						for (j; j < mobs.length; j += 1) {
							if (!mobs[j].preventItemDecay && mobs[j].items) {
								processItemDecay(mobs[j]);
							}
						}
					}
				}
			}
		}
		 
		// affect decay
		if (World.players.length > 0) {
			i = 0;
		
			for (i; i < World.players.length; i += 1) {
				if (World.players[i].affects.length) {
					j = 0;
		
					for (j; j < World.players[i].affects.length; j += 1) {
						var affect = World.players[i].affects[j];


						if (affect.decay !== -1) {
							if (affect.decay > 0) {
								affect.decay -= 1;
							} else {
								if (affect.decayMsg) {
									World.msgPlayer(World.players[i], {msg: affect.decayMsg});
								}

								World.removeAffect(World.players[i], affect.id);
							}
						}
					}
				}
			}
			
			i = 0;
		
			for (i; i < World.areas.length; i += 1) {
				mobs = World.getAllMonstersFromArea(World.areas[i]);
		
				if (mobs) {
					j = 0;
		
					for (j; j < mobs.length; j += 1) {
						if (mobs[j].affects.length) {
							var affect;
							var k = 0;
							
							for (k; k <  mobs[i].affects.length; k += 1) {
								affect = mobs[k].affects[i];
								if (affect.decay !== -1) {
									if (affect.decay > 0) {
										affect.decay -= 1;
									} else {
										World.removeAffect(mobs[i], affect.id);
									}
								}
							}
						}
					}
				}
			}
		}
	}


	// time message
	if (areaMsg) {
		var i = 0;

		for (i; i < World.areas.length; i += 1) {
			World.msgArea(World.areas[i].name, {
				msg: areaMsg
			});
		}
	}

	// respawn
	if ((World.time.day % 2) === 0 && (World.time.hour % 12) === 0 && World.time.minute === 1) {
		var playersInArea;
		var area;
		var i = 0;
		var refresh = true;

		for (i; i < World.areas.length; i += 1) {
			area = World.areas[i];
			playersInArea = World.getPlayersByArea(area.id);

			if (!playersInArea.length && !area.preventRespawn) {
				if (area.respawnOn > area.respawnTick) {
					area.respawnTick += 1;
				}
				
				if (area.respawnTick >= area.respawnOn) {
					area.respawnTick = 0;

					if (refresh) {
						if (!area.persistence) {
							World.reloadArea(area);
						} else if (World.dataDriver && World.dataDriver.saveArea) {
							World.dataDriver.saveArea(area);
						}
					}
				}
			}
		}
	}


	// area messages
	if ((World.time.hour % 3) === 0 && World.time.minute === 1) {
		var i = 0;
		var msgObj;

		for (i; i < World.areas.length; i += 1) {
			if (typeof World.areas[i].message === 'function') {
				World.areas[i].messages = World.areas[i].messages(World.areas[i]);
			}

			if (World.areas[i].messages.length && World.dice.roll(1, 3) == 1) {
				msgObj = World.areas[i].messages[World.dice.roll(1, World.areas[i].messages.length) - 1];

				if (!msgObj.hour) { // check to see if this message can only be sent at a specific game hour
					World.msgArea(World.areas[i].name, {
						msg: msgObj.msg,
						randomPlayer: msgObj.random // this option randomizes who hears the message
					});
				} else if (msgObj.hour === World.time.hour) {
					World.msgArea(World.areas[i].name, {
						msg: msgObj.msg,
						randomPlayer: msg.random // this option randomizes who hears the message
					});
				}
			}
		}
	}

	// broken connections
	if ((World.time.hour % 4) === 0 && World.time.minute === 30) {
		var i = 0;
		var player;

		for (i; i < World.players.length; i += 1) {
			player = World.players[i];

			if (!player.connected) {
				return player.socket.terminate();
			}

			player.connected = false;

			player.socket.ping();
		}
	}
}

Ticks.prototype.cmdLoop = function(World) {
	var cmdArr = World.cmds.slice();
	var cmdObj;
	var cmdEntity;

	World.cmds = [];

	try {
		while (cmdArr.length) {
			cmdObj = cmdArr[0];
			cmdEntity = cmdObj.entity;

			cmdObj.entity = null;

			if (cmdEntity.isPlayer && !cmdEntity.connected) {
				cmdEntity.connected = true;
			}
			
			if (!cmdObj.skill) {
				World.commands[cmdObj.cmd](cmdEntity, cmdObj, World);
			} else {
				// todo: run a check for skill improvement

				World.skills[cmdObj.cmd](
					cmdObj.skill,
					cmdEntity,
					cmdObj.roomObj,
					cmdObj,
					World
				);
			}

			cmdArr.splice(0, 1);
		}
	} catch (e) {
		console.error('COMMAND LOOP ERROR:', e);
	}
}

Ticks.prototype.hungerThirstLoop = function(World) {
	var i = 0;
	var player; 

	for (i; i < World.players.length; i += 1) {
		player = World.players[i];

		World.character.hunger(player);
		World.character.thirst(player);

		if (player.cmv > 0 && player.hunger < 8 && player.thirst < 8 && !player.fighting) {
			World.character.hpRegen(World.players[i]);
			World.character.manaRegen(World.players[i]);
			World.character.mvRegen(World.players[i]);
		}
	}
}

module.exports = Ticks;
