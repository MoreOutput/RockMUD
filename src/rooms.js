var fs = require('fs'),
character = require('./character');

var Room = function() {

}

// Returns area information without the room
Room.prototype.getArea = function(r, s, players, fn) {
	fs.readFile('./areas/' + s.player.area + '.json', function (err, area) {
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
Room.prototype.getRoom = function(r, s, players, fn) {
	fs.readFile('./areas/' + s.player.area + '.json', function (err, area) {
        var i = 0,
		exits = [],
		playersInRoom = [],
		displayRoom = function(room, exits, playersInRoom) {
			return s.emit('msg', {
				msg: '<div class="room-title">' + room.title + '</div>' + 
				'<div class="room-content">' + room.content + '</div>' + 
				'<div class="room-exits">Visible Exits: [' + exits + ']</div>' + 
				'Here:' + playersInRoom, 
				styleClass: area.type + ' room'
			});
		},
		area = JSON.parse(area);
        
		if (err) {
			throw err;
        }
		
		for (i; i < area.rooms.length; i += 1) {
	
			if (area.rooms[i].vnum === s.player.vnum) {	
				exits = (function () {
					var eArr = [],
					j = 0;
					for (j; j < area.rooms[i].exits.length; j += 1) {
						eArr.push(area.rooms[i].exits[j].cmd);
						if (eArr.length === area.rooms[i].exits.length) {
							return eArr.toString();
						}
					}
				}());
				
				playersInRoom = (function () {
					var pArr = [],
					j = 0;
					
					for (j; j < players.length; j += 1) {				
						if (players[j].vnum === s.player.vnum && players[j].name != s.player.name) {
							pArr.push(' ' + players[j].name + ' is ' + s.player.position + ' here');
						} else {
							pArr.push(' You are here.');
						}
						
						if (j === players.length - 1) {
							return pArr.toString();
						}
					}
				}());
				
					
				if (typeof fn === 'function') {
					displayRoom(area.rooms[i], exits, playersInRoom);
					fn(area.rooms[i]);
				} else {			
					displayRoom(area.rooms[i], exits, playersInRoom);
				}

			} else {
				s.emit('msg', {msg: 'Room load failed.'});
			}
		}	
	});
}

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

Room.prototype.north = function(r, s, players, fn) {
	if(this.checkExit(player)) {
		Room.load(r, s, player, players, fn);
		s.emit('msg', {msg: 'You walk north.'});
	} else {
		s.emit('mag', {msg: 'There is no exit that way.'});
	}
}

module.exports.room = new Room();
