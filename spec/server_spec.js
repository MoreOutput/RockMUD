var request = require('request');
var server = require('../server');
var base_url = 'http://localhost:3001/';

describe('Testing core RockMUD server', () => {
    it('should have a server and WS connection after booting', () => {
        expect(server).toBeTruthy();
        expect(server.world).toBeTruthy();
        expect(server.server).toBeTruthy();
    });
    
    describe('GET /', function() {
        it('returns status code 200', function(done) {
            request.get(base_url, function(error, response, body) {
                expect(response.statusCode).toBe(200);
                done();
            });
        });
    });
});
