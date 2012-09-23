var fs = require('fs'),
character = require('./character');

var Room = function() {

}

Room.prototype.load = function(data, s, player, players, fn) {
	fs.readFile('./areas/' + player.area + '.json', function (err, data) {
        var i = 0,
		exits = [],
		playersInRoom = [],
		area = JSON.parse(data);
        
		if (err) {
			throw err;
        }
		
		for (i; i < area.rooms.length; i += 1) {
	
			if (area.rooms[i].vnum === player.vnum) {	
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

					for (j; j < Object.keys(players).length; j += 1) {
						if(players[s.id].vnum === player.vnum) {
							pArr.push(players[s.id].name + ' is standing here.');
							if (j === Object.keys(players).length - 1) {
								return pArr.toString();
							}
						}
					}
				}());
				
				s.emit('msg', {
					msg: '<div class="room-title">' + area.rooms[i].title + '</div>' + 
					'<div class="room-content">' + area.rooms[i].content + '</div>' + 
					'<div class="room-exits">Visible Exits: [' + exits + ']</div>' + 
					'Here: ' + playersInRoom, 
					styleClass: area.type + ' room'
				});
				

			} else {
				s.emit('msg', {msg: 'Room load failed.'});
			}
		}	
	});
}

Room.prototype.checkExit = function(s) { //  boolean if exit is viable (exit must match both the room and a command)
	fs.readFile('./areas/' + character[s.id].area + '.json', function (err, data) {
		var i = 0,
        area = {};

        if (err) {
			throw err;
        }

        area = JSON.parse(data);

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

Room.prototype.look = function(data, s, player, players, fn) {
	if (typeof fn === 'function') {
		fn();
	}
	
	if(data.msg === data.cmd || data.msg === '') {
		this.load(data, s, player, players);
	} else {
		// need to see if the passed in message matches anything in the room
	}
}

Room.prototype.north = function(data, s, player, players, fn) {
	if(this.checkExit(player)) {
		Room.load(data, s, player, players, fn);
		s.emit('msg', {msg: 'You walk north.'});
	} else {
		s.emit('mag', {msg: 'There is no exit that way.'});
	}
}

module.exports.room = new Room();
