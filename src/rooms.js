'use strict';
var fs = require('fs'),
World = require('./world').world,
io = World.io,
players = World.players,
time = World.time,
areas = World.areas,

Room = function() {

};

Room.prototype.checkExitCriteria = function(target, roomObj, fn) {
	return fn(true);
};

Room.prototype.checkEntranceCriteria = function(target, roomObj, fn) {
	return fn(true);
};

Room.prototype.getDisplayHTML = function(roomObj, exits, playersInRoom, monsters, items, fn) {
	var room = this,
	i = 0,
	displayHTML = '';

	if (arguments.length === 2) {
		fn = exits;
		exits = roomObj.exits;
		playersInRoom = roomObj.playersInRoom;
		monsters = roomObj.monsters;
		items = roomObj.items;
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

	if (items.length > 0) {
		displayHTML += '<ul class="room-here list-inline">';

		for (i; i < items.length; i += 1) {
			displayHTML += '<li class="room-item">' + items[i].short + '.</li>';
		}
	}

	i = 0;

	if (monsters.length > 0 || playersInRoom.length > 0) {
		for (i; i < monsters.length; i += 1) {
			if (!monsters[i].short) {
				displayHTML += '<li class="room-monster">' + monsters[i].name + ' is ' + 
				 monsters[i].position + ' here.</li>';
			} else {
				displayHTML += '<li class="room-monster">' + monsters[i].short + ' is ' + 
				 monsters[i].position + ' here.</li>';
			}
		}

		i = 0;

		for (i; i < playersInRoom.length; i += 1) {
			displayHTML += '<li class="room-player">' + playersInRoom[i].name 
				+ ' the ' + playersInRoom[i].race + ' is ' + playersInRoom[i].position + ' here.</li>';
		}

		displayHTML += '</ul>';
	}

	displayHTML = '<div class="room"><h2 class="room-title">' + roomObj.title + '</h2>' + 
	'<p class="room-content">' + roomObj.content + '</p>' + displayHTML + '</div>';
	
	if (typeof fn === 'function') {
		return fn(displayHTML, roomObj);
	} else {
		return displayHTML;
	}
};

// does a string match an exit in the room
Room.prototype.checkExit = function(roomObj, direction, fn) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (direction === roomObj.exits[i].cmd) {
				return fn(true, roomObj.exits[i]);
			}
		}
		return fn(false, null);
	} else {
		return fn(false, null);
	}
};

// return all the rooms connected to this one
Room.prototype.getAdjacent = function(roomObj, depth, r, fn) {
	var i = 0;

};

Room.prototype.getDisplay = function(areaName, roomId, fn) {
	var room = this;

	World.getRoomObject(areaName, roomId, function(roomObj) {
		roomObj.playersInRoom = [];
		World.getPlayersByRoomId(roomId, function(players) {
			roomObj.playersInRoom = players;
			room.getDisplayHTML(roomObj, function(displayHTML) {
				return fn(displayHTML, roomObj);
			});
		});
	});
};

// does a string match any monsters in the room
Room.prototype.checkMonster = function(r, s, fn) {
	var msgPatt,
	monsters,
	parts,
	findIndex,
	findMonster;

	// Split to account for target modifier (IE: 2.boar)
	parts = r.msg.split('.');
	
	if (parts.length === 2) {
		findIndex = parseInt(parts[0])-1;
		findMonster = parts[1];
	} else {
		findIndex = 0;
		findMonster = r.msg;
	}

	msgPatt = new RegExp('^' + findMonster);

	this.getRoomObject({area: s.player.area, id: s.player.roomid}, function(roomObj) {
		monsters = roomObj.monsters.filter(function (item, i) {
			if (msgPatt.test(item.name.toLowerCase())) {
				return true;
			}
		});

		if (monsters.length > 0 && findIndex in monsters) {
			fn(true, monsters[findIndex]);
		} else {
			fn(false);
		}
	});
};

// Remove a monster from a room
Room.prototype.removeMonster = function(roomQuery, monster, fn) {
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.monsters = roomObj.monsters.filter(function(item, i) {
			return (item.id !== monster.id);
		});

		return fn(true);
	});
};

/*
	{
		data: 'items', // Room property
		value: '' // Required value, r.msg
	}
*/
Room.prototype.checkItem = function(r, s, fn) {
	return this.search({
		data: 'items',
		value: r.msg}, fn);
};

Room.prototype.addCorpse = function(s, monster, fn) {
	this.getRoomObject({
		area: s.player.area,
		id: s.player.roomid
	}, function(roomObj) {
		monster.short = 'rotting corpse of a ' + monster.name;
		monster.flags.push({decay: 5});
		monster.itemType = 'corpse';
		monster.corpse = true;
		monster.weight = monster.weight - 2;
		monster.chp = 0;
		monster.hp = 0;

		roomObj.items.push(monster);
	});
	
	return fn();
};

Room.prototype.removeItem = function(roomQuery, fn) {
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.items = roomObj.items.filter(function(item, i) {
			if (item.id !== roomQuery.item.id) {
				return true;
			}			
		});
		
		return fn(true);
	});
};

Room.prototype.addItem = function(itemOpt, fn) {
	this.getRoomObject(itemOpt, function(roomObj) {
		roomObj.items.push(itemOpt.item);		
	});
	
	return fn();
};

/*
	Example query object:
	{
		data: 'items', // Room property
		value: '' // Required value, r.msg
	}
	

	The methids line getItemFromRoom above should call this function
*/
Room.prototype.search = function(roomObj, query, fn) {
	var msgPatt,
	results,
	// Split to account for target modifier (IE: 2.boar)
	parts = query.value.split('.'),
	findIndex,
	toFind;

	if (parts.length === 2) {
		findIndex = parseInt(parts[0])-1;
		toFind = parts[1];
	} else {
		findIndex = 0;
		toFind = query.value;
	}

	msgPatt = new RegExp('^' + toFind);

	results = roomObj[query.value].filter(function (item, i) {
		if (msgPatt.test(item.name.toLowerCase())) {
			return true;
		}
	});

	return results;
};

module.exports.room = new Room();
