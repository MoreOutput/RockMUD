'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

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
	beforeLoad: function() {
		var x = 10,
		y = 10,
		roomObj,
		generateNorthOf = World.getRoomObject(this.name, this.defaultRoom),
		i = 0,
		enteranceRoomId = '4-0',
		j = 0;

		for (i; i < x; i += 1) {
			j = 0;
				
			for (j; j < y; j += 1) {
				roomObj = World.extend({}, World.roomTemplate);
			
				roomObj.id = i + '-' + j;
				roomObj.content = 'A room';
				roomObj.title = 'Empty room ' +  i + '-' + j;
				roomObj.playersInRoom = [];
				roomObj.exits = [];

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

		roomObj = World.getRoomObject(this.name, enteranceRoomId);

		roomObj.exits.push({
			cmd: 'south',
			id: this.defaultRoom,
			area: this.name
		});

		generateNorthOf.exits.push({
			cmd: 'north',
			id: enteranceRoomId,
			area: this.name
		});
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
				}
			],
			playersInRoom: [],
			monsters: [{
				name: 'Boar',
				displayName: ['Brown boar', 'Light brown boar', 'Scarred boar'],
				level: 1,
				short: ['a brown boar', 'a large scarred boar', 'a scarred boar', 'a boar', 'a young tan boar'],
				long: ['A boar with a number of scars on its side is here', 'A large dark brown boar', 'A larget brown boar is here'],
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
				size: {value: 2, display: 'very small'},
				itemType: 'mob',
				spawn: 10,
				behaviors: [{  
					module: 'wander'
				}]	
			}],
			items: [],
			flags: [],
			outdoors: true
		}
	]
};

