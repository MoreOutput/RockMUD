window.onload = function() {
	'use strict';
	var ws = io.connect(''),
	terminal = document.getElementById('terminal'),
	aliases = {	
		n: 'north',
		e: 'east',
		w: 'west',
		s: 'south',
		u: 'up',
		d: 'down',
		l: 'look',
		ls: 'look',
		i: 'inventory',
		sc: 'score',
		stats: 'score',
		eq: 'equipment',
		equip: 'wear',
		we: 'wear',
		q: 'quaff',
		c: 'cast',
		k: 'kill',
		re: 'rest',
		sl: 'sleep',
		h: 'help',
		wh: 'where',
		aff: 'affects',
		ooc: 'chat',
		slist: 'skills',
		skill: 'skills',
		desc: 'description',
		re: 'rest',
		r: 'recall'
	},
	isScrolledToBottom = false,
	movement = ['north', 'east', 'south', 'west'],
	playerIsLogged = false,
	display = function(r) {
		if (!r.styleClass) {
			r.styleClass = '';
		}

		if (r.element === undefined) {
			terminal.innerHTML += '<div class="row"><div class="col-md-12 ' + r.styleClass + '">' + r.msg + '</div></div>';
		} else {
			terminal.innerHTML += '<div class="row"><' + r.element + ' class="col-md-12 ' + r.styleClass + '">' + r.msg + '</' + r.element + '></div>';
		}

		isScrolledToBottom = terminal.scrollHeight - terminal.clientHeight <= terminal.scrollTop + 1;

		if (!isScrolledToBottom) {
			terminal.scrollTop = terminal.scrollHeight - terminal.clientHeight;
		}

		return parseCmd(r);
	},
	parseCmd = function(r) {
		if (r.msg !== undefined) {
			r.msg = r.msg.replace(/ /g, ' ').trim();
			ws.emit(r.emit, r);
		}
	},
	changeMudState = function(state) {
		document.getElementById('cmd').dataset.mudState = state;
	},		
	checkMovement = function(cmdStr, fn) {
		if (movement.toString().indexOf(cmdStr) !== -1) {
			return fn(true, 'move ' + cmdStr);
		} else {
			return fn(false, cmdStr);
		}
	},
	checkAlias = function(cmdStr, fn) { 
		var keys = Object.keys(aliases),
		i = 0,
		cmd,
		msg,
		keyLength = keys.length,
		cmdArr = cmdStr.split(' ');

		cmd = cmdArr[0].toLowerCase();
		msg = cmdArr.slice(1).join(' ');

		for (i; i < keyLength; i += 1) {
			if (keys[i] === cmd) {
				if (msg === '') {
					return fn(aliases[keys[i]]);
				} else {
					return fn(aliases[keys[i]] + ' ' + msg);
				}
			}
		}

		return fn(cmd + ' ' + msg);
	};

	document.getElementById('console').onsubmit = function (e) {
		var node = document.getElementById('cmd'),
		messageNodes = [],
		msg = node.value.toLowerCase().trim();

		display({
			msg : checkAlias(msg, function(cmd) {
				 return checkMovement(cmd, function(wasMov, cmd) {
					return cmd;
				});
			}),
			emit : (function () {
				var res = node.dataset.mudState;

				if (playerIsLogged === false && res === 'login') {
					node.type = 'password';
				}

				if (res === 'login') {
					return 'login';
				} else if (msg === 'quit' || msg === 'disconnect') {
					return 'quit';
				} else if (res === 'selectRace') {
					return 'raceSelection';
				} else if (res === 'selectClass') {
					return 'classSelection';
				} else if (res === 'createPassword') {
					return 'setPassword';
				} else if (res === 'enterPassword') {
					return 'password';
				} else {
					node.type = 'text';
					playerIsLogged = true;

					return 'cmd';
				}
			}()),
			styleClass: 'cmd'
		});
			
		node.value = '';
		node.focus();

		return false;
	};

	document.getElementById('cmd').focus();

	ws.on('msg', function(r) {
		display(r);

		if (r.res) {
			changeMudState(r.res);
		}
	});
};
