/*
* All Room based interactions are defined here, sometimes they are called from another module
* see a movement command like 'east' for example.
*/
var fs = require('fs'),
players = require('../server').players,
areas = require('../server').areas;

var Room = function() {
 
}

// Returns an entire area
Room.prototype.getArea = function(areaName, fn) {
	this.checkArea(areaName, function(fnd, area) {
		if (fnd) {
			return fn(area);
		} else {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				var area = JSON.parse(area);
				return fn(area);	
			});
		}
	});
}

// return boolean after checking if the area is in areas[]
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

// Returns a specifc room for display, to retun the room Obj use getRoomObject
Room.prototype.getRoom = function(s, fn) {
	var room = this,
	displayRoom = function(rooms, fn) {
		var i = 0,
		roomStr = '';

		for (i; i < rooms.length; i += 1) {	
			if (rooms[i].id === s.player.roomid) {								
				room.getExits(rooms[i], function(exits) {
					room.getPlayers(s, rooms[i], function(playersInRoom) {
						room.getItems(rooms[i], {specific: 'short'}, function(items) {	
							room.getMonsters(rooms[i], {specific: 'short'}, function(monsters) {							
								if (exits.length > 0) {
								 	roomStr += '<li class="room-exits">Visible Exits: ' + 
								 	exits.toString() + '</li>';
								} else {
									roomStr += '<li class="room-exits">Visible Exits: None!</li>';
								}
								
								if (playersInRoom.length > 0 || monsters.length > 0) {
									roomStr += '<li>Here:' + playersInRoom.toString().replace(/,/g, ', ') + 
									' ' + monsters.toString().replace(/,/g, ', ') + '</li>';
								}
								
								if (items.length > 0) {
									roomStr += '<li>Items: ' + items.toString().replace(/,/g, ', ') + 
									'</li>';
								}							
							
								s.emit('msg', {
									msg: '<h2 class="room-title">' + rooms[i].title + '</h2>' + 
									'<p class="room-content">' + rooms[i].content + '</p>' + 
									'<ul>' + roomStr + '</ul>', 
									styleClass: 'room'
								});

								if (typeof fn === 'function') {
									return fn();
								}
							});
						});
					});
				});
			}
		}	
	};
	
	room.checkArea(s.player.area, function(fnd, area) {
		if (fnd) { //  area was in areas[]
			displayRoom(area.rooms);

			if (typeof fn === 'function') {
				return fn();
			}
		} else { // loading area and placing it into memory
			fs.readFile('./areas/' + s.player.area + '.json', function (err, area) {
				var i = 0,
				area = JSON.parse(area);

				displayRoom(area.rooms);
				
				if (typeof fn === 'function') {
					return fn();
				}
			});
		}
	});
}

// Refreshes the area reference in areas[]
Room.prototype.updateArea = function(areaName, fn) {
	var  i = 0;

	for (i; i < areas.length; i += 1) {
		if (areaName === areas[i].name) {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				var i = 0,
				area = JSON.parse(area);
				
				areas[i] = area;
				
				if (typeof fn === 'function') {
					return fn(true);
				}
			});
		} else {
			return fn(false);
		}
	}
}

// Return a room in memory as an object, pass in the area name and the room vnum {area: 'Midgaard', vnum: 1}
Room.prototype.getRoomObject = function(areaQuery, fn) {
	var i = 0;	
	
	this.checkArea(areaQuery.area, function(fnd, area) {
		if (fnd) { //  area was in areas[]
			for (i; i < area.rooms.length; i += 1) {	
				if (area.rooms[i].id === areaQuery.id) {								
					return fn(area.rooms[i]);
				} 
			}
		}
	});
}

Room.prototype.getExits = function(room, fn) {
	var arr = [],
	i = 0;
	
	for (i; i < room.exits.length; i += 1) {
		arr.push(room.exits[i].cmd);
	}
	return fn(arr);
}

Room.prototype.getPlayers = function(s, room, fn) {
	var arr = [],
	i = 0;

	for (i; i < players.length; i += 1) {				
		if (players[i].id === s.player.roomid && players[i].name != s.player.name) {
			arr.push(' ' + players[i].name + ' is ' + s.player.position + ' here');
		} 
	}
	return fn(arr);
}

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
}

Room.prototype.getMonsters = function(room, optObj, fn) {
	var arr = [],
	i = 0;

	if (optObj.specific != undefined) {
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
}

// does a string match an exit in the room
Room.prototype.checkExit = function(r, s, fn) { 
	var room = this,
	i = 0;
	
	room.getRoomObject({area: s.player.area, id: s.player.roomid}, function(roomObj) {
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
	});		
}

// does a string match any monsters in the room
Room.prototype.checkMonster = function(r, s, fn) { 
	var room = this,
	i = 0;

	room.getRoomObject({area: s.player.area, id: s.player.roomid}, function(roomObj) {
		if (roomObj.monsters.length > 0) {
			var msgPatt = new RegExp('^' + r.msg);
			
			for (i; i < roomObj.monsters.length; i += 1) {
				if (msgPatt.test(roomObj.monsters[i].name.toLowerCase())) {
					return fn(true, roomObj.monsters[i]);
				}
			}
			
			return fn(false);
		} else {
			return fn(false);
		}
	});	
}


// Remove a monster from a room
Room.prototype.removeMonster = function(roomQuery, fn) {
	var i = 0;
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.monsters = roomObj.monsters.filter(function(item, i) {
			if (item.id === monster.id) {
				return fn(false);
			} else {
				return fn(true);
			}			
		});	
	});
}

// does a string match an item in the room
Room.prototype.checkItem = function(r, s, fn) {
	var room = this,
	i = 0;
	
	room.getRoomObject({area: s.player.area, id: s.player.roomid}, function(roomObj) {
		if (roomObj.items.length > 0) {
			room.getItems(roomObj, {}, function(items) {
				var msgPatt = new RegExp('^' + r.msg);
				for (i; i < items.length; i += 1) {
					if (msgPatt.test(items[i].name.toLowerCase())) {
						return fn(true, items[i]);
					}
				}
				return fn(false);
			});
		} else {
			return fn(false);
		}
	});		
};

Room.prototype.removeItemFromRoom = function(roomQuery, fn) {
	var i = 0;
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.items = roomObj.items.filter(function(item, i) {
			if (item.id === roomQuery.item.id) {
				return fn(false);
			} else {
				return fn(true);
			}			
		});	
	});
}

Room.prototype.addItem = function(roomQuery, fn) {
	var i = 0;	
	
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.items.push(roomQuery.item);		
	});
	return fn();
}

module.exports.room = new Room();