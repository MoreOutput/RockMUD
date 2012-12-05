/*
Outline of game classes class skills are just skills in skill.js.
There should be no strong ties between skills and classes, we want a skill to be accessible -- the only
requirement within the codebase is if it is in player.skills[]
*/
var Classes = function() {
	this.classList = [
		{
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
		}
	];
}

module.exports.classes = new Classes();