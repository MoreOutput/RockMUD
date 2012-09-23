var Classes = function() {
	this.classList = [
		{name:'Rogue', minLevel: 0, dex: 2, con: -1},
		{name:'Fighter', minLevel: 0, str: 2, int: -1, con: 1},
		{name:'Cleric', minLevel: 0, wis: 2, con: 1}
	];
}

module.exports.classes = new Classes();
