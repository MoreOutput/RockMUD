'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	"name" : "Midgaard",
	"id" : "1",
	"type" : "city",
	"levels" : "All",
	"description" : "The first city.",
	"reloads": 0,
	"created": "",
	"saved": "",
	"author": "Rocky",
	"messages": [
		{"msg": "A cool breeze blows through the streets of Midgaard."},
		{"msg": "The bustle of the city can be distracting. Keep an eye out for thieves."}
	],
	"respawnOn": 8,
	"respawnTick": 0,
	"rooms" : [
		{
			"id" : "1",
			"title" : "Midgaard Town Square",
			"light": true,
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"outdoors": true,
			"exits" : [
				{
					"cmd" : "north",
					"id" : "2"
				}, {
					"cmd" : "east",
					"id" : "3"
				}, {
					"cmd" : "south",
					"id" : "4"
				}, {
					"cmd" : "west",
					"id" : "5"
				},
				{
					"cmd" : "up",
					"id": "1",
					"area": "Midgaard Academy"
				},
				{
					"cmd" : "down",
					"id" : "6",
					"door": {
						"isOpen": false,
						"locked": true,
						"key": "101",
						"openMsg": "A foul smell flows in from below.",
						"unlockMsg": "You hear something moving under the gate.",
						"name": "gate"
					}
				}
			],
			"playersInRoom": [],
			"monsters" : [
				{
					"name": "Rufus",
					"level": 15,
					"short": "Mayor Rufus",
					"long": "Rufus, current mayor of Midgaard,",
					"description": "",
					"inName": "Mayor Rufus",
					"race": "human",
					"id": 9,
					"area": "Midgaard",
					"weight": 245,
					"diceNum": 2,
					"diceSides": 8,
					"diceMod": 5,
					"str": 16,
					"position": "standing",
					"attackType": "punch",
					"damRoll": 10,
					"hitRoll": 10,
					"ac": 20,
					"itemType": "mob",
					"items": [{
						"name": "Midgaard city key",
						"short": "a thin gold key",
						"long": "A thin gold key with a ruby embbeded to the end lies here." ,
						"area": "Midgaard",
						"id": "10",
						"level": 1,
						"itemType": "key",
						"material": "gold", 
						"weight": 0,
						"slot": "",
						"value": 1000,
						"equipped": false,
						"isKey": true,
						"flags": []
					}],
					"behaviors": [{
						"module" : "mayor"
					}]
				}, {
					"name": "Boar",
					"displayName": ["Brown boar", "Light brown boar"],
					"level": 1,
					"short": ["a large brown boar", "a large scarred boar", "a young tan boar"],
					"long": ["A boar", "A large brown boar", "A timid boar"],
					"inName": "A boar",
					"race": "animal",
					"id": "6",
					"area": "Midgaard",
					"weight": 120,
					"position": "standing",
					"attackType": "bite",
					"ac": 0,
					"hp": 18,
					"chp": 18,
					"gold": 1,
					"size": {"value": 2, "display": "very small"},
					"itemType": "mob",
					"spawn": "3",
					"behaviors": [{  
						"module" : "wander"
					}]
				}, {
					"name": "Shackleton",
					"displayName": "Shackleton, the mayors dog",
					"short": "a spotted hunting dog",
					"long": "The mayors dog Shackleton a large, lean, spotted hunting dog",
					"level": 15,
					"description": "",
					"race": "human",
					"id": "100",
					"area": "Midgaard",
					"weight": 115,
					"diceNum": 2, 
					"diceSides": 8,
					"diceMod": 5,
					"str": 13,
					"position": "resting",
					"attackType": "maw",
					"damRoll": 10,
					"hitRoll": 10,
					"ac": 10,
					"itemType": "mob",
					"items": [],
					"behaviors": []
				}
			],
			"items" : [{
				"name": "Torch", 
				"short": "a wooden torch",
				"long": "A wooden torch rests on the ground" ,
				"area": "Midgaard",
				"id": "104", 
				"level": 1,
				"itemType": "weapon",
				"material": "wood",
				"weaponType": "club",
				"diceNum": 1, 
				"diceSides": 2,
				"diceMod": -1,
				"attackType": "smash", 
				"ac": -1,
				"weight": 1,
				"slot": "hands",
				"equipped": false,
				"light": true,
				"lightDecay": 10,
				"flickerMsg": '',
				"extinguishMsg": '',
				"flags": [],
				"beforeDrop": function(item, roomObj) {
					return true;
				}
			}, {
				"name": "Small Buckler", 
				"short": "a small round buckler",
				"long": "A small basic looking round buckler lies here" ,
				"area": "Midgaard",
				"id": "103", 
				"level": 1,
				"itemType": "shield",
				"material": "wood", 
				"ac": 2, 
				"weight": 1,
				"slot": "hands",
				"equipped": false,
				"flags": []
			}, {
				"name": "Loaf of Bread",
				"short": "a brown loaf of bread",
				"long": "A rather stale looking loaf of bread is lying on the ground" ,
				"area": "Midgaard",
				"id": "7",
				"level": 1,
				"itemType": "food",
				"weight": 0.5,
				"diceNum": 1,
				"diceSides": 6,
				"diceMod": 1,
				"decay": 7,
				"flags": []
			}, {
				"name": "Short Sword",
				"displayName": "Short Sword",
				"short": "a common looking short sword",
				"long": "A short sword with a hilt wrapped in leather straps was left on the ground" ,
				"area": "Midgaard",
				"id": "8",
				"level": 1,
				"itemType": "weapon",
				"weaponType": "sword",
				"material": "iron", 
				"diceNum": 1, 
				"diceSides": 6,
				"diceMod": 0,
				"attackType": "slash", 
				"attackElement": "",
				"weight": 4,
				"slot": "hands",
				"equipped": false,
				"modifiers": {
					"str": 1
				},
				"flags": []
			}, {
				"name": "Burlap sack",
				"short": "a worn, tan, burlap sack",
				"long": "A tan burlap sack with frizzed edges and various stains lies here",
				"area": "Midgaard",
				"id": "27",
				"level": 1,
				"itemType": "container",
				"weight": 1,
				"items": [{
					"name": "Sewer key", 
					"short": "small rusty key",
					"long": "A small rusty key made of low quality iron." ,
					"area": "Midgaard",
					"id": "101",
					"level": 1,
					"itemType": "key",
					"material": "iron", 
					"weight": 0,
					"slot": "",
					"value": 1,
					"equipped": false,
					"isKey": true
				}],
				"isOpen": true,
				"carryLimit": 50,
				"flags": []
			}],
			"flags" : [],
			"beforeEnter": function(target, fromRoom) {
				return true;
			},
			"onEnter": function(target, fromRoom) {
				
			}
		},
		{
			"id" : "2",
			"title" : "North of Town Square",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"outdoors": true,
			"exits" : [
				{
					"cmd" : "south",
					"id" : "1"
				},
				{
					"cmd" : "north",
					"id": "1",
					"area": "The Great Valley"
				}
			],
			"playersInRoom": [],
			"monsters" : [],
			"items" : [{
				"name": "Tattered Buckler", 
				"short": "a tattered buckler",
				"long": "A round buckler that looks like its seen heavy use is lying here" ,
				"area": "Midgaard",
				"id": "2", 
				"level": 1,
				"itemType": "shield",
				"material": "wood", 
				"ac": 2, 
				"weight": 6,
				"slot": "hands",
				"equipped": false,
				"flags": []
			}],
			"flags" : []
		},
		{
			"id" : "3",
			"title" : "East of Town Square",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"terrian" : "stone-road",
			"terrianMod": 0,
			"outdoors": true,
			"exits" : [
				{
					"cmd" : "west",
					"id" : "1"
				}
			],
			"playersInRoom": [],
			"monsters" : [],
			"items" : [{
				"name": "Brown waterskin", 
				"short": "a light brown waterskin",
				"long": "A brown waterskin, the hide seems worn and used, was left here." ,
				"area": "Midgaard",
				"id": "102",
				"level": 1,
				"drinks": 6,
				"maxDrinks": 6,
				"itemType": "bottle",
				"material": "leather",
				"weight": 0,
				"value": 1,
				"equipped": false
			}],
			"flags" : []
		},
		{
			"id" : "4",
			"title" : "South of Town Square",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"outdoors": true,
			"exits" : [
				{
					"cmd" : "north",
					"id" : "1"
				}
			],
			"playersInRoom": [],
			"monsters" : [],
			"items" : [],
			"flags" : []
		},
		{
			"id" : "5",
			"title" : "West of Town Square",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"exits" : [
				{
					"cmd" : "west",
					"id" : "8"
				},
				{
					"cmd" : "east",
					"id" : "1"
				}
			],
			"playersInRoom": [],
			"monsters" : [],
			"items" : [{
				"name": "Leather Helmet", 
				"short": "a leather helmet",
				"long": "A simple leather helmet was left here" ,
				"area": "Midgaard",
				"id": "3", 
				"level": 1,
				"itemType": "armor",
				"material": "wood", 
				"ac": 1, 
				"weight": 1,
				"slot": "head",
				"equipped": false,
				"flags": []
			}],
			"flags" : []
		},
		{
			"id" : "6",
			"title" : "Beneath Town Square",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"size": {"value": 3, "display": "medium"},
			"outdoors": false,
			"exits" : [
				{
					"cmd" : "up",
					"id" : "1",
					"door": {
						"name": "gate",
						"isOpen": false,
						"locked": true,
						"key": "101"
					}
				}
			],
			"playersInRoom": [],
			"monsters" : [{
				"name": "Large Alligator",
				"level": 3,
				"race": "animal",
				"short": "a mean looking Alligator",
				"long": "A large mean looking Alligator",
				"diceNum": 2,
				"diceSides": 2,
				"diceMod": 2,
				"hp": 30,
				"chp": 30,
				"kingdom": "reptile",
				"gold": 3,
				"size": {"value": 3, "display": "medium"},
				"attackOnVisit": true,
				"behaviors": [{
					"module": "aggie"
				}]
			}],
			"items" : [],
			"flags" : []
		},
		{
			"id" : "8",
			"title" : "The General Store",
			"area": "Midgaard",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"outdoors": false,
			"exits" : [
				{
					"cmd" : "east",
					"id" : "5"
				}
			],
			"playersInRoom": [],
			"monsters" : [
				{
					"name": "Tom",
					"level": 15,
					"short": "Thomas, the dwarven shopkeep",
					"long": "Thomas a dwarven shopkeeper",
					"description": "",
					"race": "dwarf",
					"id": "9",
					"area": "Midgaard",
					"weight": 200,
					"diceNum": 2, 
					"diceSides": 8,
					"diceMod": 5,
					"str": 18,
					"gold": 1000,
					"position": "standing",
					"attackType": "punch",
					"damRoll": 10,
					"hitRoll": 10,
					"ac": 20,
					"merchant": true,
					"itemType": "mob",
					"preventItemDecay": true,
					"items": [{
						"name": "Pemmican", 
						"short": "a piece of Pemmican",
						"long": "A small bit of Pemmican was left here." ,
						"area": "Midgaard",
						"id": "110",
						"level": 1,
						"itemType": "food",
						"material": "flesh", 
						"weight": 0,
						"slot": "",
						"value": 10,
						"equipped": false,
						"store": true,
						"worth": 10
					}, {
						"name": "Pemmican", 
						"short": "",
						"long": "" ,
						"area": "Midgaard",
						"id": "110",
						"level": 1,
						"itemType": "food",
						"material": "flesh", 
						"weight": 0,
						"slot": "",
						"value": 10,
						"equipped": false,
						"store": true,
						"worth": 10
					}, {
						"name": "Pemmican", 
						"short": "",
						"long": "" ,
						"area": "Midgaard",
						"id": "110",
						"level": 1,
						"itemType": "food",
						"material": "flesh", 
						"weight": 0,
						"slot": "",
						"value": 10,
						"equipped": false,
						"store": true,
						"worth": 10
					}],
					"behaviors": [],
					"beforeSell": function(buyer, roomObj) {
						if (buyer.race === 'ogre') {
							Cmd.say(this, {
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
			"items" : [],
			"flags" : []
		}
	]
};
