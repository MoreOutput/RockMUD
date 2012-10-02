/*
* Characters
*/
var fs = require('fs'),
crypto = require('crypto'),
Races = require('./races').race,
Classes = require('./classes').classes,
Room = require('./rooms').room,
Dice = require('./dice').roller;
 
var Character = function () {
	this.perms = [];
}
 
Character.prototype.login = function(r, s, fn) {
	var name = r.msg.replace(/_.*/,'').toLowerCase();	
	
	if (r.msg.length > 2) {
		fs.stat('./players/' + name + '.json', function (err, stat) {
			if (err === null) {
				return fn(name, s, true);
			} else {
				return fn(name, s, false);
			}
		});
	} else {
		s.emit('msg', {
			msg: 'Name is too short.',
			res: 'login',
			styleClass: 'error'
		});
	}
}

Character.prototype.load = function(r, s, fn) {
	fs.readFile('./players/'  + r.name + '.json', function (err, r) {
		if (err) {
			throw err;
		}
	
		return fn(s, JSON.parse(r));
	});
}

Character.prototype.hashPassword = function(salt, password, iterations, fn) {
	var hash = password,
	iterations = iterations, 
	i = 0;
		
	if (password.length > 7) {
		for (i; i < iterations; i += 1) {
			hash = crypto.createHmac('sha256', salt).update(hash).digest('hex');
		} 
			
		fn(hash);
	
	}
};

Character.prototype.generateSalt = function(fn) {
	crypto.randomBytes(128, function(ex, buf) {
		if (ex) {
			throw ex;
		}
			
		fn(buf.toString('hex'));
	});
};

Character.prototype.requestNewPassword = function(r, s) {
	s.emit('msg', {msg: 'Set a password (8 characters): ', res:'setPassword', styleClass: 'pw-set'});
}

Character.prototype.setPassword = function(r, s, players) {	
	if (r.cmd.length > 7) {
		s.player.password = r.cmd;
		s.emit('msg', {msg : 'Your password is: ' + s.player.password});		
		this.create(r, s, players);
	} else {
		s.emit('msg', {msg: 'Yes it has to be eight characters long.'});
		return this.requestNewPassword(r, s);
	}


}

Character.prototype.getPassword = function(s) {
	s.emit('msg', {msg: 'What is your password: ', res: 'enterPassword'});
}

Character.prototype.loginPassword = function(r, s, players) {
	var character = this;
	
	character.hashPassword(s.player.salt, r.cmd, 1000, function(hash) {
		if (s.player.password === hash) {
			character.motd(s, function() {
				Room.getRoom(r, s, players);
				character.prompt(s);
			});
		} else {
			s.emit('msg', {msg: 'Wrong! You are flagged after 5 incorrect responses.'});
			character.getPassword(s);
		}
	});
}

Character.prototype.create = function(r, s, players) { //  A New Character is saved]
	s.player = {
		name: s.player.name,
		lastname: '',
		title: '',
		role: 'player',
		password: s.player.password,
		salt: '',
		race: s.player.race,
		charClass: s.player.charClass,
		saved: new Date().toString(), // time of last save
		level: 1,
		exp: 1,
		expToLevel: 1000,
		position: 'standing',
		alignment: '',
		chp: 100, // current hp
		hp: 100, // total hp
		mana: 100,
		mv: 100, // stats after this
		stats: ['str', 'wis', 'int', 'dex', 'con'],
		hunger: 0,
		thirst: 0,
		area: 'hillcrest',
		vnum: 1, // current room
		recall: 1, // vnum to recall to
		description: 'A brand new citizen.',
		eq: {
			head: '',
			chest: '',
			wield1: '',
			wield2: '',
			arms: '',
			hands: '',
			legs: '',
			feet: '',
			necklace1: '',
			necklace2: '',
			ring1: '',
			ring2: '',
			floating: ''
		}, 
		inventory: [
			{
			item: 'Short Sword', 
			vnum: 1, 
			itemType: 'weapon',
			material: 'iron', 
			diceNum: 2, 
			diceSides: 6, 
			attackType: 'Slice', 
			attackElement : '',
			flags: []
			}
		],
		skills: [],
		feats: [],
		affects: []
	},
	character = this;
	
	character.rollStats(s.player, function(player) {
		s.player = player;
	
		character.generateSalt(function(salt) {
			s.player.salt = salt;
			character.hashPassword(salt, s.player.password, 1000, function(hash) {
				s.player.password = hash;
				fs.writeFile('./players/' + s.player.name + '.json', JSON.stringify(s.player, null, 4), function (err) {
					var i = 0;
		
					if (err) {
						throw err;
					}
			
					for (i; i < players.length; i += 1) {
						if (players[i].sid === s.id) {
							players.splice(i, 1);
						}
					}
		
					s.leave('creation');
					s.join('mud');			
		
					character.motd(s, function() {
						players.push(s.player);
						Room.getRoom(r, s, players);			
						character.prompt(s);
					});	
				});	
			});
		});	
	});
}

