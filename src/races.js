var dice = require('./dice').roller;

var Race = function() {
	this.raceList = [
		{name:'Human', wis: 1},
		{name:'Elf', dex: 1},
        {name:'Dwarf', con: 2, int: -1}
	];
}

/*
 * Calculating stats
 * Stats currently follow the follow rules:
 *
 * 3d6 + 1 + raceMod -- there is an arbitrary + 1 so a person could luck out and get 19 atm
 *
*/

Race.prototype.getStr = function(race) {
	var	i = 0;
	
	for(i; i < this.raceList.length; i+=1) {
		if(race === this.raceList[i].name && str in this.raceList[i]) {
			return dice.roll(3,6) + 1 + this.raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

Race.prototype.getWis = function(race) {
	var	i = 0;
	
	for(i; i < this.raceList.length; i+=1) {
		if(race === this.raceList[i].name && str in this.raceList[i]) {
			return dice.roll(3,6) + 1 + this.raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

Race.prototype.getInt = function(race) {
	var	i = 0;
	
	for(i; i < this.raceList.length; i+=1) {
		if(race === this.raceList[i].name && str in this.raceList[i]) {
			return dice.roll(3,6) + 1 + this.raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

Race.prototype.getDex = function(race) {
	var	i = 0;
	
	for(i; i < this.raceList.length; i+=1) {
		if(race === this.raceList[i].name && str in this.raceList[i]) {
			return dice.roll(3,6) + 1 + this.raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

Race.prototype.getCon = function(race) {
	var	i = 0;
	
	for(i; i < this.raceList.length; i+=1) {
		if(race === this.raceList[i].name && str in this.raceList[i]) {
			return dice.roll(3,6) + 1 + this.raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

module.exports.race = new Race();
