'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	name: 'Midgaard Academy',
	id: 'midgaard_academy',
	type: 'building',
	levels: 'All',
	description: 'Famous for preparing new adventuers for the world of RockMUD.',
	reloads: 0,
	author: 'Rocky',
	messages: [{
		msg: '<span class=\'grey\'>The sounds of sparring apprentices can be heard throughout the halls.</span>'
	}],
	rooms: [
		{
			id: '1',
			title: 'Academy Entrance',
			area: 'midgaard_academy',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: false,
			exits: [
				{
					cmd: 'down',
					id: '1',
					area: 'midgaard'
				}
			],
			monsters: [{
				name: 'Radghar',
				displayName: 'Radghar',
				charClass: 'fighter',
				level: 35,
				short: 'Lord Radghar',
				long: '<span class="yellow">Radghar</span>, a retired Midgaardian guard captain is here training recurits',
				description: '',
				inName: 'Lord Radghar',
				race: 'human',
				id: 2,
				area: 'midgaard_academy',
				weight: 195,
				diceNum: 3,
				diceSides: 10,
				diceMod: 5,
				str: 20,
				dex: 18,
				position: 'standing',
				attackType: 'punch',
				damRoll: 20,
				hitRoll: 15,
				ac: 20,
				items: [],
				trainer: true,
				behaviors: [{
					module: 'radghar'
				}]
			}],
			items : []
		}
	]
};

