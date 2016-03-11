'use strict';
var fs = require('fs'),
World = require('./world').world,
io = World.io,
players = World.players,
time = World.time,
areas = World.areas,

Room = function() {

};

Room.prototype.checkExitCriteria = function(targetRoom, exitObj, player, fn) {
	var i = 0,
	targetExit;

	for (i; i < targetRoom.exits.length; i += 1) {
		if (exitObj.id === targetRoom.id && targetRoom.exits[i].door) {
			if (targetRoom.exits[i].door.name === exitObj.door.name || targetRoom.exits[i].door.id
				 && exitObj.door.id && targetRoom.exits[i].door.id === exitObj.door.id) {
				targetExit = targetRoom.exits[i];
			}
		}
	}

	if (targetExit) {
		if (exitObj.door.locked === false) {
			return fn(true, targetExit);
		} else {
			return fn(false, targetExit);
		}
	} else {
		return fn(false, false);
	}
};

Room.prototype.checkEntranceCriteria = function(roomObj, exitObj, player, fn) {
	return fn(true);
};

Room.prototype.getByPosition = function() {

};

Room.prototype.getDisplayHTML = function(roomObj, options, fn) {
	var room = this,
	i = 0,
	displayHTML = '',
	exits = roomObj.exits,
	playersInRoom = roomObj.playersInRoom,
	monsters = roomObj.monsters,
	items = roomObj.items;

	if (arguments.length === 2) {
		fn = options;
		options = null;
	}

	if (exits.length > 0) {
		displayHTML += '<ul class="room-exits list-inline"><li class="list-label">Exits: </li>';

		for (i; i < exits.length; i += 1) {
			displayHTML += '<li>' + exits[i].cmd + '</li>';
		}

		displayHTML += '</ul>';
	} else {
		displayHTML += '<p class="room-exits">Visible Exits: None.</p>';
	}

	i = 0;

	displayHTML += '<ul class="room-here list-unstyled">';

	if (items.length > 0) {
		for (i; i < items.length; i += 1) {
			displayHTML += '<li class="room-item">A ' + items[i].short + '</li>';
		}
	}

	i = 0;

	if (monsters.length > 0 || playersInRoom.length > 0) {
		for (i; i < monsters.length; i += 1) {
			if (!monsters[i].short) {
				displayHTML += '<li class="room-monster">' + monsters[i].displayName + ' is ' + 
				 monsters[i].position + ' here</li>';
			} else {
				displayHTML += '<li class="room-monster">' + monsters[i].short + ' is ' + 
				 monsters[i].position + ' here</li>';
			}
		}

		i = 0;

		for (i; i < playersInRoom.length; i += 1) {
			if (!options || !options.hideCallingPlayer || options.hideCallingPlayer !== playersInRoom[i].name ) {
				displayHTML += '<li class="room-player">' + playersInRoom[i].name 
					+ ' the ' + playersInRoom[i].race + ' is ' + playersInRoom[i].position + ' here</li>';
			}
		}
	}

	displayHTML += '</ul>';

	displayHTML = '<div class="room"><h2 class="room-title">' + roomObj.title + '</h2>' + 
	'<p class="room-content">' + roomObj.content + '</p>' + displayHTML + '</div>';
	
	if (typeof fn === 'function') {
		return fn(displayHTML, roomObj);
	} else {
		return displayHTML;
	}
};

Room.prototype.addItem = function(roomObj, item, fn) {
	roomObj.items.push(item);
	return fn(roomObj, item);
};

// does a string match an exit in the room
Room.prototype.checkExit = function(roomObj, direction, fn) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (direction === roomObj.exits[i].cmd) {
				return fn(roomObj.exits[i]);
			} else if (roomObj.exits[i].door && roomObj.exits[i].door.name === direction) {
				return fn(roomObj.exits[i]);
			}
		}
		return fn(null);
	} else {
		return fn(null);
	}
};

// Get an exit by direction; empty direction results in an array of all exit objects
Room.prototype.getExit = function(roomObj, direction, fn) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (direction === roomObj.exits[i].cmd) {
				return fn(roomObj.exits[i]);
			} else if (roomObj.exits[i].door && roomObj.exits[i].door.name === direction) {
				return fn(roomObj.exits[i]);
			}
		}
		return fn(null);
	} else {
		return fn(null);
	}
};

