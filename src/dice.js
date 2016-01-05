'use strict';
var Roller = function() {

};

// General dice rolling
Roller.prototype.roll = function(dNum, dSides, mod, fn) {
	var total = 0,
	i = 0;

	if (isNaN(mod)) {
		fn = mod;
		mod = 0;
	} else {
		mod = Math.round(mod);
	}
		
	for (i; i < dNum; i += 1) {
		total = total + Math.floor((Math.random() * dSides) + 1);
	}

	total = total + mod;

	if (typeof fn === 'function') {
		return fn(Math.round(total));
	} else {
		return Math.round(total);
	}
};

// return an array of numbers of length @number and between 0 - @arr.length
Roller.prototype.randomPick = function(number, upperBound, fn) {
	var i = 0,
	resultArr = [],
	randomNum = 0;

	for (i; i < number; i += 1) {
		randomNum = this.roll(1, upperBound);

		resultArr.push(randomNum);
	}

	if (typeof fn === 'function') {
		return fn(resultArr);
	} else {
		return resultArr;
	}
};

Roller.prototype.getDexMod = function(target, mod, fn) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (target.size < 3) {
		sizeMod += target.size;
	} else if (target.size > 3) {
		sizeMod = -(target.size - 2);
	}

	if (target.con > 12) {
		return Math.round( (target.dex/6) + mod + sizeMod);
	} else {
		return 0;
	}
};

Roller.prototype.getConMod = function(target, mod, fn) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (target.size < 3) {
		sizeMod = -(target.size - 2);
	} else if (target.size > 3) {
		sizeMod += ( target.size );
	}

	if (target.con > 12) {
		return Math.round( (target.con/6) + mod + sizeMod);
	} else {
		return 0;
	}
};

Roller.prototype.getIntMod = function(target, mod, fn) {
	if (!mod) {
		mod = 0;
	}

	if (target.int > 12) {
		return Math.ceil( (target.int/6) + mod);
	} else {
		return 0;
	}
};

Roller.prototype.getStrMod = function(target, mod, fn) {
	var sizeMod = 0;

	if (!mod) {
		mod = 0;
	}

	if (target.size < 3) {
		sizeMod = -(target.size - 2);
	} else if (target.size > 3) {
		sizeMod += ( target.size );
	}

	if (target.con > 12) {
		return Math.round( (target.str/6) + mod + sizeMod);
	} else {
		return 0;
	}
};

Roller.prototype.getWisMod = function(target, mod, fn) {
	if (!mod) {
		mod = 0;
	}

	if (target.wis > 13) {
		return Math.round( (target.wis/8) + mod);
	} else {
		return 0;
	}
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

Roller.prototype.calXP = function(player, xpOpt, fn) {
	var dice = this;

	if (!xpOpt.level) {
		xpOpt.level = 1;
	}

	if (xpOpt.level >= (player.level - 6)) {
		if (xpOpt.level >= player.level) {
			dice.roll(1, 4, 1, function(total) {
				var xp;
				xp = (((xpOpt.level - player.level) * total) + 1) * (total * 4) + dice.roll(1, 10);
				
				return fn(xp);
			});
		} else {
			dice.roll(1, 2, function(total) {
				return fn(total * 10);
			});
		}
	} else {
		return fn(0);
	}
};

module.exports.roller = new Roller();
