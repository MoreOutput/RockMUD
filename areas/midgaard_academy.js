'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
Character = require('../src/character').character,
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
	quests: [{
		id: 'mud_school',
		title: 'Midgaard Training Academy',
		entries: {
			0: 'You have joined the Midgaardian Academy! Climb to the top of the tower and begin training to make it official.'
		}
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
				}, {
					cmd: 'up',
					id: '2'
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
				var climbSkill = Character.getSkill(entity, 'climb'),
				msg = '';

				if (World.dice.roll(1, 3) === 1) {
					msg += '<p>A strong wind causes you to sway against the Tower.</p>'
				}

				if (!climbSkill && entity.isPlayer && entity.level === 1) {
					msg += '<p>You do not have the climb skill. Climbing further could result in death!</p>';
				}	

				if (msg) {
					World.msgPlayer(entity, {
						msg: msg
					});
				}
			},
			onExit: function(roomObj, entity, incomingRoomObj, command) {

			}
		}, {
			id: '3',
			title: 'Further up the side of the Academy Tower',
			area: 'midgaard_academy',
			moveMod: 2,
			content: '',
			exits: [
				{
					cmd: 'down',
					id: '2',
					area: 'midgaard_academy'
				}
			],
			beforeEnter: function(roomObj, entity, incomingRoomObj, command) {
				var climbSkill,
				strMod = World.dice.getStrMod(entity),
				success = true,
				climbRoll,
				climbCheck = 5,
				msg = '';

				climbSkill = Character.getSkill(entity, 'climb');

				if (!climbSkill) {
					climbRoll = World.dice.roll(1, 3, strMod);
			
					if (climbRoll < climbCheck) {
						msg += '<strong>You fail to climb up and slip downward!</strong>';

						success = false;
					}

					if (msg && entity.isPlayer) {
						if (success === false) {
							Cmd.move(entity, {
								cmd: 'move',
								arg: 'down'
							});
						}

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
					return true;
				}
			}
		}
	]
};

