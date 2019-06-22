window.onload = function() {
	'use strict';
	var getWsURL = function() {
		var uri;

		if (window.location.protocol === 'https:') {
			uri = 'wss:';
		} else {
			uri = 'ws:';
		}
		
		uri += '//' + window.location.host;
		
		uri += window.location.pathname;

		return uri;
	},
	ws = new WebSocket(getWsURL()),
	terminal = document.getElementById('terminal'),
	node = document.getElementById('cmd'),
	rowCnt = 0,
	canSend = true,
	logged = false,
	aliases = {
		n: 'move north',
		e: 'move east',
		w: 'move west',
		s: 'move south',
		u: 'move up',
		d: 'move down',
		north: 'move north',
		east: 'move east',
		west: 'move west',
		south: 'move south',
		up: 'move up',
		down: 'move down',
		fl: 'flee',
		fol: 'follow',
		uf: 'unfollow',
		gr: 'group',
		l: 'look',
		sca: 'scan',
		i: 'inventory',
		sc: 'score',
		stats: 'score',
		o: 'open',
		op: 'open',
		eq: 'equipment',
		equip: 'wear',
		we: 'wear',
		re: 'remove',
		q: 'quaff',
		c: 'cast',
		k: 'kill',
		adv: 'kill',
		attack: 'kill',
		murder: 'kill',
		res: 'rest',
		sl: 'sleep',
		h: 'help',
		wh: 'who',
		whe: 'where',
		af: 'affects',
		aff: 'affects',
		ooc: 'chat',
		shout: 'chat',
		sh: 'chat',
		slist: 'skills',
		skill: 'skills',
		desc: 'description',
		r: 'recall',
		wake: 'stand',
		g: 'get',
		tr: 'train',
		prac: 'practice',
		nod: 'emote nods solemly.',
		laugh: 'emote laughs heartily.',
		wo: 'worth',
		rec: 'recall',
		gi: 'give',
		wield: 'wear',
		dr: 'drop',
		dri: 'drink',
		j: 'quests',
		ql: 'quests',
		quest: 'quests',
		ww: 'whirlwind'
	},
	isScrolledToBottom = false,
	playerIsLogged = null,
	display = function(r, addToDom) {
		var i = 0;

		if (addToDom) {
			rowCnt += 1;

			var node = document.createElement('div');

			node.classList.add('row');

			node.innerHTML = r.msg;

			terminal.appendChild(node);

			checkCmdEvents(rowCnt);

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
	},
	checkCmdEvents = function(rowCnt) {
		var i = 0,
		processCmdClick = function(evt) {
			evt.preventDefault();

			node.value = this.getAttribute('data-cmd-value');

			send(evt);

			this.setAttribute('data-cmd-value', '');
		},
		nodes = document.querySelectorAll('[data-cmd="true"]');

		for (i; i < nodes.length; i += 1) {
			(function(nodeRef, index) {
				nodeRef.fn = processCmdClick;

				if (nodeRef.getAttribute('data-cmd')) {
					nodeRef.setAttribute('data-cmd', false);
					nodeRef.addEventListener('click', nodeRef.fn, true);
				} else {
					nodeRef.removeEventListener('click', nodeRef.fn, false);
				}
			}(nodes[i], i));
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

		if (msg) {
			return fn(cmd + ' ' + msg);
		} else {
			return fn(cmd);
		}
	},
	send = function(e, addToLog = true) {
		var msg = node.value.trim(),
		msgObj = {
			msg: checkAlias(msg, function(cmd) {
				return cmd;
			}),
			addToLog: addToLog
		};

		e.preventDefault();

		if (canSend) {
			canSend = false;

			ws.send(JSON.stringify(msgObj));

			if (logged && msgObj.msg && addToLog) {
				var onSendEvt = new CustomEvent('onSend');
				
				onSendEvt.data = msgObj;

				document.dispatchEvent(onSendEvt);
			}

			node.value = '';
			node.focus();
		
			return false;
		} else {
			return false;
		}
	},
	// variables related to command log ui
	maxCommandMemory = 6;

	document.onclick = function() {
		node.focus();
	};

	document.addEventListener('reqPassword', function(e) {
		e.preventDefault();
		
		node.type = 'password';
		node.placeholder = 'Login password';
	}, false);

	document.addEventListener('onLogged', function(e) {
		e.preventDefault();

		logged = true;

		node.type = 'text';
		node.placeholder = 'Enter a Command -- type \'help commands\' for a list of common commands';
	}, false);

	// when a command has been sent to the server
	document.addEventListener('onSend', function(e) {
		var parentNode = document.getElementById('prev-cmd-list');

		e.preventDefault();

		if (e.data.msg.trim().length > 3) {
			var currentCmds = document.querySelectorAll('.prev-cmd'),
			duplicate = false; // duplicate of previous command

			if (currentCmds.length) {
				if (currentCmds[0].innerText === e.data.msg) {
					duplicate = true;
				}
			}

			if (!duplicate) {
				if (currentCmds.length >= maxCommandMemory) {
					parentNode.removeChild(currentCmds[currentCmds.length - 1].parentElement);
				}			
				
				var newListItem = document.createElement('li');
				var newButton = document.createElement('button');
				newButton.type = 'button';
				newButton.innerHTML = e.data.msg;
				newButton.classList = 'prev-cmd link-btn';

				newButton.onclick = function(e) {
					node.value = newButton.innerHTML;

					send(e, false);
				};

				newListItem.append(newButton);
				parentNode.prepend(newListItem);
			}
		}
	}, false);

	document.getElementById('console').onsubmit = function (e) {
		send(e);
	};

	node.focus();


	document.addEventListener('keydown', function(e) {
		if (e.key === 'Tab') {
 			e.preventDefault();

			node.focus();
		}
	}, false);

	ws.addEventListener('message', function(r) {
		r = JSON.parse(r.data);

		display(r, true);

		if (r.evt && !r.evt.data) {
			r.evt = new CustomEvent(r.evt);
			
			if (r.data) {
				r.evt.data = r.data;
			}

			document.dispatchEvent(r.evt);
		}
	});

	ws.addEventListener('close', function(r) {
		display({
			msg: '<div class="col-md-12 error">Server disconnected. Refresh the page to retry.</div>'
		}, true);
	});

	setInterval(function() {
		canSend = true;
	}, 175);
};
