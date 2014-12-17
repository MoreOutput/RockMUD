'use strict';

var fs = require('fs'),
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Room = function() {
 
};

// Returns an entire area, uses rollArea to roll dynamic values
Room.prototype.loadArea = function(areaName, fn) {
	var room = this;
	room.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area);
		} else {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				area = JSON.parse(area);
				
				area.monsters.forEach(function(mob, i) {
					area.monsters[i] = room.rollMob(mob);
				});

				area.monsters.forEach(function(item, i) {
					area.items[i] = room.rollMob(item);
				});
			});
		}
	});
};

// Rolls values for Mobs (including their equipment)
Room.prototype.rollMob = function(mob, fn) {
	var diceMod, // Added to all generated totals 
	hp,
	mv, 
	mana,
	str,
	dex,
	wis,
	int,
	con,
	wait,
	raceObj,
	ac;

	if (!item.modRace && item.modRace !== false) {
		race = world.getRace(mob.race);
	} else {
		race = {name: item.race};
	}

	if (race.name) {
		
	}
};

// Setup Items in an area
Room.prototype.setupItems = function(area, fn) {

};

// Return boolean after checking if the area is in areas[]
Room.prototype.checkArea = function(areaName, fn) {
	if (areas.length > 0) {
		areas.forEach(function(area) {
			if (areaName === area.name.toLowerCase()) {
				return fn(true, area);
			} else {
				return fn(false);
			}
		});
	} else {
		return fn(false);
	}
};

// Returns a string (html) representation of a room for
Room.prototype.getDisplayHTML = function(roomObj, fn) {
	var room = this,
	i = 0,
	roomStr = '';

	if (roomObj.exits.length > 0) {
	 	roomStr += '<li class="room-exits">Visible Exits: ' + 
	 	roomObj.exits.toString().replace(/,/g, ', ') + '</li>';
	} else {
		roomStr += '<li class="room-exits">Visible Exits: None!</li>';
	}
	
	if (roomObj.playersInRoom.length > 0 || roomObj.monsters.length > 0) {
		roomStr += '<li>Here:' + roomObj.playersInRoom.toString().replace(/,/g, '. ') + 
		' ' + monsters.toString().replace(/,/g, '. ') + '</li>';
	}
	
	if (roomObj.items.length > 0) {
		roomStr += '<li>Items: ' + roomObj.items.toString().replace(/,/g, ', ') + 
		'</li>';
	}							

	roomStr = '<h2 class="room-title">' + roomObj.title + '</h2>' + 
	'<p class="room-content">' + roomObj.content + '</p>' + 
	'<ul>' + roomStr + '</ul>';
	
	if (typeof fn === 'function') {
		return fn(roomStr);
	} else {
		return roomStr;
	}
};

// Refreshes the area reference in areas[]
Room.prototype.updateArea = function(areaName, fn) {
	var  i = 0;

	for (i; i < areas.length; i += 1) {
		if (areaName === areas[i].name) {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				var area = JSON.parse(area);
				
				areas[i] = area;
				
				if (typeof fn === 'function') {
					return fn(true);
				}
			});
		} else {
			return fn(false);
		}
	}
};

/* Return a room in memory as an object, pass in the area name and the 
room id {area: 'Midgaard', id: 1}. 

Appends the playersInRoom property indicating the other players
in the same room.
*/
Room.prototype.getRoomObject = function(areaQuery, fn) {
	this.checkArea(areaQuery.area, function(fnd, area) {
		var i = 0,
		roomObj;
		
		if (fnd) { 
			for (i; i < area.rooms.length; i += 1) {
				if (area.rooms[i].id === areaQuery.id) {
					roomObj = area.rooms[i];
					room.getPlayersByRoomID(roomObj.id, function(playersInRoom) {
						roomObj.playersInRoom = playersInRoom;
						return fn(roomObj);
					})		
					
				} 
			}
		}
	});
};


