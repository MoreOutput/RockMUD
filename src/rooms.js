var fs = require('fs'),
io = null,
players = require('../server').players,
areas = require('../server').areas;

var Room = function() {
 
}

// Returns area information without the room
Room.prototype.getArea = function(areaName, fn) {
	fs.readFile('./areas/' + areaName + '.json', function (err, area) {
        var i = 0,
		area = JSON.parse(area);
			
		if (typeof fn === 'function') {
			fn(area);
		} else {			
			return area;
		}	
	});
}

// Returns a specifc room
Room.prototype.getRoom = function(r, s, fn) {
	var room = this,
	displayRoom = function(rooms, fn) {
		var i = 0;
		
		for (i; i < rooms.length; i += 1) {	
			if (rooms[i].vnum === s.player.vnum) {								
				room.getExits(rooms[i], function(exits) {
					room.getPlayers(s, rooms[i], function(playersInRoom) {
						room.getItems(rooms[i], {specific: 'short'}, function(items) {
							room.getMonsters(rooms[i], function(monsters) {
								s.emit('msg', {
									msg: '<h2 class="room-title">' + rooms[i].title + '</h2>' + 
									'<p class="room-content">' + rooms[i].content + '</p>' + 
									'<ul>' + 
										'<li class="room-exits">Visible Exits: [' + exits.toString() + ']</li>' + 
										'<li>Here:' + playersInRoom.toString().replace(/,/g, ', ') + ' ' + monsters.toString() + '</li>' +
										'<li>Items: ' + items.toString() + '</li>' +
									'</ul>', 
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
		if (players[i].vnum === s.player.vnum && players[i].name != s.player.name) {
			arr.push(' ' + players[i].name + ' is ' + s.player.position + ' here');
		} else {
			arr.push(' You are here.');
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
		for (i; i < room.items.length; i += 1) {
			arr.push(room.items[i][optObj.specific]);
		
			if (arr.length === room.items.length) {
				return fn(arr);
			}
		}
	} else {
		for (i; i < room.items.length; i += 1) {
			arr.push(room.items[i]);
		
			if (arr.length === room.items.length) {
				if (arguments.length === 2) {
					return optObj(arr);
				} else {
					return fn(arr);
				}
			}
		}
	}
}

Room.prototype.getMonsters = function(room, fn) {
	var arr = [],
	i = 0;
	
	for (i; i < room.monsters.length; i += 1) {
		arr.push(room.monsters[i].name);
	
		if (arr.length === room.monsters.length) {
			return fn(arr);
		}
	}
}

Room.prototype.checkArea = function(areaName, fn) {
	if (areas.length > 0) {
		areas.forEach(function(item) {
			if (areaName === item.name) {
				fn(true, item);
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
			if (area.Room[i].vnum === character[s.id].vnum) {
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

// does a string matches an item in the room
Room.prototype.checkItem = function(r, s, fn) {
	var room = this;
	
	room.getRoom(r, s, function(roomObj) {
		room.getItems(roomObj, function(items) {
			var msgPatt = new RegExp('^' + r.msg);
			items.forEach(function(item) {
				if (msgPatt.test(item.name.toLowerCase())) {
					fn(true, item);
				} else {
					fn(false);
				}
			});
		});
	});
};

Room.prototype.move = function(r, s, fn) {
	if(this.checkExit(player)) {
		Room.load(r, s, player, players, fn);
		s.emit('msg', {msg: 'You walk north.'});
	} else {
		s.emit('mag', {msg: 'There is no exit that way.'});
	}
}

module.exports.room = new Room();