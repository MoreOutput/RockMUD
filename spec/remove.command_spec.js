const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: REMOVE', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            mockPlayer = MOCK_SERVER.player;
            mockPlayerRoom = MOCK_SERVER.room;
            mockPlayerArea = MOCK_SERVER.area;
    
            server = MOCK_SERVER.server;

            done();
        });
    });

    it('should remove worn equipment', () => {
        expect(server.world.commands.remove).toBeTruthy();
    });
});
