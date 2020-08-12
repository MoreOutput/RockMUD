'use strict';
var World = require('../src/world');

/*
	Prevents an item from being dropped
*/
module.exports = {
	beforeItemRemove: function(behavior, item, roomObj, target) {
		if (item.template === 'item') {
			return false;
		} else {
			return true;
		}
	}
};
