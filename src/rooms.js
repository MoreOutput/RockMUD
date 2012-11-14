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
				var i = 0,
				area = JSON.parse(area);
				
				return fn(area);	
			});
		}
	});
}

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
							room.getMonsters(rooms[i], function(monsters) {							
								if (exits.length > 0) {
									roomStr += '<li class="room-exits">Visible Exits: ' + exits.toString() + '</li>';
								} else {
									roomStr += '<li class="room-exits">Visible Exits: None!</li>';
								}
								
								if (playersInRoom.length > 0 || monsters.length > 0) {
									roomStr += '<li>Here:' + playersInRoom.toString().replace(/,/g, ', ') + ' ' + monsters.toString().replace(/,/g, ', ') + '</li>';
								}
								
								if (items.length > 0) {
									roomStr += '<li>Items: ' + items.toString() + '</li>';
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
			} else {
				s.emit('msg', {msg: 'Room load failed.'});
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
       
				if (err) {
					throw err;
				}

				displayRoom(area.rooms);
				
				if (typeof fn === 'function') {
					return fn();
				}
			});
		}
	});
}

Room.prototype.updateArea = function(areaName, fn) {
	var  i = 0;

	for (i; i < areas.length; i += 1) {
		if (areaName === areas[i].name) {
			fs.readFile('./areas/' + areaName + '.json', function (err, area) {
				var i = 0,
				area = JSON.parse(area);
       
				if (err) {
					throw err;
				}

				areas[i] = area;
				
				if (typeof fn === 'function') {
					return fn(true);
				}
			});
		} else {
			fn(false);
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
	
		if (arr.length === room.exits.length) {
			return fn(arr);
		}
	}
}

Room.prototype.getPlayers = function(s, room, fn) {
	var arr = [],
	i = 0;

	for (i; i < players.length; i += 1) {				
		if (players[i].id === s.player.roomid && players[i].name != s.player.name) {
			arr.push(' ' + players[i].name + ' is ' + s.player.position + ' here');
		} 
		
		if (i === players.length - 1) {
			return fn(arr);
		}
	}
}

Room.prototype.getItems = function(room, optObj, fn) {
	var arr = [],
	i = 0;

	if (optObj.specific != undefined) {
		if (room.items.length > 0) {
			for (i; i < room.items.length; i += 1) {
				arr.push(room.items[i][optObj.specific]);
		
				if (arr.length === room.items.length) {
					return fn(arr);
				}
			}
		} else {
			return fn(arr);
		}
	} else {
		if (room.items.length > 0) {
			for (i; i < room.items.length; i += 1) {
				arr.push(room.items[i]);
			
				if (arr.length === room.items.length) {
					return fn(arr);
				}
			}
		} else {
			return fn(arr);
		}
	}
}

Room.prototype.getMonsters = function(room, fn) {
	var arr = [],
	i = 0;
	
	for (i; i < room.monsters.length; i += 1) {
		arr.push(room.monsters[i].short);
	
		if (arr.length === room.monsters.length) {
			return fn(arr);
		}
	}
}

Room.prototype.checkArea = function(areaName, fn) {
	if (areas.length > 0) {
		areas.forEach(function(area) {
			if (areaName === area.name) {
				fn(true, area);
			} else {
				fn(false);
			}
		});
	} else {
		fn(false);
	}
};

Room.prototype.checkExit = function(s) { //  boolean if exit is viable (exit must match both the room and a command)

	



	fs.readFile('./areas/' + character[s.id].area + '.json', function (err, r) {
		var i = 0,
        area = {};

        if (err) {
			throw err;
        }

        area = JSON.parse(r);

        for (i; i < area.Room.length; i += 1) {
			if (area.Room[i].id === character[s.id].roomid) {
				var exits = (function() {
					var eArr = [],
					j = 0;
					for (j; j < area.Room[i].exits.length; j += 1) {
						eArr.push(area.Room[i].exits[j].cmd);
						if (eArr.length === area.Room[i].exits.length) {
							return eArr.toString();
						}
					}
				}());

                return s.emit('msg', {
					msg: '<div class="room-title">' + area.Room[i].title + '</div>' +
                    '<div class="room-content">' + area.Room[i].content + '</div>' +
                    '<div class="room-exits">Visible Exits: [' + exits + ']</div>',
					styleClass: area.type + ' room'
				});
            } else {
				return s.emit('msg', {msg: 'Room load failed.'});
            }
		}
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
						fn(true, items[i]);
					} else if (i === items.length - 1){
						fn(false);
					}
				}
			});
		} else {
			fn(false);
		}
	});		
};

Room.prototype.removeItemFromRoom = function(roomQuery, fn) {
	var i = 0;
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.items = roomObj.items.filter(function(item, i) {
			if (item.id === roomQuery.item.id) {
				return false;
			} else {
				return true;
			}			
		});	
	});
	
	fn();
}

Room.prototype.addItem = function(roomQuery, fn) {
	var i = 0;	
	
	this.getRoomObject(roomQuery, function(roomObj) {
		roomObj.items.push(roomQuery.item);		
	});
	
	fn();
}

// Callback is only fired if the direction is valid
Room.prototype.move = function(direction, fn) {
	//Room.getRoom(s, fn);
}

module.exports.room = new Room();