const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Feature: Wearing Equipment', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            mockPlayer = MOCK_SERVER.player;
            mockPlayerRoom = MOCK_SERVER.room;
    
            server = MOCK_SERVER.server;

            done();
        });
    });

    it('should pick up an item and wear it in the entitys right hand', () => {
        
    });
});
