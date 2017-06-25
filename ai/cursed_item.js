'use strict';
var Cmd = require('../src/commands'),
Room = require('../src/rooms'),
World = require('../src/world');

/*
	Prevents an item from being dropped
*/
module.exports = {
	beforeDrop: function(item, roomObj, target) {
		if (item.template === 'item') {
			return false;
		} else {
			return true;
		}
	}
};
