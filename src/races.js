var dice = require('./dice');

var Race = function() {

}

Race.prototype.getRaces = function(fn) {
	var raceList = [
		{name:'Human', wis: 1},
		{name:'Elf', dex: 1},
        {name:'Dwarf', con: 2, int: -1}
	];
	return fn(raceList);
}


/*
 * Calculating stats
 * Stats currently follow the follow rules:
 *
 * 3d6 + 1 + raceMod -- there is an arbitrary + 1 so a person could luck out and get 19 atm
 *
*/

Race.prototype.getStr = function(race) {
	var raceList = Race.getRace(),
	i = 0;
	
	for(i; i < raceList.length; i+=1) {
		if(race === raceList[i].name && str in raceList[i]) {
			return dice.roll(3,6) + 1 + raceList[i].str;
		}
		else {
			return dice.roll(3,6) + 1;
		}
	} 
}

Race.prototype.getWis = function(race) {
        var raceList = Race.getRace(),
        i = 0;
        
        for(i; i < raceList.length; i+=1) {
                if(race === raceList[i].name && wis in raceList[i]) {
                        return dice.roll(3,6) + 1 + raceList[i].wis;
                }
                else {
                        return dice.roll(3,6) + 1;
                }
	}
}

Race.prototype.getInt = function(race) {
        var raceList = Race.getRace(),
        i = 0;
        
        for(i; i < raceList.length; i+=1) {
                if(race === raceList[i].name && int in raceList[i]) {
                        return dice.roll(3,6) + 1 + raceList[i].int;
                }
                else {
                        return dice.roll(3,6) + 1;
                }
        }
}

Race.prototype.getDex = function(race) {
        var raceList = Race.getRace(),
        i = 0;
        
        for(i; i < raceList.length; i+=1) {
                if(race === raceList[i].name && dex in raceList[i]) {
                        return dice.roll(3,6) + 1 + raceList[i].dex;
                }
                else {
                        return dice.roll(3,6) + 1;
                }
        }
}

Race.prototype.getCon = function(race) {
        var raceList = Race.getRace(),
        i = 0;
        
        for(i; i < raceList.length; i+=1) {
                if(race === raceList[i].name && con in raceList[i]) {
                        return dice.roll(3,6) + 1 + raceList[i].con;
                }
                else {
                        return dice.roll(3,6) + 1;
                }
        }
}

module.exports.race = new Race();