// return all the rooms connected to this one, default depth of two
/*
	{
		direction.roomObj.direction.roomObj <- how depth will work
	}
*/
Room.prototype.getAdjacent = function(roomObj, fn) {
	var i = 0,
	roomArr = [];

	for (i; i < roomObj.exits.length; i += 1) {
		if (!roomObj.exits[i].door || roomObj.exits[i].door.isOpen) {
			World.getRoomObject(roomObj.area, roomObj.exits[i].id, function(fndRoom) {
				roomArr.push(fndRoom);
			});
		}
	}

	return fn(roomArr);
};

Room.prototype.getDisplay = function(areaName, roomId, fn) {
	var room = this;

	World.getRoomObject(areaName, roomId, function(roomObj) {
		World.getPlayersByRoomId(roomId, function(players) {
			roomObj.playersInRoom = players;
			room.getDisplayHTML(roomObj, function(displayHTML) {
				return fn(displayHTML, roomObj);
			});
		});
	});
};

// Return a brief overview of a room
Room.prototype.getBrief = function(roomObj, options, fn) {
	var room = this,
	i = 0,
	displayHTML = '',
	playersInRoom = roomObj.playersInRoom,
	monsters = roomObj.monsters;

	if (monsters.length > 0 || playersInRoom.length > 0) {
		displayHTML += '<ul class="room-here list-inline">';
		
		for (i; i < monsters.length; i += 1) {
			if (!monsters[i].short) {
				displayHTML += '<li class="room-monster">' + monsters[i].displayName + ' is ' + 
				 monsters[i].position + ' there/li>';
			} else {
				displayHTML += '<li class="room-monster">' + monsters[i].short + ' is ' + 
				 monsters[i].position + ' there</li>';
			}
		}

		i = 0;

		for (i; i < playersInRoom.length; i += 1) {
			if (!options || !options.hideCallingPlayer || options.hideCallingPlayer !== playersInRoom[i].name ) {
				displayHTML += '<li class="room-player">' + playersInRoom[i].name 
					+ ' the ' + playersInRoom[i].race + ' is ' + playersInRoom[i].position + ' there</li>';
			}
		}

		displayHTML += '</ul>';
	} else {
		displayHTML += '<p>Nothing you can see.</p>';
	}

	displayHTML = '<div class="room"><strong class="room-title">' + roomObj.title + '</strong>' + displayHTML;

	if (roomObj.brief) {
		displayHTML += '<p class="room-content">' + roomObj.brief + '</p>';
	}

	if (typeof fn === 'function') {
		return fn(displayHTML, roomObj);
	} else {
		return displayHTML;
	}
};

Room.prototype.removeItem = function(roomObj, item, fn) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.items.length; i += 1) {
		if (roomObj.items[i].refId !== item.refId) {
			newArr.push(roomObj.items[i]);
		}
	}

	roomObj.items = newArr;

	return fn(roomObj, item);
};

Room.prototype.removePlayer = function(roomObj, player, fn) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.playersInRoom.length; i += 1) {
		if (roomObj.playersInRoom[i].name !== player.name) {
			newArr.push(roomObj.playersInRoom[i]);
		}
	}

	roomObj.playersInRoom = newArr;

	return fn(roomObj, player);
};

Room.prototype.removeMob = function(roomObj, mob, fn) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.monsters.length; i += 1) {
		if (roomObj.monsters[i].refId !== mob.refId) {
			newArr.push(roomObj.monsters[i]);
		}
	}

	roomObj.monsters = newArr;

	return fn(roomObj, mob);
};

Room.prototype.processEvents = function(roomObj, player, eventName, fn) {
	var room = this;

	if (eventName) {
		World.processEvents(roomObj, player, roomObj, eventName, function() {
			World.processEvents(roomObj.monsters, player, roomObj, eventName, function() {
				World.processEvents(roomObj.items, player, roomObj, eventName, function() {
					return fn(roomObj, player);
				});
			});
		});
	} else {
		return fn(roomObj, player);
	}
};

Room.prototype.addCorpse = function(roomObj, corpse, fn) {
	var room = this;

	corpse.level = 1;
	corpse.short = 'rotting corpse of a ' + corpse.name;
	corpse.decay = 1;
	corpse.itemType = 'corpse';
	corpse.corpse = true;
	corpse.weight = corpse.weight - 1;
	corpse.chp = 0;
	corpse.hp = 0;

	room.addItem(roomObj, corpse, function(roomObj, corpse) {
		return fn(roomObj, corpse);
	});
};

module.exports.room = new Room();
