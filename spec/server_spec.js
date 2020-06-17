var request = require('request');
var server = require('../server');
var base_url = 'http://localhost:3001/';

describe('Testing Core: SERVER', () => {
    it('should have a server and WS connection after booting', () => {
        expect(server).toBeTruthy();
        expect(server.world).toBeTruthy();
        expect(server.server).toBeTruthy();
    });
});
