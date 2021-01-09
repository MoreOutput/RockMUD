
'use strict';
var towerQuestKey = 'mine_access';

module.exports = {
	name: 'The Southern Mine',
	id: 'midgaard_academy',
	type: ['mine', 'subterranean'],
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
			permission: false,
			level: 100
		},
		steps: {
			1: 'The Southern Mine is the worlds main source of both gold and coal.' 
			+ ' Give Charles a gold coin to gain access to the current level of the mine. <strong>You can sell furs to Tom Kerr for gold</strong>. Example: <strong class="warning">give 1 gold charles</strong>'
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
				displayName: 'Charles the Mine Foreman',
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
					module: 'mine_foreman'
				}]
			}],
			items : []
		}, {
			id: '2',
			title: 'Enterance to the Southern Mine',
			area: 'midgaard_academy',
			moveMod: 2,
			content: '',
			light: true,
			// the mine shaft will automatically drop off the player in the current active level
			exits: [],
			behaviors: [{
				module: 'quest_check_room_enter',
				questId: towerQuestKey, 
				questCheck: function(World, quest, player, cmd) {
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
		}
	]
};
