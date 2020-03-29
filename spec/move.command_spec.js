const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: MOVE', () => {
    let mockPlayer;
    let mockMob;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            mockPlayer = MOCK_SERVER.player;
            mockPlayerRoom = MOCK_SERVER.room;
            mockPlayerArea = MOCK_SERVER.area;
    
            server = MOCK_SERVER.server;

            done();
        });
    });

    it('should exist', () => {
        expect(server.world.commands.move).toBeTruthy();
    });

    it('should update the players roomid when traveling to a new room', () => {
        
    });
});
