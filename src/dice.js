/*
* Simulates the rolling of dice, should never directly add any modifiers.
*/
"use strict";

var Roller = function() {

}

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

// Strings using limited dice notation (ex: 1d20, 2d7) can be used to get bounded totals
Roller.prototype.parseDice = function(d, mod, fn) {
	return this.roll(d.replace(/d.*/, ''), d.replace(/.*d/, ''), mod, fn)
}

module.exports.roller = new Roller();