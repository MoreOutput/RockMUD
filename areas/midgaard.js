'use strict';
var Cmd = require('../src/commands'),
Room = require('../src/rooms'),
Character = require('../src/character'),
World = require('../src/world');

module.exports = {
	name: 'Midgaard',
	id: 'midgaard',
	type: 'city',
	levels: 'All',
	description: 'The first city.',
	reloads: 0,
	created: '',
	saved: '',
	author: 'Rocky',
	messages: [
		{msg: 'A cool breeze blows through the streets of Midgaard.'},
		{msg: 'The bustle of the city can be distracting. Keep an eye out for thieves.'}
	],
	respawnOn: 8,
	persistence: false,
	rooms: [
		{
			id: '1',
			title: 'Midgaard Town Square',
			light: true,
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: true,
			exits: [
				{
					cmd: 'north',
					id: '2'
				}, {
					cmd: 'east',
					id: '3'
				}, {
					cmd: 'south',
					id: '4'
				}, {
					cmd: 'west',
					id: '5'
				}, {
					cmd: 'up',
					id: '1',
					area: 'midgaard_academy'
				}, {
					cmd: 'down',
					id: '6',
					door: {
						isOpen: false,
						locked: true,
						key: '101',
						openMsg: 'A foul smell flows in from below.',
						name: 'gate'
					}
				}
			],
			playersInRoom: [],
			monsters: [
				{
					name: 'Rufus',
					level: 15,
					short: 'Mayor Rufus',
					long: 'Rufus, current mayor of Midgaard, is here pacing around the room',
					description: '',
					inName: 'Mayor Rufus',
					race: 'human',
					id: 9,
					area: 'midgaard',
					weight: 245,
					diceNum: 2,
					diceSides: 8,
					diceMod: 5,
					str: 16,
					position: 'standing',
					attackType: 'punch',
					damRoll: 10,
					hitRoll: 10,
					ac: 20,
					wanderCheck: 38,
					itemType: 'mob',
					runOnAliveWhenEmpty: false,
					items: [{
						name: 'Midgaard city key',
						short: 'a thin gold key',
						long: 'A thin gold key with a ruby embbeded to the end lies here' ,
						area: 'midgaard',
						id: '10',
						level: 1,
						itemType: 'key',
						material: 'gold', 
						weight: 0,
						slot: '',
						value: 1000,
						equipped: false,
						isKey: true
					}],
					behaviors: [{
						module: 'mayor'
					}, {
						module: 'wander'
					}]
				}, {
					name: 'Hound Dog',
					displayName: 'Hunting hound',
					level: 1,
					short: 'a healthy looking brown and white hound',
					long: 'A large spotted brown and white hound sniffs about the area',
					inName: 'A canine',
					race: 'animal',
					id: '6',
					area: 'midgaard',
					weight: 120,
					position: 'standing',
					attackType: 'bite',
					ac: 4,
					hp: 15,
					chp: 15,
					gold: 1,
					size: {value: 2, display: 'very small'},
					itemType: 'mob',
					behaviors: [{  
						module: 'wander'
					}]
				}
			],
			items: [{
				name: 'Fountain',
				short: 'a large stone fountain',
				long: 'A large stone fountain full of sparkling water',
				area: 'midgaard',
				id: '112',
				waterSource: true,
				weight: 10000,
				itemType: 'ornament'
			}, {
				name: 'Leather Armor',
				short: 'a leather chestplate',
				long: 'Some leather armor was left here',
				area: 'midgaard',
				id: '111',
				level: 1,
				itemType: 'armor',
				material: 'leather',
				ac: 3,
				weight: 1,
				slot: 'body',
				equipped: false,
				value: 5
			}, {
				name: 'Torch', 
				short: 'a wooden torch',
				long: 'A wooden torch rests on the ground' ,
				area: 'midgaard',
				id: '104', 
				level: 1,
				itemType: 'weapon',
				material: 'wood',
				weaponType: 'club',
				diceNum: 1, 
				diceSides: 2,
				diceMod: -5,
				attackType: 'smash', 
				ac: -1,
				weight: 2,
				slot: 'hands',
				equipped: false,
				light: true,
				lightDecay: 10,
				flickerMsg: '',
				extinguishMsg: '',
				spell: {
					id: 'spark',
					display: 'Spark',
					mod: 0,
					train: 85,
					type: 'spell',
					wait: 2
				},
				beforeDrop: function(item, roomObj) {
					return true;
				}
			}, {
				name: 'Small Buckler', 
				short: 'a small round buckler',
				long: 'A small basic looking round buckler lies here' ,
				area: 'midgaard',
				id: '103', 
				level: 1,
				itemType: 'shield',
				material: 'wood', 
				ac: 2, 
				weight: 1,
				slot: 'hands',
				equipped: false,
				affects: [{
					id: 'hidden',
					affect: 'hidden',
					decay: -1
				}]
			}, {
				name: 'Loaf of Bread',
				short: 'a brown loaf of bread',
				long: 'A rather stale looking loaf of bread is lying on the ground' ,
				area: 'midgaard',
				id: '7',
				level: 1,
				itemType: 'food',
				weight: 0.5,
				diceNum: 1,
				diceSides: 6,
				diceMod: 1,
				decay: 3
			}, {
				name: 'Short Sword',
				displayName: 'Short Sword',
				short: 'a common looking short sword',
				long: 'A short sword with a hilt wrapped in leather straps was left on the ground' ,
				area: 'midgaard',
				id: '8',
				level: 1,
				itemType: 'weapon',
				weaponType: 'sword',
				material: 'iron', 
				diceNum: 1, 
				diceSides: 6,
				diceMod: 0,
				attackType: 'slash', 
				attackElement: '',
				weight: 4,
				slot: 'hands',
				equipped: false,
				modifiers: {
					damRoll: 1
				}
			}, {
				name: 'Burlap sack',
				short: 'a worn, tan, burlap sack',
				long: 'A tan burlap sack with frizzed edges and various stains lies here',
				area: 'midgaard',
				id: '27',
				level: 1,
				itemType: 'container',
				weight: 1,
				items: [{
					name: 'Sewer key', 
					short: 'small rusty key',
					long: 'A small rusty key made iron was left here',
					area: 'midgaard',
					id: '101',
					level: 1,
					itemType: 'key',
					material: 'iron', 
					weight: 0,
					slot: '',
					value: 1,
					equipped: false,
					isKey: true
				}],
				isOpen: true,
				carryLimit: 50
			}],
			beforeEnter: function(roomObj, fromRoom, target) {
				return true;
			},
			onEnter: function(roomObj, target) {
				
			}
		},
		{
			id: '2',
			title: 'North of Town Square',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: true,
			exits: [
				{
					cmd: 'south',
					id: '1'
				}, {
					cmd: 'north',
					id: '1',
					area: 'the_great_valley'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [{
				name: 'Tattered Buckler', 
				short: 'a tattered buckler',
				long: 'A round buckler that looks like its seen heavy use is lying here' ,
				area: 'midgaard',
				id: '2', 
				level: 1,
				itemType: 'shield',
				material: 'wood', 
				ac: 2, 
				weight: 6,
				slot: 'hands',
				equipped: false
			}]
		},
		{
			id: '3',
			title: 'East of Town Square',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			terrain: 'stone-road',
			terrainMod: 1,
			outdoors: true,
			exits: [
				{
					cmd: 'west',
					id: '1'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [{
				name: 'Brown waterskin', 
				short: 'a light brown waterskin',
				long: 'A brown waterskin, the hide seems worn and used, was left here.' ,
				area: 'midgaard',
				id: '102',
				level: 1,
				drinks: 6,
				maxDrinks: 6,
				itemType: 'bottle',
				material: 'leather',
				weight: 0,
				value: 1,
				equipped: false
			}]
		},
		{
			id: '4',
			title: 'South of Town Square',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: true,
			exits: [
				{
					cmd: 'north',
					id: '1'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: []
		},
		{
			id: '5',
			title: 'West of Town Square',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			exits: [
				{
					cmd: 'west',
					id: '8'
				}, {
					cmd: 'east',
					id: '1'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [{
				name: 'Leather Helmet', 
				short: 'a leather helmet',
				long: 'A simple leather helmet was left here' ,
				area: 'midgaard',
				id: '3', 
				level: 1,
				itemType: 'armor',
				material: 'wood', 
				ac: 1, 
				weight: 1,
				slot: 'head',
				equipped: false
			}]
		},
		{
			id: '6',
			title: 'Beneath Town Square',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			size: {value: 3, display: 'medium'},
			outdoors: false,
			exits: [
				{
					cmd: 'up',
					id: '1',
					door: {
						name: 'gate',
						isOpen: false,
						locked: true,
						key: '101'
					}
				}
			],
			playersInRoom: [],
			monsters: [{
				name: 'Large Alligator',
				level: 3,
				race: 'animal',
				short: 'a mean looking Alligator',
				long: 'A large mean looking Alligator',
				diceNum: 2,
				diceSides: 2,
				diceMod: 2,
				hp: 30,
				chp: 30,
				kingdom: 'reptile',
				gold: 3,
				size: {value: 3, display: 'medium'},
				attackOnVisit: true,
				behaviors: [{
					module: 'aggie'
				}]
			}],
			items: []
		},
		{
			id: '8',
			title: 'The General Store',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: false,
			exits: [
				{
					cmd: 'east',
					id: '5'
				}
			],
			playersInRoom: [],
			monsters: [
				{
					name: 'Thomas',
					level: 15,
					short: 'Thomas, the dwarven shopkeep',
					long: 'Thomas the dwarven shopkeeper is here',
					description: '',
					race: 'dwarf',
					id: '9',
					area: 'midgaard',
					weight: 200,
					diceNum: 2,
					diceSides: 8,
					diceMod: 5,
					str: 18,
					gold: 1000,
					position: 'standing',
					attackType: 'punch',
					damRoll: 10,
					hitRoll: 10,
					ac: 20,
					merchant: true,
					itemType: 'mob',
					preventItemDecay: true,
					items: [{
						name: 'Pemmican',
						short: 'a piece of Pemmican',
						long: 'A bit of Pemmican was left here' ,
						area: 'midgaard',
						id: '110',
						level: 1,
						itemType: 'food',
						material: 'flesh', 
						weight: 0,
						slot: '',
						value: 10,
						equipped: false,
						spawn: 3
					}],
					behaviors: [],
					beforeSell: function(merchant, roomObj, buyer) {
						if (buyer.race === 'ogre') {
							Cmd.say(merchant, {
								msg: 'Sell to an Ogre? Are you insane?',
								roomObj: roomObj
							});

							return false;
						} else {
							return true;
						}
					}
				}
			],
			items: []
		}
	]
};
