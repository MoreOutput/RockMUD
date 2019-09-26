const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Skill: XYZZY', () => {
    let mockEntity;
    let mockRoom;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
    });

    it('should print "Nothing happens. Why would it?" to the user', () => {
        const spy = spyOn(server.world, 'msgPlayer').and.callThrough();

        expect(server.world.commands.xyzzy).toBeTruthy();

        server.world.commands.xyzzy(mockEntity, {
            cmd: 'XYZZY',
            roomObj: mockRoom
        });

        expect(spy).toHaveBeenCalledWith(mockEntity, {
            msg: 'Nothing happens. Why would it?',
            styleClass: 'error'
        });
    });

    it('should print "You dream of powerful forces." to a sleeping user', () => {
        const spy = spyOn(server.world, 'msgPlayer').and.callThrough();

        expect(server.world.commands.xyzzy).toBeTruthy();

        mockEntity.position = 'sleeping';

        server.world.commands.xyzzy(mockEntity, {
            cmd: 'XYZZY',
            roomObj: mockRoom
        });

        expect(spy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You dream of powerful forces.',
            styleClass: 'error'
        });
    });
});
