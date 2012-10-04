var Race = function() {
	this.raceList = [
		{
			name:'Human', 
			wis: 1
		},
		{
			name:'Elf',
			dex: 1
		},
        {
			name:'Dwarf',
			con: 2,
			int: -1
		}
	];
}

/* Racial based skills */

module.exports.race = new Race();