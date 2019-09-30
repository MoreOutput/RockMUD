const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: REMOVE', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
        mockPlayerArea = MOCK_SERVER.area;
    });

    it('should remove worn equipment', () => {
        expect(server.world.commands.remove).toBeTruthy();
    });
});
