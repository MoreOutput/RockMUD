
'use strict';
var World = require('../src/world'),
towerQuestKey = 'mine_access';

module.exports = {
	name: 'The Southern Mine',
	id: 'midgaard_academy',
	type: 'building',
	levels: 'All',
	description: 'A large, seemingly endless, gold mine whos original founders are now forgotten.',
	reloads: 0,
	author: 'Rocky',
	messages: [{
		msg: '<span class=\'grey\'>A cold northern gust makes its way through the area.</span>'
	}],
	quests: [{
		id: towerQuestKey,
		title: 'Going Deep',
		data: {
			// the player must give Radhghar 1 gold to enter the mines.
			permission: false
		},
		steps: {
			1: 'The Southern Mine is the worlds main source of both gold and coal. It is a large, seemingly endless, network of caves and corridors whos original creators are now forgotten.' 
			+ ' Give Charles a gold coin to gain access to the mine. Example: <strong class="warning">give 1 gold charles</strong>'
		}
	}],
	rooms: [
		{
			id: '1',
			title: 'Just outside of the Mine',
			area: 'midgaard_academy',
			content: 'This is the main entrance to the Southern Mine. A hole about fifty yards across is decorated with ropes and pullies powering a series of elevators. '
				+ 'There are fires and stations bustling with the activity of miners and camp workers.',
			outdoors: false,
			light: true,
			exits: [
				{
					cmd: 'north',
					id: '4',
					area: 'midgaard'
				}, {
					cmd: 'down',
					id: '2'
				}
			],
			monsters: [{
				name: 'Foreman Charles Stephenson',
				lastName: 'Stephenson',
				age: 59,
				displayName: 'Charles',
				charClass: 'fighter',
				level: 50,
				short: 'Mine Foreman Charles Stephenson',
				long: '<span class="yellow">Charles Stephenson</span> the mine Foreman is here',
				description: '',
				inName: 'Mine Foreman Charles Stephenson',
				race: 'human',
				id: 2,
				area: 'midgaard_academy',
				weight: 195,
				str: 10,
				dex: 8,
				damroll: 20,
				hitroll: 15,
				ac: 20,
				items: [],
				trainer: true,
				runOnAliveWhenEmpty: false,
				skills: [{
					id: 'climb',
					display: 'Improved Climbing',
					mod: 0,
					train: 30,
					type: 'passive',
					learned: true,
					prerequisites: {
						'level': 1
					}
				}],
				behaviors: [{
					module: 'radghar'
				}]
			}],
			items : []
		}, {
			id: '2',
			title: 'Climbing the side of the Academy Tower',
			area: 'midgaard_academy',
			moveMod: 2,
			content: '',
			light: true,
			exits: [
				{
					cmd: 'down',
					id: '1',
					area: 'midgaard_academy'
				}, {
					cmd: 'up',
					id: '3'
				}
			],
			behaviors: [{
				module: 'quest_check_room_enter',
				questId: towerQuestKey, 
				questCheck: function(quest, player, cmd) {
					if (cmd.msg === 'down') {
						if (quest.data.permission) {
							return true;
						} else {
							World.msgPlayer(player, {
								msg: '<strong>You don\'t have permission to enter the Mine.</strong>',
								styleClass: 'warning'
							});
		
							return false;
						}
					}
				}
			}]
		}, {
			id: '3',
			title: 'Climbing up the south side of the Academy Tower',
			area: 'midgaard_academy',
			moveMod: 2,
			content: '', 
			light: true,
			exits: [
				{
					cmd: 'down',
					id: '2',
					area: 'midgaard_academy'
				}, {
					cmd: 'up',
					id: '4'
				}
			]
		}, {
			id: '4',
			title: 'Further up the side of Midgaard Academy Tower',
			area: 'midgaard_academy',
			moveMod: 2,
			content: '',
			light: true,
			exits: [
				{
					cmd: 'up',
					id: '5',
					area: 'midgaard_academy'
				},
				{
					cmd: 'down',
					id: '3',
					area: 'midgaard_academy'
				}
			]
		}, {
			id: '5',
			title: 'Room at the top of the Academy Tower',
			area: 'midgaard_academy',
			content: '',
			light: true,
			monsters: [{
				name: 'Thomas',
				displayName: 'Thomas',
				charClass: 'fighter',
				level: 25,
				short: 'Squire Thomas',
				long: '<span class="yellow">Thomas a tall thin squire of Captain Radghar</span> is here standing next to the twower window',
				description: '',
				inName: 'Thomas',
				race: 'human',
				id: 3,
				area: 'midgaard_academy',
				weight: 155,
				diceMod: 5,
				str: 20,
				dex: 18,
				position: 'standing',
				attackType: 'punch',
				damroll: 20,
				hitroll: 15,
				ac: 20,
				items: [],
				runOnAliveWhenEmpty: false,
				behaviors: []
			}],
			exits: [{
				cmd: 'down',
				id: '4',
				area: 'midgaard_academy'
			}]
		},
		{
			id: '6',
			title: 'Main Guard House',
			area: 'midgaard_academy',
			content: '',
			light: true
		}
	]
};
