'use strict';
var fs = require('fs'),
World,
io,
players,
time,
areas,
Room = function(newWorld) {
	World = newWorld;

	io = World.io;
	players = World.players;
	time = World.time;
	areas = World.areas;
};

// get the connecting exit object from @targetRoom
Room.prototype.getAdjacentExit = function(targetRoom, exitObj) {
	var i = 0,
	targetExit = false;

	for (i; i < targetRoom.exits.length; i += 1) {
		if (exitObj.id === targetRoom.id && targetRoom.exits[i].door) {
			if (targetRoom.exits[i].name === exitObj.name || targetRoom.exits[i].id
				&& exitObj.id && targetRoom.exits[i].id === exitObj.id) {
				targetExit = targetRoom.exits[i];
			}
		}
	}

	return targetExit;
};

Room.prototype.getDisplayHTML = function(roomObj, player) {
	var room = this,
	i = 0,
	displayHTML = '',
	exits = roomObj.exits,
	playersInRoom = roomObj.playersInRoom,
	monsters = roomObj.monsters,
	titleStyleClass = 'room-title',
	titleHtmlTag = 'h2',
	items = roomObj.items;

	if (roomObj.titleHtmlTag) {
		titleHtmlTag = roomObj.titleHtmlTag;
	}

	if (roomObj.titleStyleClass) {
		titleStyleClass = roomObj.titleStyleClass;
	}

	if (exits.length > 0) {
		displayHTML += '<ul class="room-exits list-inline"><li class="list-label list-inline-item"><strong>Exits: </strong></li>';

		for (i; i < exits.length; i += 1) {
			if (World.character.canSeeObject(player, exits[i])) {
				if (!exits[i].door) {
					displayHTML += '<li class="list-inline-item"><button class="link-btn red" data-cmd="true" data-cmd-value="move ' + exits[i].cmd + '">' + exits[i].cmd + '</button></li>';
				} else if (exits[i].door && !exits[i].isOpen) {
					displayHTML += '<li class="list-inline-item"><button class="link-btn grey" data-cmd="true" data-cmd-value="move ' + exits[i].cmd + '">' +  exits[i].cmd + '</button></li>';
				} else {
					displayHTML += '<li class="list-inline-item"><button class="link-btn yellow" data-cmd="true" data-cmd-value="move ' + exits[i].cmd + '">' + exits[i].cmd + '</button></li>';
				}
			}
		}

		displayHTML += '</ul>';
	} else {
		displayHTML += '<p class="room-exits">Exits: None.</p>';
	}

	i = 0;

	displayHTML += '<ul class="room-here list-unstyled">';

	if (items.length > 0) {
		for (i; i < items.length; i += 1) {
			if (World.character.canSeeObject(player, items[i])) {
				if (items[i].level && items[i].itemType !== 'corpse' && items[i].itemType !== 'ornament') {
					if (items[i].long) {
						displayHTML += '<li class="room-item">' + items[i].long + ' (' + items[i].level + ')</li>';
					} else {
						displayHTML += '<li class="room-item">A ' + items[i].name + ' (' + items[i].level + ')</li>';
					}
				} else {
					if (items[i].long) {
						displayHTML += '<li class="room-item">' + items[i].long + '</li>';
					} else {
						displayHTML += '<li class="room-item">A ' + items[i].name + '</li>';
					}
				}
			}
		}
	}

	i = 0;

	if (monsters.length > 0 || playersInRoom.length > 0) {
		for (i; i < monsters.length; i += 1) {
			if (World.character.canSeeObject(player, monsters[i])) {
				if (!monsters[i].fighting) {
					if (monsters[i].long) {
						displayHTML += '<li class="room-monster grey">' + monsters[i].long + '</li>';
					} else {
						displayHTML += '<li class="room-monster grey">' + monsters[i].displayName + ' is '
							+ monsters[i].position + ' here.</li>';
					}
				} else {
					displayHTML += '<li class="room-monster grey">' + monsters[i].short + ' is here FIGHTING!</li>';
				}
			}
		}

		i = 0;

		for (i; i < playersInRoom.length; i += 1) {
			if (playersInRoom[i] !== player) {
				if (World.character.canSeeObject(player, playersInRoom[i])) {
					displayHTML += '<li class="room-player">' + playersInRoom[i].name 
						+ ' the ' + playersInRoom[i].race + ' is ' + playersInRoom[i].position + ' here.</li>';
				}
			}
		}
	}

	displayHTML += '</ul>';

	displayHTML = '<div class="room"><' + titleHtmlTag + ' class="' + titleStyleClass
		+  '">' + roomObj.title + '</' + titleHtmlTag  + '>' 
		+ '<p class="room-content">' + roomObj.content + '</p>' + displayHTML + '</div>';

	return displayHTML;
};

