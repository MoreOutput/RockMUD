const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: REST', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;

            done();
        });
    });

    it('should move the entity into the resting position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();
        const getRoomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();

        expect(server.world.commands.rest).toBeTruthy();

        mockPlayer.name = 'test-name';
        mockPlayer.displayName = 'TEST';

        server.world.commands.rest(mockPlayer, {
            cmd: 'rest'
        });

        expect(mockPlayer.position).toBe('resting');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You try to make yourself comfortable and begin resting.',
            styleClass: 'cmd-rest'
        });
        expect(getRoomSpy).toHaveBeenCalledWith(mockPlayer.area, mockPlayer.roomid);
        expect(msgRoomSpy).toHaveBeenCalledWith(mockPlayerRoom, {
            msg: 'TEST begins to rest.',
            playerName: 'test-name',
            styleClass: 'cmd-rest'
        });
    });

    it('should alert the entity if they are already resting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockPlayer.name = 'test-name';
        mockPlayer.displayName = 'TEST';
        mockPlayer.position = 'resting'; // already resting

        server.world.commands.rest(mockPlayer, {
            cmd: 'rest',
            roomObj: mockPlayerRoom
        });
        
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You are resting now...do you expect to rest harder?'
        });
    });

    it('should prevent the entity from resting if they are fighting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockPlayer.name = 'test-name';
        mockPlayer.displayName = 'TEST';
        mockPlayer.fighting = true;

        server.world.commands.rest(mockPlayer, {
            cmd: 'rest',
            roomObj: mockPlayerRoom
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You can\'t rest right now.'
        });
    });
});
