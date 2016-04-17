'use strict';
var Cmd = require('../src/commands').cmd,
	Room = require('../src/rooms').room,
	World = require('../src/world').world;

/*
  Generalized shopkeeper behavior.
*/

module.exports = {
	onAlive: function() {
		var mob = this;
	},
	onSay: function(target, roomObj) {
		console.log('someone said something!');
	},
	onVisit: function(target, roomObj) {
		var mob = this;
		
		Cmd.say(mob, {
			msg: 'Hello ' + target.displayName + ', welcome to my store. Looking for anything in particular?'
 		});
	}
};
