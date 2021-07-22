'use strict';
var mud = require('./rockmud'),
cfg = require('./config'),
server = new mud(cfg.server.port, cfg.server.game);

console.log('RockMUD is now running on port:', server.port)