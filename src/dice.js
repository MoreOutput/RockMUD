'use strict';
var Roller = function() {};

Roller.prototype.roll = function(dNum, dSides, mod) {
	var total = 0,
	i = 0;

	if (!mod) {
		mod = 0;
	}

	for (i; i < dNum; i += 1) {
		total = total + Math.floor((Math.random() * dSides) + 1);
	}

	total = total + mod;

	return Math.round(total);
};

Roller.prototype.getDexMod = function(entity, mod) {
	var statBase = (entity.dex - 10);

	if (!mod) {
		mod = 0;
	}

	if (statBase > 0) {
		mod += (Math.floor(statBase / 5));
	} else if (statBase < 0) {
		mod += statBase
	}

	if (entity.mainStat === 'dex') {
		mod += 1;
	}

	return mod;
};

Roller.prototype.getConMod = function(entity, mod) {
	var statBase = (entity.con - 10);

	if (!mod) {
		mod = 0;
	}

	if (statBase > 0) {
		mod += (Math.floor(statBase / 5));
	} else if (statBase < 0) {
		mod += statBase
	}

	if (entity.mainStat === 'con') {
		mod += 1;
	}

	return mod;
};

Roller.prototype.getIntMod = function(entity, mod) {
	var statBase = (entity.int - 10);

	if (!mod) {
		mod = 0;
	}

	if (statBase > 0) {
		mod += (Math.floor(statBase / 5));
	} else if (statBase < 0) {
		mod += statBase
	}

	if (entity.mainStat === 'int') {
		mod += 1;
	}

	return mod;
};

Roller.prototype.getStrMod = function(entity, mod) {
	var statBase = (entity.str - 10);

	if (!mod) {
		mod = 0;
	}

	if (statBase > 0) {
		mod += (Math.floor(statBase / 5));
	} else if (statBase < 0) {
		mod += statBase
	}

	if (entity.mainStat === 'str') {
		mod += 1;
	} else if (entity.mainStat === 'wis' || entity.mainStat === 'int') {
		mod -= 1;
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
		mod += (Math.floor(entity.wis / 5) - 2);
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
	var result = entity.ac + this.getDexMod(entity);

	if (result < 0) {
		result = 0;
	}

	return result;
}

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

module.exports = Roller;