// This needs to look like getItems() for returning a player obj based on room
Room.prototype.getPlayersByRoomID = function(roomID, fn) {
	var arr = [],
	player,
	i = 0;

	for (i; i < players.length; i += 1) {
		player = io.sockets.connected[players[i].sid].player;

		if (player.roomid === roomID) {
			arr.push(' ' + player.name + ' the ' + player.race + ' is ' + player.position + ' here');
		}
	}

	return fn(arr);
};

// does a string match an exit in the room
Room.prototype.checkExit = function(roomObj, r, fn) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (r.cmd === roomObj.exits[i].cmd) {
				return fn(true, roomObj.exits[i].vnum);
			}
		}
		return fn(false);
	} else {
		return fn(false);
	}
	
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
	if(parts.length === 2) {
		findIndex = parseInt(parts[0])-1;
		findMonster = parts[1];
	}
	else {
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

// callback with boolean if item with the supplied string matches room item, and first matched item as
// second argument if applicable
Room.prototype.checkItem = function(r, s, fn) {
	var msgPatt,
	items,
	parts,
	findIndex,
	findItem;

	// Split to account for target modifier (IE: 2.longsword)
	parts = r.msg.split('.');

	if (parts.length === 2) {
		findIndex = parseInt(parts[0])-1;
		findItem = parts[1];
	} else {
		findIndex = 0;
		findItem = r.msg;
	}

	msgPatt = new RegExp('^' + findItem);

	this.getRoomObject({area: s.player.area, id: s.player.roomid}, function(roomObj) {
		items = roomObj.items.filter(function (item, i) {
			if (msgPatt.test(item.name.toLowerCase())) {
				return true;
			}
		});

		if (items.length > 0 && findIndex in items) {
			fn(true, items[findIndex]);
		} else {
			fn(false);
		}
	});
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

Room.prototype.removeItemFromRoom = function(roomQuery, fn) {
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

// Emit a message to all the rooms players
Room.prototype.msgToRoom = function(msgOpt, exclude, fn) {
	var i = 0,
	s;

	for (i; i < players.length; i += 1) {				
		s = io.sockets.connected[players[i].sid];
		if (exclude === undefined || exclude === true) {
			if (s.player.name !== msgOpt.playerName && s.player.roomid === msgOpt.roomid) {
				s.emit('msg', {
					msg: msgOpt.msg, 
					styleClass: msgOpt.styleClass
				});
			} 
		} else {
			if (s.player.roomid === msgOpt.roomid) {
				s.emit('msg', {
					msg: msgOpt.msg, 
					styleClass: msgOpt.styleClass
				});
			} 
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
};

// Emit a message to all the players in an area
Room.prototype.msgToArea = function(msgOpt, exclude, fn) {
	var i = 0,
	s;

	for (i; i < players.length; i += 1) {				
		s = io.sockets.socket(players[i].sid);
		if (exclude === undefined || exclude === true) {
			if (s.player.name !== msgOpt.playerName && s.player.area === msgOpt.area) {
				s.emit('msg', {
					msg: msgOpt.msg, 
					styleClass: msgOpt.styleClass
				});
			} 
		} else {
			if (s.player.area === msgOpt.area) {
				s.emit('msg', {
					msg: msgOpt.msg, 
					styleClass: msgOpt.styleClass
				});
			} 
		}
	}

	if (typeof fn === 'function') {
		return fn();
	}
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
	parts,
	findIndex,
	toFind;

	// Split to account for target modifier (IE: 2.boar)
	parts = query.value.split('.');

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

	if (results.length > 0 && findIndex in results) {
		fn(true, results[findIndex]);
	} else {
		fn(false, results);
	}
};

Room.prototype.remove = function(roomObj, itemID, roomArray, fn) {

};

Room.prototype.add = function(roomObj, itemObj, roomArray, fn) {

};

module.exports.room = new Room();