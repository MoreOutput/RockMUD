'use strict';
var World = require('../src/world');

module.exports = {
	name : 'The Great Valley',
	id: 'the_great_valley',
	defaultRoom: '1',
	type : 'grasslands',
	levels : 'All',
	description : 'The second area.',
	reloads: 0,
	author: 'Rocky',
	messages: [
		{
			msg: 'A warm breeze blows southward toward Midgaard.'
		}
	],
	beforeLoad: function(fn) {
		var x = 10,
		y = 10,
		roomObj,
		generateNorthOf = World.getRoomObject(this.name, this.defaultRoom),
		i = 0,
		j = 0,
		enteranceRoomId = '0-0',
		startingRoom;

		if (this.rooms.length === 1) {
			for (i; i < x; i += 1) {
				j = 0;

				for (j; j < y; j += 1) {
					// copy the template
					roomObj = JSON.parse(JSON.stringify(World.roomTemplate)),
					roomObj.id = i + '-' + j;
					roomObj.content = 'A room';
					roomObj.title = 'Empty room ' +  i + '-' + j;

					if (i === 0 && j === 0) {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'east',
							id: (i + 1) + '-' + j
						});
					} else if (i === 0 && j === y - 1) {
						roomObj.exits.push({
							cmd: 'east',
							id: (i + 1) + '-' + j
						}, {
							cmd: 'south',
							id: i + (y - 1)
						});
					} else if (i === 0 && j < y - 1) {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'east',
							id: (i + 1) + '-' + (j + 1)
						}, {
							cmd: 'south',
							id: (i) + '-' + (j - 1)
						});
					} else if (i === x - 1 && j === 0) {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					} else if (i < x -1  && j === 0) {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'east',
							id: (i + 1) + '-' + j
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					} else if (i < x - 1 && j === y - 1) {
						roomObj.exits.push({
							cmd: 'east',
							id: (i + 1) + '-' + j
						}, {
							cmd: 'south',
							id: i + '-' + (j - 1)
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					} else if (i === x - 1 && j === y - 1) {
						roomObj.exits.push({
							cmd: 'south',
							id: i + '-' + (j - 1)
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					} else if (i === x - 1 && j < y - 1) {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'south',
							id: (i) + '-' + (j - 1)
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					} else {
						roomObj.exits.push({
							cmd: 'north',
							id: i + '-' + (j + 1)
						}, {
							cmd: 'east',
							id: (i + 1) + '-' + j
						}, {
							cmd: 'south',
							id: i + '-' + (j - 1)
						}, {
							cmd: 'west',
							id: (i - 1) + '-' + j
						});
					}

					this.rooms.push(roomObj);
				}
			}

			startingRoom = World.getRoomObject(this.name, enteranceRoomId);

			startingRoom.exits.push({
				cmd: 'south',
				id: this.defaultRoom,
				area: this.id
			});

			i = 0;

			for (i; i < this.rooms.length; i += 1) {
				if (this.rooms[i].monsters.length === 0 && World.dice.roll(1, 3) === 1) {
					this.rooms[i].monsters.push({
						name: 'Boar',
						displayName: ['Brown boar', 'Light brown boar', 'Scarred boar'],
						level: 1,
						short: ['a brown boar', 'a large scarred boar', 'a scarred boar', 'a boar', 'a tan boar'],
						long: [
							'A boar with a number of scars on its side is here',
							'A dark brown boar',
							'A large brown boar is here'
						],
						inName: 'A boar',
						race: 'animal',
						id: '6',
						area: 'the_great_valley',
						weight: 120,
						position: 'standing',
						attackType: 'bite',
						ac: 4,
						hp: 15,
						chp: 13,
						gold: 1,
						str: 3,
						size: {value: 2, display: 'very small'},
						onRolled: function(mob) {
							if (World.dice.roll(1, 3) > 1) {
								mob.behaviors = [];
							}
						},
						behaviors: [{
							module: 'wander'
						}]
					});
				}
			}
		}

		return fn();
	},
	rooms: [
		{
			id: '1',
			title: 'Just outside the northern exit',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			exits : [
				{
					cmd: 'south',
					id: '2',
					area: 'midgaard'
				},
				{
					cmd: 'north',
					id: '0-0',
					area: 'the_great_valley'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [],
			outdoors: true
		}
	]
};
