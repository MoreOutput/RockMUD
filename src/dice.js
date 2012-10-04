var Roller = function() {

}

Roller.prototype.roll = function(dNum, dSides, fn) {
	var total = 0,	
	i = 0;
		
	for (i; i < dNum; i += 1) {
		total = total + Math.floor(Math.random() * dSides);				
		if(i === dNum - 1) {	
			if (typeof fn === 'function') {
				return fn(total);
			} else {
				return total;
			}
		}		
	}
}

module.exports.roller = new Roller();
