'use strict';

var fs = require('fs'),
io = require('../server').io,
players = require('../server').players,
areas = require('../server').areas,

Room = function() {
 
};

// Before an area is loaded into areas[] we roll some dyanmic values for its objects
Room.prototype.rollArea = function() {

};

// Returns an entire area, uses rollArea to roll dynamic values
Room.prototype.getArea = function(areaName, fn) {
	this.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area);
		} else {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				return fn(JSON.parse(area));	
			});
		}
	});
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

	room.getExits(roomObj, function(exits) {
		room.getPlayers(roomObj, function(playersInRoom) {
			room.getItems(roomObj, {specific: 'short'}, function(items) {	
				room.getMonsters(roomObj, {specific: 'short'}, function(monsters) {							
					
					if (exits.length > 0) {
					 	roomStr += '<li class="room-exits">Visible Exits: ' + 
					 	exits.toString().replace(/,/g, ', ') + '</li>';
					} else {
						roomStr += '<li class="room-exits">Visible Exits: None!</li>';
					}
					
					if (playersInRoom.length > 0 || monsters.length > 0) {
						roomStr += '<li>Here:' + playersInRoom.toString().replace(/,/g, '. ') + 
						' ' + monsters.toString().replace(/,/g, '. ') + '</li>';
					}
					
					if (items.length > 0) {
						roomStr += '<li>Items: ' + items.toString().replace(/,/g, ', ') + 
						'</li>';
					}							
				});
			});
		});
	});

	roomStr = '<h2 class="room-title">' + roomObj.title + '</h2>' + 
	'<p class="room-content">' + roomObj.content + '</p>' + 
	'<ul>' + roomStr + '</ul>';
	
	room.checkArea(roomObj.area, function(fnd, area) {
		if (!fnd) { //  area was in areas[]
			room.loadArea(roomObj.area);
		}

		if (typeof fn === 'function') {
			return fn(roomStr);
		} else {
			return roomStr;
		}
	});
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

// Refreshes the area reference in areas[]
Room.prototype.loadArea = function(areaName, fn) {
	var  i = 0;

	fs.readFile('./areas/' + areaName + '.json', function (err, area) {
		var area = JSON.parse(area);

		areas[i] = area;
		
		if (typeof fn === 'function') {
			return fn(true);
		}
	});
};

// Return a room in memory as an object, pass in the area name and the room vnum {area: 'Midgaard', vnum: 1}
Room.prototype.getRoomObject = function(areaQuery, fn) {
	this.checkArea(areaQuery.area, function(fnd, area) {
		var i = 0;
		
		if (fnd) { 
			for (i; i < area.rooms.length; i += 1) {
				if (area.rooms[i].id === areaQuery.id) {		
					return fn(area.rooms[i]);
				} 
			}
		}
	});
};

Room.prototype.getExits = function(room, fn) {
	var arr = [],
	i = 0;

	for (i; i < room.exits.length; i += 1) {
		arr.push(room.exits[i].cmd);
	}

	return fn(arr);
};

// This needs to look like getItems() for returning a player obj based on room
Room.prototype.getPlayers = function(room, fn) {
	var arr = [],
	player,
	i = 0;

	for (i; i < players.length; i += 1) {
		player = io.sockets.connected[players[i].sid].player;

		if (player.roomid === room.id) {
			arr.push(' ' + player.name + ' the ' + player.race + ' is ' + player.position + ' here');
		}
	}

	return fn(arr);
};

Room.prototype.getItems = function(room, optObj, fn) {
	var arr = [],
	i = 0;

	if (optObj.specific != undefined) {
		if (room.items.length > 0) {
			for (i; i < room.items.length; i += 1) {
				arr.push(room.items[i][optObj.specific]);
			}
			return fn(arr);
		} else {
			return fn(arr);
		}
	} else {
		if (room.items.length > 0) {
			for (i; i < room.items.length; i += 1) {
				arr.push(room.items[i]);
			}
			return fn(arr);
		} else {
			return fn(arr);
		}
	}
};

Room.prototype.getMonsters = function(room, optObj, fn) {
	var arr = [],
	i = 0;

	if (optObj.specific !== undefined) {
		if (room.monsters.length > 0) {
			for (i; i < room.monsters.length; i += 1) {
				arr.push(room.monsters[i][optObj.specific]);
			}
			
			return fn(arr);
		} else {
			return fn(arr);
		}
	} else {
		if (room.monsters.length > 0) {
			for (i; i < room.monsters.length; i += 1) {
				arr.push(room.monsters[i]);
			}			
			return fn(arr);
		} else {
			return fn(arr);
		}
	}
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
		s = io.sockets.connected[players[i].sid];
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

Room.prototype.search = function() {

};

module.exports.room = new Room();