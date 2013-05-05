/*
 Client Side JS for RockMUD
 Rocky Bevins, moreoutput@gmail.com 2012
*/
 require(['dojo/dom', 'dojo/string', 'dojo/query', 'dojo/dom-attr', 'dojo/on', 'dojo/_base/event', 'dojo/window', 'dojo/ready', 'dojo/NodeList-dom'], 
	function (dom, string, query, domAttr, on, event, win, ready) {
		ready(function () {
			'use strict';
			var ws = io.connect(''),
			terminal = dom.byId('terminal'),
			/* Command aliases are loaded by the client */
			aliases = {	
				n: 'north',
				e: 'east',
				w: 'west',
				s: 'south',
				u: 'up',
				d: 'down',
				l: 'look',
				i: 'inventory',
				sc: 'score',
				eq: 'equipment',
				q: 'quaff',
				c: 'cast',
				k: 'kill',
				re: 'rest',
				sl: 'sleep',
				wh: 'where',
				ooc: 'chat'
			},
			display = function(r) {
				if (r.element === undefined) {
					terminal.innerHTML += '<p class="' + r.styleClass + '">' + r.msg + '</p>';
				} else {
					terminal.innerHTML += '<' + r.element + ' class="' + r.styleClass + '">' + r.msg + '</' + r.element + '>';
				}

				return parseCmd(r);
			},
			parseCmd = function(r) {
				if (r.msg != undefined) {
					r.msg = string.trim(r.msg.replace(/ /g, ' '));
					ws.emit(r.emit, r);
				}
			},
			changeMudState = function(state) {
				domAttr.set(dom.byId('cmd'), 'mud-state', state);
			},		
			
			checkAlias = function(cmdStr, fn) {
				var keys = Object.keys(aliases),
				i = 0,
				cmd,
				msg,
				cmdArr = cmdStr.split(' ');

				cmd = cmdArr[0].toLowerCase();
				msg = cmdArr.slice(1).toString().replace(',', ' ');
	
				for (i; i < keys.length; i += 1) {
					if (keys[i] === cmd) {
						return fn(aliases[keys[i]] + ' ' + msg);
					}	
				}
				return fn(cmd + ' ' + msg);				
			};
				
			ws.on('msg', function(r) {
				display(r);
				
				if (r.res) {
					changeMudState(r.res);	
				}
			});			
				
			var frmH = on(dom.byId('console'), 'submit', function (e) {				
				var node = dom.byId('cmd'),
				messageNodes = [],
				msg = string.trim(node.value.toLowerCase());
			
				e.preventDefault();
				
				display({
					msg : checkAlias(msg, function(cmd) {
						return cmd;
					}),
					emit : (function () {
						var res = domAttr.get(node, 'mud-state');

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
				});
					
				node.value = '';
				node.focus();
				
				terminal.scrollTop = terminal.scrollHeight;	
			});
		});
	});