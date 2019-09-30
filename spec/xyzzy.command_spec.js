const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: XYZZY', () => {
    let mockPlayer;
    let mockRoom;
    let cmd;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
    
        cmd = {
            cmd: 'XYZZY',
            roomObj: mockRoom
        };
    });

    it('should print "Nothing happens. Why would it?" to the user', () => {
        const spy = spyOn(server.world, 'msgPlayer').and.callThrough();

        expect(server.world.commands.xyzzy).toBeTruthy();

        server.world.commands.xyzzy(mockPlayer, cmd);

        expect(spy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'Nothing happens. Why would it?',
            styleClass: 'error'
        });
    });

    it('should print "You dream of powerful forces." to a sleeping user', () => {
        const spy = spyOn(server.world, 'msgPlayer').and.callThrough();

        expect(server.world.commands.xyzzy).toBeTruthy();

        mockPlayer.position = 'sleeping';

        server.world.commands.xyzzy(mockPlayer, cmd);

        expect(spy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You dream of powerful forces.',
            styleClass: 'error'
        });
    });
});