// Get an exit from a room by direction
Room.prototype.getExit = function(roomObj, direction) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (direction === roomObj.exits[i].cmd) {
				return roomObj.exits[i];
			} else if (roomObj.exits[i].door && roomObj.exits[i].name === direction) {
				return roomObj.exits[i];
			}
		}

		return false;
	} else {
		return false;
	}
};

Room.prototype.getExitById = function(roomObj, id) { 
	var i = 0;

	if (roomObj.exits.length > 0) {
		for (i; i < roomObj.exits.length; i += 1) {
			if (id === roomObj.exits[i].id) {
				return roomObj.exits[i];
			}
		}

		return false;
	} else {
		return false;
	}
};

// return an array of all the rooms connected to @roomObj
Room.prototype.getAdjacent = function(roomObj) {
	var i = 0,
	fndRoom,
	roomArr = [];

	for (i; i < roomObj.exits.length; i += 1) {
		if (!roomObj.exits[i].door || roomObj.exits[i].isOpen) {
			roomArr.push({
				room: World.getRoomObject(roomObj.exits[i].area, roomObj.exits[i].id),
				direction: roomObj.exits[i]
			});
		}
	}

	return roomArr;
};

/*
Get an object in the current form based off of a given room
	{
		directionalCommand: exitObj with .room reference attached
	}

	the attached room has a .map parameter added dictated by the depth parameter
	set to a max of five.
*/
Room.prototype.getAdjacentMap = function(roomObj, depth) {
	var i = 0,
	fndRoom,
	map = {};

	if (!depth || depth < 1) {
		depth = 1;
	} else if (depth > 5) {
		depth = 5;
	}

	for (i; i < roomObj.exits.length; i += 1) {
		depth -= 1;

		map[roomObj.exits[i].cmd] = roomObj.exits[i];
		map[roomObj.exits[i].cmd].room = World.getRoomObject(roomObj.exits[i].area, roomObj.exits[i].id);

		if (depth > 0) {
			map[roomObj.exits[i].cmd].room.map = this.getAdjacentMap(map[roomObj.exits[i].cmd].room, depth)
		}
	}

	return map;
};

// Return a brief overview of a room
Room.prototype.getBrief = function(roomObj, options) {
	var room = this,
	i = 0,
	displayHTML = '',
	playersInRoom = roomObj.playersInRoom,
	monsters = roomObj.monsters;

	if (roomObj && (monsters.length > 0 || playersInRoom.length > 0)) {
		displayHTML += '<ul class="room-here list-inline">';
		
		for (i; i < monsters.length; i += 1) {
			if (!monsters[i].short) {
				displayHTML += '<li class="room-monster">' + monsters[i].displayName + ' is ' 
					+ monsters[i].position + ' there.</li>';
			} else {
				displayHTML += '<li class="room-monster">' + monsters[i].short + ' is ' 
				 + monsters[i].position + ' there.</li>';
			}
		}

		i = 0;

		for (i; i < playersInRoom.length; i += 1) {
			if (!options || !options.hideCallingPlayer || options.hideCallingPlayer !== playersInRoom[i].name ) {
				displayHTML += '<li class="room-player">' + playersInRoom[i].name 
					+ ' the ' + playersInRoom[i].race + ' is ' + playersInRoom[i].position + ' there.</li>';
			}
		}

		displayHTML += '</ul>';
	} else {
		displayHTML += '<p>You don\'t see anything.</p>';
	}

	displayHTML = '<div class="room"><strong class="room-title">' + roomObj.title + '</strong>' + displayHTML;

	if (roomObj.brief) {
		displayHTML += '<p class="room-content">' + roomObj.brief + '</p>';
	}

	displayHTML += '</div>';

	return displayHTML;
};

Room.prototype.getTrainers = function(roomObj) {
	var i = 0,
	trainers = [];
	
	for (i; i < roomObj.monsters.length; i += 1) {
		if (roomObj.monsters[i].trainer) {
			trainers.push(roomObj.monsters[i]);
		}
	}

	return trainers;
};

