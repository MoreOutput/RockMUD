var Race = function() {
	this.raceList = [
		{
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
		}
	];
}

/* Racial skills */

module.exports.race = new Race();