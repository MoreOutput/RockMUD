'use strict';
var World = require('../src/world'),
areaId = 'the_great_valley';

module.exports = {
	name : 'The Winter Plain',
	id: areaId,
	defaultRoom: '1',
	type : ['snow', 'plain'],
	levels : 'All',
	description : 'The second area.',
	reloads: 0,
	author: 'RockMUD',
	messages: [
		{
			msg: 'A cold breeze blows southward toward the camp.',
			msg: 'A light snow begins to fall.'
		}
	],
	beforeLoad: function(fn) {
		var x = 7,
		y = 7,
		roomObj,
		generateNorthOf = World.getRoomObject(this.name, this.defaultRoom),
		i = 0,
		j = 0;

		if (this.rooms.length === 1) {
			for (i; i < x; i += 1) {
				j = 0;

				for (j; j < y; j += 1) {
					// copy the template
					roomObj = JSON.parse(JSON.stringify(World.roomTemplate)),
					roomObj.id = i + '-' + j;
					roomObj.moveMod = 2;

					var titleRoll = World.dice.roll(1, 3);

					if (titleRoll === 1) {
						roomObj.title = 'Vast sheet of untouched snow';
						roomObj.content = 'Nothing but white snow in all directions. The snow is several feet deep and makes movement difficult.';
					} else if (titleRoll === 2) {
						roomObj.title = 'Endless white plains';
						roomObj.content = 'The quiet snowy clearing continues to strech in all directions. A persistent cold wind heads southward toward camp.';
					} else {
						roomObj.title = 'A snowy incline';
						roomObj.content = 'The quiet snowy clearing continues to strech in all directions.';
					}

					roomObj.titleStyleClass = 'blue';

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

			if (this.rooms[1].exits.length < 3) {
				this.rooms[1].exits.push({
					cmd: 'south',
					id: this.defaultRoom,
					area: this.id
				});
			}

			i = 0;

			for (i; i < this.rooms.length; i += 1) {
				if (this.rooms[i].monsters.length === 0 && World.dice.roll(1, 4) === 1) {
					var mob = {
						hp: 42,
						name: 'Dark Brown Elk',
						displayName: 'Dark Brown Elk',
						combatName: 'the dark brown elk',
						level: 1,
						short: ['a dark brown elk', 'a large elk'],
						long: [
							'An elk with a thick dark brown coat is here'
						],
						inName: 'An elk',
						race: 'animal',
						id: '6',
						area: areaId,
						weight: 120,
						position: 'standing',
						attackType: 'stab',
						unarmedType: 'horns',
						runOnAliveWhenEmpty: true,
						ac: 4,
						size: {value: 3, display: 'medium'},
						fist: {
							name: "Fighting unarmed!",
							displayName: "horns",
							level: 1,
							diceNum: 2,
							diceSides: 2,
							itemType: "weapon",
							attackType: "stab",
							weaponType: "unarmed",
							material: "flesh",
							modifiers: {},
							diceMod: -5,
							slot: "hands",
							short: "your hands"
						},
						onRolled: function(mob) {
							if (World.dice.roll(1, 3) > 1) {
								mob.behaviors = [];
							}
						},
						behaviors: [{
							module: 'wander'
						}]
					};

					if (World.dice.roll(1, 4) === 1) {
						mob.long = 'A large elk with striking white antlers';
						mob.items = [];
						mob.items.push({
							name: 'Ivory Antlers', 
							short: 'a set of large white antlers',
							long: 'Gleaming ivory antlers were left here.' ,
							area: areaId,
							id: '100',
							level: 1,
							itemType: 'junk',
							material: 'ivory',
							weight: 0,
							value: 10
						});
					}

					this.rooms[i].monsters.push(mob);
				}
			}
		}

		return fn();
	},
	rooms: [
		{
			id: '1',
			title: 'Just outside camp',
			content: 'The first northwards steps outside of camp. An endless sheet of snow seems to stretch forever northward.',
			exits : [
				{
					cmd: 'south',
					id: '2',
					area: 'midgaard'
				},
				{
					cmd: 'north',
					id: '0-0',
					area: areaId
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [],
			outdoors: true
		}
	]
};
