'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

/*
	Wander behavior. Mob will walk about selecting a random move direction from
	mob.moveDirections. 

	If the mob.stayinArea property is set to false the mob can wander outside of its starting area. 

	Adding a mob.wanderCheck value provides a check against 1d10; movement only occurs if the roll 
	beats the given wanderCheck value.
*/
module.exports = {
	stayInArea: true,
	wanderCheck: 1,
	moveDirections: ['down', 'up', 'north', 'east', 'west', 'south'],
	onAlive: function(roomObj) {
		var roll = World.dice.roll(1, 10),
		exitObj,
		direction;
		
		if (this.wanderCheck && roll > this.wanderCheck) {
			if (!this.moveDirections) {
				this.moveDirections = this.moveDirections;
			}

			if (!this.stayInArea) {
				this.stayInArea = this.stayInArea;
			}

			direction = this.moveDirections[World.dice.roll(1, this.moveDirections.length) - 1];

			exitObj = Room.getExit(roomObj, direction);

			if (exitObj && ((this.stayInArea === false) || (this.stayInArea === true && this.area === exitObj.area))) {
				Cmd.move(this, {
					arg: direction,
					roomObj: roomObj
				});
			}
		}
	}
};
