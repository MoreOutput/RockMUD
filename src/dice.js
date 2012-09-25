var Roller = function() {

}

Roller.prototype.roll = function(dNum, dSides) {
	var total = 0,
	i = 0;
		
	for (i; i < dNum; i += 1) {
		total = total + Math.floor(Math.random() * dSides);				
		if(i === dNum - 1) {
			if (total < 12) {
				return 12;
			} else {
				return total;
			}
		}		
	}
}

module.exports.roller = new Roller();