Room.prototype.getMerchants = function(roomObj) {
	var i = 0,
	merchants = [],
	possibleMerchants = roomObj.monsters.concat(roomObj.playersInRoom); 
	
	for (i; i < possibleMerchants.length; i += 1) {
		if (possibleMerchants[i].merchant === true) {
			merchants.push(possibleMerchants[i]);
		}
	}
	
	return merchants;
};

Room.prototype.getMerchant = function(roomObj, command) {
	var i = 0,
	merchant = false,
	possibleMerchants = roomObj.monsters.concat(roomObj.playersInRoom), 
	pattern = new RegExp('^' + command.arg),
	len = possibleMerchants.length;
	
	for (i; i < len; i += 1) {
		if (!possibleMerchants[i].isPlayer) {
			if (possibleMerchants[i].merchant === true) {
				if (pattern.test(possibleMerchants[i].name.toLowerCase())) {
					merchant = possibleMerchants[i];
				} else if (merchant.short && pattern.test(possibleMerchants[i].short.toLowerCase())) {
				
				}
			} 
		} else {
			if (possibleMerchants[i].merchant === true && pattern.test(possibleMerchants[i].name.toLowerCase())) {
				merchant = possibleMerchants[i];
			}
		}
	}
	
	return merchant;  
};

Room.prototype.getWatersources = function(roomObj) {
	var i = 0,
	results = [],
	arrToSearch = roomObj.items.concat(roomObj.monsters),
	len = arrToSearch.length;
	
	for (i; i < len; i += 1) {
		if (arrToSearch[i].waterSource === true) {
			results.push(arrToSearch[i]);
		}
	}
	
	return results;  
};

Room.prototype.getWatersource = function(roomObj, searchStr) {
	var i = 0,
	waterSource = false,
	pattern = new RegExp(searchStr),
	len = roomObj.items.length;
	
	for (i; i < len; i += 1) {
		if (roomObj.items[i].waterSource === true && pattern.test(roomObj.items[i].name.toLowerCase())) {
			waterSource = roomObj.items[i];
		}
	}
	
	return waterSource;  
};

Room.prototype.addItem = function(roomObj, item) {
	roomObj.items.push(item);
};

Room.prototype.addItems = function(roomObj, items) {
	var i = 0;

	for (i; i < items.length; i += 1) {
		roomObj.items.push(items[i]);
	}
}

Room.prototype.getItem = function(roomObj, command) {
	return World.search(roomObj.items, command);
};


Room.prototype.getContainer = function(roomObj, command) {
	var container = World.search(roomObj.items, 'container', command);

	if (!container) {
		container = World.search(roomObj.items, 'corpse', command);
	}

	return container;
};

/*
Room.prototype.getContainer = function(roomObj, command) {
	var i = 0;

	for (i; i < roomObj.items.length; i += 1) {
		if ((roomObj.items[i].itemType === 'container'
			|| roomObj.items[i].itemType === 'corpse')
			&& roomObj.items[i].name.toLowerCase().indexOf(command.input) !== -1) {
			return roomObj.items[i];
		}
	}

	return false;
};
*/
Room.prototype.removeItem = function(roomObj, item) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.items.length; i += 1) {
		if (roomObj.items[i].refId !== item.refId) {
			newArr.push(roomObj.items[i]);
		}
	}

	roomObj.items = newArr;
};

Room.prototype.getClosestExit = function(roomObj, targetRoomObj) {
	var i = 0,
	closestExit = null;

	for (i; i < roomObj.exits.length; i += 1) {
		var exit = roomObj.exits[i];

	}

	return closestExit;
}

Room.prototype.getMonster = function(roomObj, command) {
	return World.search(roomObj.monsters, command);
};

Room.prototype.getPlayer = function(roomObj, command) {
	return World.search(roomObj.playersInRoom, command);
};

Room.prototype.getEntity = function(roomObj, command) {
	var result = this.getMonster(roomObj, command);

	if (!result) {
		result = this.getPlayer(roomObj, command);
	}

	return result;
};

Room.prototype.removePlayer = function(roomObj, player) {
	var i = 0,
	newArr = [];

	for (i; i < roomObj.playersInRoom.length; i += 1) {
		if (roomObj.playersInRoom[i].name !== player.name) {
			newArr.push(roomObj.playersInRoom[i]);
		}
	}

	player = null;

	roomObj.playersInRoom = newArr;
};

Room.prototype.removeMob = function(roomObj, mob) {
	var i = 0;

	for (i; i < roomObj.monsters.length; i += 1) {
		if (roomObj.monsters[i].refId === mob.refId) {
			roomObj.monsters.splice(i , 1);
		}
	}
};

module.exports = Room;
