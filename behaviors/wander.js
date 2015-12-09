/*
MOBs with the wander behavior...wander around. They can be assigned
to stay within their assigned area, or to wander freely -- along with
various terrian oriented options.
*/
'use strict';
Dice = require('../src/dice').roller,
World = require('../src/world').world;

var Wander = function(mob) {
	this.mob = mob;
	this.directions = [];

	if (!mob.boundToArea) {
		this.boundToArea = true;
	} else {
		this.boundToArea = mob.boundToArea;
	}

	if (mob.behavior.directions) {
		this.directions = mob.behavior.directions;
	} else {
		this.directions = ['north', 'east', 'west', 'south', 'door'];
	}
};

Wander.prototype.generateDirection = function() {
	var direction = World.shuffle(this.exits)[0];

	return direction;
};

Wander.prototype.move = function(roomObj, direction) {
	var walk = this;

	if (this.boundToArea) {
		Rooms.getAdjacent(roomid, function(rooms) {
			rooms.forEach(function(item, i) {
				if (item.area === walk.mob.area) {
					Cmd.fire('move north', false, false, function() {

					});

					return true;
				}
			});
		});
	} else {
		Cmd.fire('move north', false, false, function() {

		});
	}
}

Wander.prototype.onAlive = function() {
	if () {

	}
};
