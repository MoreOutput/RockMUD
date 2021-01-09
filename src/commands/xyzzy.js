/**
 * This file serves as an example of implementing a command on a file basis
 * This command will be added to the object prototype outlined in commands.
 */
'use strict'
module.exports = function(entity, command, World) {
	if (entity.position !== 'sleeping') {
		World.msgPlayer(entity, {msg: 'Nothing happens. Why would it?', styleClass: 'error' });
	} else {
		World.msgPlayer(entity, {msg: 'You dream of powerful forces.', styleClass: 'error' });
	}
};
