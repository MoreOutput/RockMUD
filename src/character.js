/*
* Characters
*/
var fs = require('fs'),
Races = require('./races').race,
Classes = require('./classes').classes,
Room = require('./rooms').room;
 
var Character = function () {
	
}
 
Character.prototype.login = function(data, s, fn) {
	var	name = data.msg.replace(/_.*/,'').toLowerCase(),	
	player = { id: s.id };
	
	fs.stat('./players/' + name + '.json', function (err, stat) {
		if (err === null) {
			return fn(name, s, true);
		} else {
			return fn(name, s, false);
		}
	});
}

Character.prototype.load = function(data, s, fn) {
	fs.readFile('./players/'  + data.name + '.json', function (err, data) {
		if (err) {
			throw err;
		}
	
		return fn(s, JSON.parse(data));
	});
}

Character.prototype.create = function(s, player) { //  A New Character is saved
	var newChar = {
		name: player.name,
		lastname: '',
		title: 'is a newbie, so help them out!',
		role: 'player',
		password: player.password,
		sid: s.id, // current socket id
		saved: '', // time of last save
		level: 1,
		race: player.race,
		charClass: player.charClass,
		alignment: '',
		chp: 100, // current hp
		hp: 100, // total hp
		mana: 100,
		mv: 100, // stats after this
		str: (function () {
			return Races.getStr(player.race);
		}()),
		wis: (function () {
			return Races.getWis(player.race);
		}()),
		con: (function () {
			return Races.getCon(player.race);
		}()),
		dex: (function () {
			return Races.getDex(player.race);
        }()),
        int: (function () {
			return Races.getInt(player.race);
        }()),
		exp: 1,
		expToLevel: 1000,
		position: 'standing',
		area: 'hillcrest',
		room: 1, // current room
		recall: 0, // vnum to recall to
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
			attackElement : '' 
			}
		],
		skills: [],
		feats: [],
		affects: []
	};

	fs.writeFile('./players/' + newChar.name + '.json', JSON.stringify(newChar, null, 4), function (err) {
		if (err) {
			throw err;
		}
		
		Cmds.players.push({
			name: newChar.name,
			vnum: newChar.vnum,
			charClass: newChar.charClass,
			race: newChar.race,
			level: newChar.level
		});
	});
}

Character.prototype.newCharacter = function(name, s) {
	var character = this;
	Races.getRaces(function(races) {
		var i = 0, 
		str = '';
		
		s.emit('msg', {msg: name + ' is a new character! There are three more steps until ' + name + 
		' is saved. The next step is to select your race:'});
		
		character.selectRace(s);
	});
}

Character.prototype.selectRace = function(s) {
	var i = 0,
    str = [];
	Races.getRaces(function(raceList) {			
		for (i; i < raceList.length; i += 1) {
			str += '<li>' + raceList[i].name + '</li>';
			
			if	(raceList.length - 1 === i) {
				return s.emit('msg', {msg: '<ul>' + str + '</ul>', res: 'raceSelection', styleClass: 'race-selection'});
			}
		}
	});
};

Character.prototype.raceSelection = function(race, s) {
	var raceList = races.getRaces(),
	i = 0;
	
	for (i; i < raceList.length; i += 1) {
		if (race.toLowerCase() === raceList[i].name.toLowerCase()) {
			character[s.id].race = race.toLowerCase();
		
			return character.selectClass(s);		
		} else if (i === raceList.length) {
			character.selectRace(s);
		}
	}
}

Character.prototype.selectClass = function(s) {
	return s.emit('msg', {
		msg: (function() {
			var i = 0,
			arr = [];

			for (i; i < classes.classList; i += 1) {
				arr.push(classes.classList[i].name);
			}
		
			return '<div class="raceselection">Okay ' + character[s.id].name + 
				' select your class from these options: ' + arr.toString() + '</div>';

		}()),
		res: 'selectClass'
	});
}

Character.prototype.classSelection = function(charClass, s) {
	var i = 0;
	for(i; i < classes.classList.length; i += 1) {
		if(charClass.toLowerCase() === classes.classList[i].name.toLowerCase()) {
			character[s.id].charClass = charClass.toLowerCase();
			return character.requestNewPassword(s);                
		} else if (i === classes.classList.length) {
			character.selectClass(s);
        }
	}
}

Character.prototype.requestNewPassword = function(s) {
	s.emit('msg', {msg: 'Your password (9 characters): ', res: 'createPassword'});
}

Character.prototype.setPassword = function(s, pw) {	
	if(pw.length > 8) {
		character[s.id].password = pw;
		s.emit('msg', {msg : 'Your password is: ' + character[s.id].password});		
		character.motd(s);
		character.prompt(s);
	} else {
		s.emit('msg', {msg: 'Yes it has to be nine characters long.'});
		return character.requestNewPassword(s);
	}

	character.create(character[s.id], s);
}

Character.prototype.getPassword = function(s) {
	s.emit('msg', {msg: 'What is your password: ', res: 'enterPassword'});
}

Character.prototype.loginPassword = function(data, s, player, players) {
	if(player.password === data.msg) {
		this.motd(s);
		Room.load(data, s, player, players);
		this.prompt(s, player);
		
	} else {
		s.emit('msg', {msg: 'Wrong! You are flagged after 5 incorrect responses.'});
		this.getPassword(s);
	}	
}

Character.prototype.motd = function(s) {
	s.emit('msg', {msg : '------- Entering RockMUD -------', res: 'logged'});
}

Character.prototype.save = function(id) {
	try {
		var player = fs.createWriteStream('./players/' + character[id].name + '.json', {'flags' : 'w'});
		player.write(JSON.stringify(character[id], null, 4));
		return true;
	}
	catch(err) {
		return false;
	}
}

Character.prototype.prompt = function(s, player) {
	return s.emit('msg', {msg: player.name + ', hp:' + player.hp +  ' room:' 
		+ player.room + '> ', styleClass: 'cprompt'});
}

Character.prototype.level = function() {

}

module.exports.character = new Character();