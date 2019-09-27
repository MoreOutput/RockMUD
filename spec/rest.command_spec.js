const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Skill: REST', () => {
    let mockEntity;
    let mockEntityRoom;
    let mockEntityArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);

        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
        mockEntityArea = MOCK_SERVER.area;
    });

    it('should move the entity into the resting position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();
        const getRoomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();

        expect(server.world.commands.rest).toBeTruthy();

        mockEntity.name = 'test-name';
        mockEntity.displayName = 'TEST';

        server.world.commands.rest(mockEntity, {
            cmd: 'rest'
        });

        expect(mockEntity.position).toBe('resting');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You try to make yourself comfortable and begin resting.',
            styleClass: 'cmd-rest'
        });
        expect(getRoomSpy).toHaveBeenCalledWith(mockEntity.area, mockEntity.roomid);
        expect(msgRoomSpy).toHaveBeenCalledWith(mockEntityRoom, {
            msg: 'TEST begins to rest.',
            playerName: 'test-name',
            styleClass: 'cmd-rest'
        });
    });

    it('should alert the entity if they are already resting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockEntity.name = 'test-name';
        mockEntity.displayName = 'TEST';
        mockEntity.position = 'resting'; // already resting

        server.world.commands.rest(mockEntity, {
            cmd: 'rest',
            roomObj: mockEntityRoom
        });
        
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You are resting now...do you expect to rest harder?'
        });
    });

    it('should prevent the entity from resting if they are fighting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockEntity.name = 'test-name';
        mockEntity.displayName = 'TEST';
        mockEntity.fighting = true;

        server.world.commands.rest(mockEntity, {
            cmd: 'rest',
            roomObj: mockEntityRoom
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You can\'t rest right now.'
        });
    });
});
