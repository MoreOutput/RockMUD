window.onload = function() {
	'use strict';
	var ws = io.connect('', {transports: ['websocket']}),
	terminal = document.getElementById('terminal'),
	node = document.getElementById('cmd'),
	rowCnt = 0,
	canSend = true,	
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
		g: 'get',
		tr: 'train',
		prac: 'practice'
	},
	isScrolledToBottom = false,
	movement = ['north', 'east', 'south', 'west', 'down', 'up'],
	playerIsLogged = null,
	display = function(r, hideRes) {
		var i = 0,
		styleClass = '';

		if (r.styleClass) {
			styleClass = r.styleClass;
		}

		if (!hideRes) {
			if (r.element === undefined) {
				terminal.innerHTML += '<div class="row"><div class="col-md-12 '
				+ styleClass + '">' + r.msg + '</div></div>';
			} else {
				terminal.innerHTML += '<div class="row"><' + r.element + ' class="col-md-12 '
				+ styleClass + '">' + r.msg + '</' + r.element + '></div>';
			}

			rowCnt += 1;

			if (rowCnt >= 160) {
				for (i; i < terminal.childNodes.length; i += 1) {
					terminal.removeChild(terminal.childNodes[i]);
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

	document.onclick = function() {
		node.focus();
	};

	document.addEventListener('reqPassword', function(e) {
		e.preventDefault();
		
		node.type = 'password';
	}, false);

	document.addEventListener('onLogged', function(e) {
		e.preventDefault();
		
		node.type = 'text';
	}, false);
	
	document.getElementById('console').onsubmit = function (e) {
		var messageNodes = [],
		msg = node.value.toLowerCase().trim(),
		msgObj = {
			msg: checkAlias(msg, function(cmd) {
				 return checkMovement(cmd, function(wasMov, cmd) {
					return cmd;
				});
			}),
			emit: 'cmd'
		};

		e.preventDefault();

		if (canSend) {
			if (node.type !== 'password') {
				display(msgObj, false);
			} else {
				display(msgObj, true);
			}
			
			node.value = '';
			node.focus();

			canSend = false;
			
			return false;
		} else {
			return false;
		}
	};

	node.focus();
	
	ws.on('msg', function(r) {
		display(r);

		if (r.evt && !r.evt.data) {
			r.evt = new CustomEvent(r.evt);
			
			if (!r.data) {
				document.dispatchEvent(r.evt);
			} else {
				document.dispatchEvent(r.evt, r.data);
			}
		}
	});

	setInterval(function() {
		canSend = true;
	}, 175);
};
