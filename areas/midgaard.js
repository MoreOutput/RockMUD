'use strict';
var World = require('../src/world');

module.exports = {
	name: 'Midgaard',
	id: 'midgaard',
	type: ['camp'],
	levels: 'All',
	description: 'Base camp for the Southern Mine across the sea.',
	reloads: 0,
	created: '',
	saved: '',
	author: 'Rocky',
	messages: [
		{msg: 'A cold breeze blows through the camp.'},
		{msg: 'A strong southern gust tests the tents.'}
	],
	respawnOn: 8,
	persistence: false,
	runOnAliveWhenEmpty: true,
	rooms: [
		{
			id: '1',
			title: 'Center of the Southern Mine Encampment',
			light: true,
			area: 'midgaard',
			content: 'An open space at the intersection of rows upon rows of snow covered tents. A large fire warms the area.',
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
					cmd: 'down',
					id: '6',
					door: true,
					isOpen: false,
					locked: true,
					key: '101',
					name: 'gate',
					openMsg: 'A foul smell flows in from below.'
				}
			],
			playersInRoom: [],
			monsters: [
				{
					name: 'Expedition Leader William',
					lastName: 'Green',
					level: 15,
					short: 'Expedition Leader William Green',
					long: 'William Green the leader of the current mine expedition is here overseeing camp activities',
					description: '',
					inName: 'Expedition Leader William',
					race: 'human',
					id: 9,
					area: 'midgaard',
					weight: 245,
					str: 16,
					position: 'standing',
					attackType: 'punch',
					damroll: 10,
					hitroll: 10,
					ac: 20,
					runOnAliveWhenEmpty: true,
					items: [
						{
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
						},
						{
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
						}
					],
					behaviors: [{
						module: 'expedition_leader'
					}, {
						module: 'wander',
						moveDirections: ['north', 'east', 'west', 'south']
					}, {
						module: 'hunt',
						
					}]
				}
			],
			items: [
				{
					name: 'Wooden water barrel',
					short: 'a barrel of fresh water',
					long: 'A large wooden barrel filled with water',
					area: 'midgaard',
					id: '112',
					waterSource: true,
					weight: 10000,
					modifiers: {
						thirst: -1
					},
					itemType: 'ornament'
				},
				{
					name: 'Wooden Torch',
					short: 'a wooden torch',
					long: 'A wooden torch rests on the ground',
					area: 'midgaard',
					id: '104', 
					level: 1,
					itemType: 'weapon',
					material: 'wood',
					weaponType: 'club',
					diceNum: 1, 
					diceSides: 2,
					attackType: 'smash',
					weight: 2,
					slot: 'hands',
					equipped: false,
					light: true,
					lightDecay: 10,
					flickerMsg: '',
					extinguishMsg: '',
					behaviors: [{
						module: 'cursed_item'
					}],
					spell: {
						id: 'spark',
						display: 'Spark',
						mod: 0,
						train: 85,
						type: 'spell',
						wait: 2
					}
				}
			]
		},
		{
			id: '2',
			title: 'North of Camp Center',
			area: 'midgaard',
			content: 'A couple of large stained tents are here shuttering in the wind. Wood cutting blocks reside in front of both settlements but little else can be found.',
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
				name: 'Tattered Buckler Shield',
				displayName: 'Tattered Buckler',
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
				attackType: 'slash',
				attackElement: '',
				weight: 4,
				slot: 'hands',
				equipped: false,
				modifiers: {
					damroll: 1,
					hitroll: 1
				}
			}]
		},
		{
			id: '3',
			title: 'East of Camp Center',
			area: 'midgaard',
			content: 'A distance away from camp center the snow is about a foot deeper and is carved with the tracks of people traveling to and from the eastern forest.',
			terrain: ['snow', 'road'],
			moveMod: 2,
			outdoors: true,
			exits: [
				{
					cmd: 'west',
					id: '1'
				}
			],
			playersInRoom: [],
			monsters: [{
				name: 'Skipp Mastiff Dog',
				displayName: 'Skipp',
				level: 3,
				short: 'Skipp, an enormous mastiff with brown and white spots',
				long: 'Skipp, William Green\'s large spotted mastiff sniffs about the area',
				inName: 'A canine',
				race: 'animal',
				id: '6',
				area: 'midgaard',
				weight: 120,
				position: 'standing',
				attackType: 'bite',
				hp: 25,
				size: {value: 3, display: 'medium'},
				runOnAliveWhenEmpty: true,
				behaviors: [{
					module: 'wander',
					moveDirections: ['north', 'east', 'west', 'south']
				}]
			}],
			items: [{
				name: 'Brown waterskin', 
				short: 'a light brown waterskin',
				long: 'A brown waterskin, the hide seems worn and used, was left here.' ,
				area: 'midgaard',
				id: '102',
				level: 1,
				drinks: 0,
				maxDrinks: 6,
				itemType: 'bottle',
				material: 'leather',
				weight: 0,
				value: 1,
				modifiers: {
					thirst: -1
				}
			}]
		},
		{
			id: '4',
			title: 'South of Camp Center',
			area: 'midgaard',
			content: 'The southern trail from camp is well traveled. The smithing tent is just east of here and the bustle of the mine can be seen to the south.',
			outdoors: true,
			exits: [
				{
					cmd: 'north',
					id: '1'
				},
				{
					cmd: 'south',
					id: '1',
					area: 'midgaard_academy'
				}
			],
			playersInRoom: [],
			monsters: [],
			items: [
				
				{
					name: 'Small Buckler', 
					short: 'a small round buckler',
					long: 'A small basic looking round buckler lies here' ,
					area: 'midgaard',
					id: '103', 
					level: 1,
					itemType: 'shield',
					material: 'wood', 
					weight: 1,
					slot: 'hands',
					equipped: false,
					modifiers: {
						ac: 2
					},
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
					modifiers: {
						hunger: -3
					},
					decay: 3
				}
			]
		},
		{
			id: '5',
			title: 'West of Camp Center',
			area: 'midgaard',
			content: 'Toward the docks.',
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
				material: 'leather', 
				ac: 1, 
				weight: 1,
				slot: 'head',
				equipped: false,
				modifiers: {
					ac: 1
				}
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
					door: true,
					name: 'gate',
					isOpen: false,
					locked: true,
					key: '101'
				}
			]
		},
		{
			id: '8',
			title: 'Tom Kerr\'s Tent',
			area: 'midgaard',
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ',
			outdoors: false,
			light: true,
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
					lastName: 'Kerr',
					displayName: 'Thomas Kerr',
					level: 15,
					short: 'Thomas the Storekeeper',
					long: 'Thomas Kerr the Dwarven Storekeeper is here',
					description: '',
					race: 'dwarf',
					id: '9',
					area: 'midgaard',
					weight: 200,
					str: 18,
					gold: 1000,
					position: 'standing',
					attackType: 'punch',
					damroll: 10,
					hitroll: 10,
					ac: 20,
					merchant: true,
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
						spawn: 4
					}],
					behaviors: [{
						module: 'thomas_kerr',
						onVisit: function(behavior, merchant, roomObj, incomingRoomObj, target, command) {
							if (target.race !== 'ogre') {
								if (World.dice.roll(1, 3) == 1 || target.level === 1) {
									World.addCommand({
										cmd: 'say',
										msg: 'Welcome. Something worth trading?',
										roomObj: roomObj
									}, merchant);

									if (World.dice.roll(1, 3) === 1) {
										setTimeout(function() {
											World.addCommand({
												cmd: 'say',
												msg: 'I\'m buying up all the furs I can. I\'ll give you a good price.',
												roomObj: roomObj
											}, merchant);	
										}, 2600);
									}
								}
							} else {
								World.addCommand({
									cmd: 'emote',
									msg: 'looks sternly at ' + target.displayName,
									roomObj: roomObj,
									prompt: false
								}, merchant);
	
								setTimeout(function() {
									World.addCommand({
										cmd: 'say',
										msg: 'You can turn around and leave. I don\'t trade with Ogres,'
											+ ' I don\t care what you think you\'ve found. Go on, get out!',
										roomObj: roomObj
									}, merchant);
								}, 280);
							}
						},
						beforeSell: function(behavior, merchant, roomObj, buyer) {
							if (buyer.race === 'ogre') {
								World.addCommand({
									cmd: 'say',
									msg: 'Sell to an Ogre? Are you insane?',
									roomObj: roomObj
								}, merchant);

								return false;
							} else {
								return true;
							}
						},
						beforeBuy: function(behavior, merchant, roomObj, buyer) {
							if (buyer.race === 'ogre') {
								World.addCommand({
									cmd: 'say',
									msg: 'I\'ll freeze before buying from an Ogre!',
									roomObj: roomObj
								}, merchant);

								return false;
							} else {
								return true;
							}
						}
					}]
				}
			],
			items: []
		}
	]
};
