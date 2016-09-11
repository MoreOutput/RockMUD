'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	name : 'The Great Valley',
	id : '2',
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
	afterLoad: function() {
		var x = 10,
		y = 10,
		roomObj,
		generateNorthOf = World.getRoomObject(this.name, this.defaultRoom),
		i = 0,
		j = 0;

		for (i; i < y; i += 1) {
			j = 0;
				
			for (j; j < x; j += 1) {
				roomObj = World.extend({}, World.roomTemplate);
			
				roomObj.id = i + '-' + j;			
				roomObj.area = this.name;
				roomObj.content = 'A room';
				roomObj.title = 'Empty room';
				roomObj.playersInRoom = [];
				roomObj.exits = [];
				
				// top-left corner
				if (i === y - 1 && j === x - 1) {
					roomObj.exits = [{
						cmd: 'north',
						id: y + '-' + (j + 1),
						area: this.name
					}, {
						cmd: 'east',
						id: y + '-' + (j + 1),
						area: this.name
					}];
				// bottom left corner
				} else if (i === 0 && j === 0) {
					roomObj.exits = [{
						cmd: 'south',
						area: this.name,
						id: this.defaultRoom
					}, {
						cmd: 'east',
						id: y + '-' + (j + 1),
						area: this.name
					}];
				}
			
				this.rooms.push(roomObj);
			}
		}

		i = 0;

		generateNorthOf.exits.push({
			cmd: 'north',
			id: '0-0',
			area: this.name
		});
	},
	rooms: [
		{
			id: '1',
			title: 'Just outside the northern exit',
			area: 'The Great Valley',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			exits : [
				{
					cmd: 'south',
					id: '2',
					area: 'Midgaard'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [],
			flags: [],
			outdoors: true
		}
	]
};

