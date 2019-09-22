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
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'dex') {
		mod += 1;
	}

	if (entity.size < 3) {
		mod += 1;
	} else if (entity.size > 3 && mod) {
		mod -= 1;
	}

	if (entity.dex > 15) {
		return Math.round( (entity.dex/10) + mod);
	}

	return mod;
};

Roller.prototype.getConMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'con') {
		mod += 1;
	}
	
	if (entity.size < 3 && mod) {
		mod -= 1;
	} else if (entity.size > 3) {
		mod += 1;
	}
	
	if (entity.con > 15) {
		mod += (Math.round(entity.con / 5) - 2);
	}

	return mod;
};

Roller.prototype.getIntMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'int') {
		mod += 1;
	}

	if (entity.int > 15) {
		mod += (Math.round(entity.int / 5) - 2);
	}

	return mod;
};

Roller.prototype.getStrMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'str') {
		mod += 1;
	}

	if (entity.str > 15) {
		mod += (Math.round(entity.str / 5) - 2);
	}

	if (entity.size.value < 3 && mod) {
		mod -= 1;
	} else if (entity.size.value > 3) {
		mod += 1;
	}

	return mod;
};

Roller.prototype.getWisMod = function(entity, mod) {
	if (!mod) {
		mod = 0;
	}

	if (entity.mainStat === 'wis') {
		mod += 1;
	}

	if (entity.wis > 15) {
		mod += (Math.round(entity.wis / 5) - 2);
	}

	return mod;
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

Roller.prototype.getAC = function(entity) {
	// ac is aggregate of things that add AC
	// it is reduced when items and affects are removed
	// and increased when items and affects are applied
	return entity.ac + this.getDexMod(entity);
}

// ac check is the entites current ac, level additions, and
Roller.prototype.getRelativeArmorScore = function(defender, attacker) {
	var ac = this.getAC(defender);

	if (attacker.level > defender.level) {
		ac -= (Math.round(attacker.level / defender.level));
	} else if (attacker.level < defender.level)  {
		ac += (Math.round(defender.level / attacker.level));
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
	multiplier;

	if (!expOpt.level) {
		expOpt.level = 1;
	}

	multiplier = (Math.abs((expOpt.level + 1) - player.level) * 10) + 10;

	if (expOpt.level >= (player.level - 6)) {
		if (expOpt.level > player.level) {
			multiplier += dice.roll(1, 4, 1);
		}

		return Math.abs(expOpt.level/player.level) * multiplier;
	} else {
		return 0;
	}
};

module.exports = new Roller();
