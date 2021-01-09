'use strict';
/*
	Prevents an item from being dropped
*/
module.exports = {
	beforeItemRemove: function(World, behavior, item, roomObj, target) {
		if (item.template === 'item') {
			return false;
		} else {
			return true;
		}
	}
};
