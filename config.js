exports.server = {
	game: {
		ip: '127.0.0.1',
		port: 8000,
		name: 'RockMUD',
		version: '0.1.6',
		website: 'https://github.com/MoreOutput/RockMUD'
	},
	admins: [{
		name: 'Rocky',
		position: 'Code Guy',
		contact: 'moreoutput@gmail.com'		
	}],
	races: [{
		name:'Human', 
		wis: 1
	}, {
		name:'Elf',
		int: 2,
		con: -1
	}, {
		name:'Dwarf',
		con: 2,
		int: -1,
		hp: 5
	}, {
		name:'Ogre',
		str: 3,
		int: -2,
		dex: -1,
		hp: 10
	}],
	classes: [{
		name:'Thief',
		minLevel: 0, 
		playable: true,
		mv: 10,
		dex: 2,
		gold: 10,
		skills: [{ name: 'backstab', train: 65 }],
		skillList: [{ name: 'Backstab', mod: 2, level: 1, maxTrain: 95, wait: 3 }]
	}, {
		name:'Fighter', 
		minLevel: 0, 
		playable: true,
		hp: 10,
		str: 2, 
		int: -1, 
		wis: -1, 
		con: 1,
		skills: [{ name: 'bash', train: 65 }],
		skillList: [{ name: 'Bash', mod: 1, level: 1, maxTrain: 95, wait: 1 }]
	}, {
		name:'Ranger', 
		minLevel: 0,
		playable: true,
		mv: 10,
		str: 1, 
		dex: 1,
		skills: [{ name: 'lunge', train: 65 }],
		skillList: [{ name: 'Lunge', mod: 1, level: 1, maxTrain: 95, wait: 2 }]
	}, {
		name:'Cleric', 
		minLevel: 0,
		playable: true,
		hp: 5,
		mana: 5,
		wis: 2, 
		con: 1,
		str: -1,
		skills: [{ name: 'cure light', train: 65 }],
		skillList: [{ name: 'Cure Light', mod: 2, level: 1, maxTrain: 95, wait : 1 }]
	}, {
		name:'Wizard', 
		minLevel: 0,
		playable: true,
		mana: 10,
		int: 2, 
		con: -1, 
		str: -1,
		skills: [{ name: 'dart', train: 65 }],
		skillList: [{ name: 'Dart', mod: 2, level: 1, maxTrain: 95, wait: 1 }]
	}]
};