// Rolling stats for a new character
Character.prototype.rollStats = function(player, fn) { 
	var i = 0,
	j = 0;

	for (i; i < Races.raceList.length; i += 1) {		
		if (Races.raceList[i].name.toLowerCase() === player.race) {	
			for (j; j < player.stats.length; j += 1) {
				if (player.stats[j] in Races.raceList[i]) {
					player[player.stats[j]] = Dice.roll(3,6) + Races.raceList[i][player.stats[j]];					
				} else {
					player[player.stats[j]] = Dice.roll(3,6);
				}
				
				if (j === player.stats.length - 1) {
					delete player.stats;
					return fn(player);
				}
			}
		}
	} 
}

Character.prototype.newCharacter = function(r, s, players, fn) {
	var i = 0, 
	str = '';
	
	for (i; i < Races.raceList.length; i += 1) {
		str += '<li>' + Races.raceList[i].name + '</li>';

		if	(Races.raceList.length - 1 === i) {
			return s.emit('msg', {msg: s.player.name + ' is a new character! There are three more steps until ' + s.player.name + 
			' is saved. The next step is to select your race: <ul>' + str + '</ul>', res: 'selectRace', styleClass: 'race-selection'});		
		}
	}	
}

Character.prototype.raceSelection = function(r, s, players) {
	var i = 0;	
	for (i; i < Races.raceList.length; i += 1) {
		if (r.cmd === Races.raceList[i].name.toLowerCase()) {
			s.player.race = r.cmd;
			return this.selectClass(r, s, players);		
		} else if (i === Races.raceList.length) {
			this.newCharacter(r, s, players);
		}
	}
}

Character.prototype.selectClass = function(r, s) {
	var i = 0, 
	str = '';
	
	for (i; i < Classes.classList.length; i += 1) {
		str += '<li>' + Classes.classList[i].name + '</li>';

		if	(Classes.classList.length - 1 === i) {
			return s.emit('msg', {
				msg: 'Great! Now time to select a class ' + s.player.name + '. Pick on of the following: <ul>' + 
					str + '</ul>', 
				res: 'selectClass', 
				styleClass: 'race-selection'
			});
		}
	}	
}

Character.prototype.classSelection = function(r, s, players) {
	var i = 0;	
	for (i; i < Classes.classList.length; i += 1) {
		if (r.cmd === Classes.classList[i].name.toLowerCase()) {
			s.player.charClass = r.cmd;
			return this.requestNewPassword(r, s, players);		
		} else if (i === Classes.classList.length) {
			this.selectClass(r, s, players);
		}
	}
}

Character.prototype.motd = function(s, fn) {	
	fs.readFile('motd.json', function (err, data) {
		if (err) {
			throw err;
		}
	
		s.emit('msg', {msg : JSON.parse(data).motd, res: 'logged'});
		return fn();
	});
}

Character.prototype.save = function(s, players, fn) {
	s.player.saved = new Date().toString();
	
	fs.writeFile('./players/' + s.player.name.toLowerCase() + '.json', JSON.stringify(s.player, null, 4), function (err) {
		if (err) {
			return s.emit('msg', {msg: 'Error saving character.'});
		} else {
			return fn();
		}
	});
}

Character.prototype.prompt = function(s) {
	return s.emit('msg', {msg: s.player.name + ', hp:' + s.player.hp +  ' room:' 
		+ s.player.vnum + '> ', styleClass: 'cprompt'});
}

Character.prototype.level = function() {

}

module.exports.character = new Character();