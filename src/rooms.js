'use strict';
var fs = require('fs'),
World = require('./world').world,
io = World.io,
players = World.players,
time = World.time,
areas = World.areas,

Room = function() {
 
};

// Rolls values for Mobs (including their equipment)
Room.prototype.rollMob = function(mob, fn) {
	var diceMod, // Added to all generated totals 
	refId = Math.random().toString().replace('0.', ''),
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

	mob.refId = refId;

	World.getRace(mob.race, function(raceObj, err) {
		if (err) {
			
		}
		
		World.merge(mob, raceObj, function(mob, err) {
			if (err) {

			}

			if (mob.templates && mob.templates.length > 0) {

			}		
		});
	});


	return fn(mob);
};

// Setup Items in an area
Room.prototype.rollItem = function(item, fn) {

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

/*
	{
		data: 'items', // Room property
		value: '' // Required value, r.msg
	}
*/
Room.prototype.checkItem = function(r, s, fn) {
	console.log(this.search({
		data: 'items',
		value: r.msg }));

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

Room.prototype.remove = function(roomObj, itemID, roomArray, fn) {

};

Room.prototype.add = function(roomObj, itemObj, roomArray, fn) {

};

module.exports.room = new Room();