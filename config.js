exports.server = {
	game: {
		ip: '127.0.0.1',
		port: 8000,
		name: 'RockMUD',
		home: './index.html',
		version: '0.1.5',
		website: ''
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
		dex: 2
	}, {
		name:'Fighter', 
		minLevel: 0, 
		playable: true,
		hp: 10,
		str: 2, 
		int: -1, 
		wis: -1, 
		con: 1
	}, {
		name:'Ranger', 
		minLevel: 0,
		playable: true,
		mv: 10,
		str: 1, 
		dex: 1
	}, {
		name:'Cleric', 
		minLevel: 0,
		playable: true,
		hp: 5,
		mana: 5,
		wis: 2, 
		con: 1,
		str: -1
	}, {
		name:'Wizard', 
		minLevel: 0,
		playable: true,
		mana: 10,
		int: 2, 
		con: -1, 
		str: -1
	}]
};
