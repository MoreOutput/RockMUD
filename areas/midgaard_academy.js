
'use strict';
var World = require('../src/world');

module.exports = {
	name: 'The Hole',
	id: 'midgaard_academy',
	type: 'building',
	levels: 'All',
	description: 'An large mine. It\'s origins are unknown and no one has ever reached the bottom',
	reloads: 0,
	author: 'Rocky',
	messages: [{
		msg: '<span class=\'grey\'>A cold northern gust makes its way through the area.</span>'
	}],
	quests: [{
		id: 'mine_access',
		title: 'Going Deep',
		data: {
			// the player must give Radhghar 1 gold to enter the mines.
			permission: false
		},
		steps: {
			1: 'The Northern Mine is a largley undiscovered hole in the ground with unknown origins. Give Radghar a gold coin to gain access to the mine.'
				+ ' Example: give 1 gold rad'
		}
	}],
	rooms: [
		{
			id: '1',
			title: 'Entrance to the Mine',
			area: 'midgaard_academy',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. '
				+ 'Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: false,
			light: true,
			exits: [
				{
					cmd: 'down',
					id: '1',
					area: 'midgaard'
				}, {
					cmd: 'up',
					id: '2'
				}
			],
			monsters: [{
				name: 'Radghar',
				displayName: 'Radghar',
				charClass: 'fighter',
				level: 50,
				short: 'Lord Radghar',
				long: '<span class="yellow">Radghar</span>, a retired the camp captain is here training recruits',
				description: '',
				inName: 'Lord Radghar',
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
			onEnter: function(roomObj, entity, incomingRoomObj, command) {
				var climbSkill = World.character.getSkill(entity, 'climb'),
				displayAfter = 1200,
				msg = '';

				if (World.dice.roll(1, 3) === 1) {
					msg += '<strong class="grey">A strong wind causes you to sway against the Tower.</strong> ';
				}

				if (!climbSkill && entity.isPlayer && entity.level === 1) {
					msg += 'You do not have the climb skill. Climbing further could result in a fall!';
				}

				if (msg) {
					World.msgPlayer(entity, {
						msg: '<p>' + msg + '</p>'
					});
				}
			}
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
			],
			onEnter: function(roomObj, entity, incomingRoomObj, command) {
				var climbSkill = World.character.getSkill(entity, 'climb'),
				displayAfter = 1200,
				msg = '';

				if (!climbSkill && entity.isPlayer && entity.level === 1) {
					msg += 'You do not have the climb skill. Be careful!!';
				}	
	
				if (msg) {
					World.msgPlayer(entity, {
						msg: '<p>' + msg + '</p>'
					});
				}
			}
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
			],
			beforeEnter: function(roomObj, entity, incomingRoomObj, command) {
				var climbSkill,
				strMod = World.dice.getStrMod(entity),
				success = true,
				climbRoll,
				msg = '';

				climbSkill = World.character.getSkill(entity, 'climb');

				if (climbSkill) {
					climbRoll = World.dice.roll(1, 100);

					if (climbRoll >= climbSkill.train + strMod) {
						msg += '<strong>You fail to climb up!</strong>';
	
						success = false;
					}

					if (msg && entity.isPlayer) {
						World.msgPlayer(entity, {
							msg: msg
						});

						if (success) {
							return true;
						} else {
							return false;
						}
					}
				} else {
					msg += '<strong>You fail to climb up and fall downward!</strong>';

					World.addCommand({
						cmd: 'move',
						arg: 'down'
					}, entity);

					World.msgPlayer(entity, {
						msg: msg
					});

					return false;
				}
			}
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
				onAlive: function(thomas, room) {
					if (room.playersInRoom.length && World.dice.roll(1, 10) === 1) {
						World.addCommand({
							cmd: 'emote',
							msg: 'looks around the room.',
							roomObj: room
						}, thomas);
					}
				}
			}],
			exits: [{
				cmd: 'down',
				id: '4',
				area: 'midgaard_academy'
			}],
			onEnter: function(roomObj, entity, incomingRoomObj, command) {
				var msg = 'You climb over some railing and reach the roof lantern of the Academy Tower.';

				World.msgPlayer(entity, {
					msg: '<p>' + msg + '</p>',
					styleClass: 'success'
				});
			}
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
