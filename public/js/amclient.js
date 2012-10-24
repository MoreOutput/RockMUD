require(['dojo/dom', 'dojo/string', 'dojo/query', 'dojo/dom-attr', 'dojo/on', 'dojo/_base/event', 'dojo/window', 'dojo/ready', 'dojo/NodeList-dom'], 
	function (dom, string, query, domAttr, on, event, win, ready) {
		ready(function () {
			'use strict';
			var ws = io.connect('127.0.0.1:8000'),
			terminal = dom.byId('terminal'),
			display = function(r) {
				terminal.innerHTML += '<p><div class="' + r.styleClass + '">' + r.msg + '</div></p>';
				return parseCmd(r);
			},
			parseCmd = function(r) {
				if (r.msg != undefined) {
					r.msg = r.msg.replace(/ /g, '_');
					ws.emit(r.emit, r);
				}
			},
			changeMudState = function(state) {
				domAttr.set(dom.byId('cmd'), 'mud-state', state);
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
					msg : msg,
					emit : (function () {
						var res = dojo.attr(node, 'mud-state');
						if (dojo.attr(node, 'mud-state') === 'login') {
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
				
				messageNodes = query('#terminal div');
				win.scrollIntoView(messageNodes[messageNodes.length - 1]);	
			});
		});
	});