const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: MOVE', () => {
    let mockPlayer;
    let mockMob;
    let mockPlayerRoom;
    let mockPlayerArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
        mockPlayerArea = MOCK_SERVER.area;
    });

    it('should exist', () => {
        expect(server.world.commands.move).toBeTruthy();
    });

    it('should update the players roomid when traveling to a new room', () => {
        
    });
});
