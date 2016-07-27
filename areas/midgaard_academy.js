'use strict';
var Cmd = require('../src/commands').cmd,
Room = require('../src/rooms').room,
World = require('../src/world').world;

module.exports = {
	"name" : "Midgaard Academy",
	"id" : "2",
	"type" : "building",
	"levels" : "All",
	"description" : "Famous for preparing new adventuers for the world of RockMUD.",
	"reloads": 0,
	"author": "Rocky",
	"messages": [
		{"msg": "The sounds of sparring apprentices can be heard throughout the halls."}
	],
	"rooms" : [
		{
			"id" : "1",
			"title" : "Academy Enterance",
			"area": "Midgaard Academy",
			"content" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent congue sagittis efficitur. Vivamus dapibus sem ac mauris pharetra dapibus. Nunc id ex orci. Quisque fringilla dictum orci molestie condimentum. Duis volutpat porttitor ipsum. Sed ac aliquet leo. Nulla at facilisis orci, eu suscipit nibh. ",
			"outdoors": false,
			"exits" : [
				{
					"cmd" : "down",
					"id" : "1",
					"area": "Midgaard"
				}
			],
			"playersInRoom": [],
			"monsters" : [],
			"items" : [],
			"flags" : []
		}
	]
};
