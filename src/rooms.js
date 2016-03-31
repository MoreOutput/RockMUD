'use strict';
var fs = require('fs'),
World = require('./world').world,
io = World.io,
players = World.players,
time = World.time,
areas = World.areas,

Room = function() {

};

// Given a room object and
Room.prototype.getAdjacentExit = function(targetRoom, exitObj, player) {
	var i = 0,
	targetExit = false;

	for (i; i < targetRoom.exits.length; i += 1) {
		if (exitObj.id === targetRoom.id && targetRoom.exits[i].door) {
			if (targetRoom.exits[i].door.name === exitObj.door.name || targetRoom.exits[i].door.id
				 && exitObj.door.id && targetRoom.exits[i].door.id === exitObj.door.id) {
				targetExit = targetRoom.exits[i];
			}
		}
	}

	return targetExit;
};

Room.prototype.checkEntranceCriteria = function(roomObj, exitObj, player) {
	return true;
};

Room.prototype.getByPosition = function() {

};

Room.prototype.getDisplayHTML = function(roomObj, options) {
	var room = this,
	i = 0,
	displayHTML = '',
	exits = roomObj.exits,
	playersInRoom = roomObj.playersInRoom,
	monsters = roomObj.monsters,
	items = roomObj.items;

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
	
	return displayHTML;
};

Room.prototype.addItem = function(roomObj, item) {
	roomObj.items.push(item);
};

// Get an exit from a room by direction; 
// empty direction results in an array of all exit objects
Room.prototype.getExit = function(roomObj, direction) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (direction === roomObj.exits[i].cmd) {
				return roomObj.exits[i];
			} else if (roomObj.exits[i].door && roomObj.exits[i].door.name === direction) {
				return roomObj.exits[i];
			}
		}
		return false
	} else {
		return false;
	}
};

// return all the rooms connected to this one, default depth of two
/*
	{
		direction.roomObj.direction.roomObj <- how depth will work
	}
*/
Room.prototype.getAdjacent = function(roomObj) {
	var i = 0,
	fndRoom,
	roomArr = [];

	for (i; i < roomObj.exits.length; i += 1) {
		if (!roomObj.exits[i].door || roomObj.exits[i].door.isOpen) {
			fndRoom = World.getRoomObject(roomObj.area, roomObj.exits[i].id);

			roomArr.push(fndRoom);
		}
	}

	return roomArr;
};

Room.prototype.getDisplay = function(areaName, roomId) {
	var room = this,
	players =  World.getPlayersByRoomId(roomId),
	roomObj = World.getRoomObject(areaName, roomId);
	roomObj.playersInRoom = players;

	return room.getDisplayHTML(roomObj);
};

// Return a brief overview of a room
Room.prototype.getBrief = function(roomObj, options) {
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

	return displayHTML;
};

Room.prototype.removeItem = function(roomObj, item) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.items.length; i += 1) {
		if (roomObj.items[i].refId !== item.refId) {
			newArr.push(roomObj.items[i]);
		}
	}

	roomObj.items = newArr;

	return roomObj;
};

Room.prototype.removePlayer = function(roomObj, player) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.playersInRoom.length; i += 1) {
		if (roomObj.playersInRoom[i].name !== player.name) {
			newArr.push(roomObj.playersInRoom[i]);
		}
	}

	roomObj.playersInRoom = newArr;

	return roomObj;
};

Room.prototype.removeMob = function(roomObj, mob) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.monsters.length; i += 1) {
		if (roomObj.monsters[i].refId !== mob.refId) {
			newArr.push(roomObj.monsters[i]);
		}
	}

	roomObj.monsters = newArr;

	return roomObj;
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

Room.prototype.addCorpse = function(roomObj, corpse) {
	var room = this;

	roomObj = room.addItem(roomObj, corpse);

	return roomObj;
};

module.exports.room = new Room();
