'use strict';
var Roller = function() {};

Roller.prototype.roll = function(dNum, dSides, mod) {
	var total = 0,
	i = 0;

	if (!mod) {
		mod = 0;
	}

	mod = Math.round(mod);

	for (i; i < dNum; i += 1) {
		total = total + Math.floor((Math.random() * dSides) + 1);
	}

	total = total + mod;

	return Math.round(total);
};

// return an array of numbers of length @number and between 0 - upperBound
Roller.prototype.randomPick = function(number, upperBound) {
	var i = 0,
	resultArr = [],
	randomNum = 0;

	for (i; i < number; i += 1) {
		randomNum = this.roll(1, upperBound);

		resultArr.push(randomNum);
	}

	return resultArr;
};

Roller.prototype.getDexMod = function(entity, mod) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'dex') {
		mod += Math.round(entity.level / 8) + 1;
	}

	if (entity.size < 3) {
		sizeMod += entity.size;
	} else if (entity.size > 3) {
		sizeMod = -(entity.size - 2);
	}

	if (entity.dex > 12) {
		return Math.round( (entity.dex/10) + mod + sizeMod);
	} else {
		return 0;
	}
};

Roller.prototype.getConMod = function(entity, mod) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'con') {
		mod += Math.round(entity.level / 8) + 1;
	}
	
	if (entity.size < 3) {
		sizeMod = -(entity.size - 2);
	} else if (entity.size > 3) {
		sizeMod += ( entity.size );
	}
	
	if (entity.con > 12) {
		return Math.round( (entity.con/10) + mod + sizeMod);
	} else {
		return 0;
	}
};

Roller.prototype.getIntMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'int') {
		mod += Math.round(entity.level / 8) + 1;
	}

	if (entity.int > 12) {
		return Math.ceil( (entity.int/10) + mod);
	} else {
		return 0;
	}
};

Roller.prototype.getStrMod = function(entity, mod) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'str') {
		mod += Math.round(entity.level / 8) + 1;;
	}
	
	if (entity.size.value < 3) {
		sizeMod = -(entity.size.value - 2);
	} else if (entity.size.value > 3) {
		sizeMod += ( entity.size.value/2 );
	}

	if (entity.str > 12) {
		return Math.round( (entity.str/10) + mod + sizeMod);
	} else {
		return 0 + mod;
	}
};

Roller.prototype.getWisMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'wis') {
		mod += Math.round(entity.level / 8) + 1;
	}

	if (entity.wis > 13) {
		return Math.round( (entity.wis/10) + mod);
	} else {
		return 0;
	}
};

Roller.prototype.getDodgeChance = function(dodgingEntity, entityToDodge) {
	// theres always a 2% chance the defender will dodge, World.dice.roll(1, 100) > 98
	var chanceToDodge = 2;

	if (dodgingEntity.level > entityToDodge.level) {
		chanceToDodge += Math.round(dodgingEntity.level / entityToDodge.level);
	} else if (dodgingEntity.level < entityToDodge.level)  {
		chanceToDodge -= Math.round(entityToDodge.level / dodgingEntity.level);
	}

	if (dodgingEntity.size.value < entityToDodge.size.value) {
		chanceToDodge += entityToDodge.size.value - dodgingEntity.size.value;
	} else if (dodgingEntity.size.value > entityToDodge.size.value) {
		chanceToDodge -= dodgingEntity.size.value - entityToDodge.size.value;
	}

	if (dodgingEntity.mainStat === 'dex') {
		chanceToDodge += 1;
	}

	return chanceToDodge;
};

// ac check is the entites current ac, level additions, and
Roller.prototype.getRelativeArmorScore = function(defender, attacker) {
	// theres always a 2% chance the defender will dodge, World.dice.roll(1, 100) > 98
	var ac = defender.ac;

	if (attacker.level > defender.level) {
		ac -= Math.round(attacker.level / defender.level);
	} else if (attacker.level < defender.level)  {
		ac += Math.round(defender.level / attacker.level);
	}

	if (defender.size.value < attacker.size.value) {
		ac += (attacker.size.value - defender.size.value);
	} else if (defender.size.value > attacker.size.value) {
		ac -= (attacker.size.value - defender.size.value);
	}

	return ac;
};

// return an object with each mod outlined
Roller.prototype.getMods = function(player, mod) {
	var dice = this;

	if (!mod) {
		mod = 0;
	}

	return {
		con: dice.getConMod(player, mod),
		wis: dice.getWisMod(player, mod),
		int: dice.getIntMod(player, mod),
		str: dice.getStrMod(player, mod),
		dex: dice.getDexMod(player, mod)
	};
};

Roller.prototype.calExp = function(player, expOpt) {
	var dice = this,
	exp = 0,
	total = dice.roll(1, 4);

	if (!expOpt.level) {
		expOpt.level = 1;
	}

	if (expOpt.level >= (player.level - 6)) {
		if (expOpt.level >= player.level) {
			exp = ((((expOpt.level - player.level)) * total) + 1) *
			(total * Math.abs(expOpt.level - player.level)) + dice.roll(1, 10) + 20;

			return exp;
		} else {
			return dice.roll(1, 2) * 10;
		}
	} else {
		return exp;
	}
};

module.exports = new Roller();
