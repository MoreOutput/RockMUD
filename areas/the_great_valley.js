'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	name : 'The Great Valley',
	id : '2',
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
