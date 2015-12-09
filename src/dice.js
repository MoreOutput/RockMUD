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

// Strings using limited dice notation (ex: 1d20, 2d7) can be used to get bounded totals, TODO expand to 1d20+1
Roller.prototype.parseDice = function(d, mod, fn) {
	return this.roll(d.replace(/d.*/, ''), d.replace(/.*d/, ''), mod, fn)
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
}

Roller.prototype.movementCheck = function(target, roomObj, fn) {
	if (typeof fn == 'function') {
		return fn();
	}
}

module.exports.roller = new Roller();
