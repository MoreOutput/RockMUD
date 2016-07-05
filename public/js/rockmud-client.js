window.onload = function() {
	'use strict';
	var ws = io.connect('', {transports: ['websocket']}),
	terminal = document.getElementById('terminal'),
	node = document.getElementById('cmd'),
	rowCnt = 0,
	aliases = {	
		n: 'north',
		e: 'east',
		w: 'west',
		s: 'south',
		u: 'up',
		d: 'down',
		north: 'north',
		east: 'east',
		west: 'west',
		south: 'south',
		up: 'up',
		down: 'down',
		f: 'flee',
		l: 'look',
		sca: 'scan',
		i: 'inventory',
		sc: 'score',
		o: 'open',
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
		af: 'affects',
		aff: 'affects',
		ooc: 'chat',
		slist: 'skills',
		skill: 'skills',
		desc: 'description',
		r: 'recall',
		wake: 'stand',
		g: 'get'
	},
	isScrolledToBottom = false,
	movement = ['north', 'east', 'south', 'west', 'down', 'up'],
	playerIsLogged = null,
	display = function(r, hideRes) {
		var i = 0;

		if (!hideRes) {
			if (!r.styleClass) {
				r.styleClass = '';
			}

			if (r.element === undefined) {
				terminal.innerHTML += '<div id="' + rowCnt +'" class="row"><div class="col-md-12 ' + r.styleClass + '">' + r.msg + '</div></div>';
			} else {
				terminal.innerHTML += '<div id="' + rowCnt +'" class="row"><' + r.element + ' class="col-md-12 ' + r.styleClass + '">' + r.msg + '</' + r.element + '></div>';
			}

			rowCnt += 1;

			if (rowCnt > 150) {
				for (i; i < 100; i += 1) {
					terminal.removeChild(document.getElementById( (i + 1) ));
				}

				rowCnt = 0;
			}

			isScrolledToBottom = terminal.scrollHeight - terminal.clientHeight <= terminal.scrollTop + 1;

			if (!isScrolledToBottom) {
				terminal.scrollTop = terminal.scrollHeight - terminal.clientHeight;
			}
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
		var messageNodes = [],
		msg = node.value.toLowerCase().trim(),
		msgObj = {
			msg : checkAlias(msg, function(cmd) {
				 return checkMovement(cmd, function(wasMov, cmd) {
					return cmd;
				});
			}),
			emit : (function () {
				var res = node.dataset.mudState;

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
					return 'cmd';
				}
			}()),
			styleClass: 'cmd'
		};

		if (node.type !== 'password') {
			display(msgObj, false);
		} else {
			display(msgObj, true);
		}
			
		node.value = '';
		node.focus();

		return false;
	};

	document.getElementById('cmd').focus();

	ws.on('msg', function(r) {
		display(r);

		if (r.res && r.res.toLowerCase().indexOf('password') !== -1) {
			node.type = 'password';
		} else {
			node.type = 'text';
		}

		if (r.res === 'end') {
			window.location.reload();
		}

		if (r.res) {
			changeMudState(r.res);
		}
	});
};
