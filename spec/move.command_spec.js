const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: MOVE', () => {
    let mockPlayer;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            mockPlayer = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';

            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);
    
            done();
        });
    });

    it('should exist', () => {
        expect(server.world.commands.move).toBeTruthy();
    });

    it('should update the players roomid when traveling to a new room', () => {
        let cmd = server.world.commands.createCommandObject(
            {msg: 'move north'},
            mockPlayer
        );

        server.world.commands.move(mockPlayer, cmd);

        expect(mockPlayer.roomid).toBe('2');
    });

    it('should remove movement when traveling to a new room', () => {
        mockPlayer.cmv = 100;
        
        let cmd = server.world.commands.createCommandObject(
            {msg: 'move south'},
            mockPlayer
        );

        server.world.commands.move(mockPlayer, cmd);

        expect(mockPlayer.roomid).toBe('4');
        expect(mockPlayer.cmv).toBeLessThan(100);
    });
});
