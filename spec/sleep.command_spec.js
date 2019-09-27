const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Skill: SLEEP', () => {
    let mockEntity;
    let mockEntityRoom;
    let mockEntityArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);

        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
        mockEntityArea = MOCK_SERVER.area;
    });

    it('should move the entity into the sleeping position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();
        const getRoomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();
        // 25% of the time sleep can result in a save of the player
        const diceRollSpy = spyOn(server.world.dice, 'roll').and.callFake(() => 1);
        const saveSpy = spyOn(server.world.character, 'save').and.callThrough();

        expect(server.world.commands.sleep).toBeTruthy();

        mockEntity.name = 'test-name';
        mockEntity.displayName = 'TEST';

        server.world.commands.sleep(mockEntity, {
            cmd: 'sleep',
            roomObj: mockEntityRoom
        });

        expect(mockEntity.position).toBe('sleeping');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You lie down and go to sleep.',
            styleClass: 'cmd-sleep'
        });
        expect(getRoomSpy).toHaveBeenCalledWith(mockEntity.area, mockEntity.roomid);
        expect(msgRoomSpy).toHaveBeenCalledWith(mockEntityRoom, {
            msg: 'TEST lies down and goes to sleep.',
            playerName: 'test-name',
            styleClass: 'cmd-sleep'
        });
        expect(diceRollSpy).toHaveBeenCalledWith(1, 4);
        expect(saveSpy).toHaveBeenCalledWith(mockEntity);
    });

    it('should only trigger a save 25% of the time', () => {
        const diceRollSpy = spyOn(server.world.dice, 'roll').and.callFake(() => 2);
        const saveSpy = spyOn(server.world.character, 'save').and.callThrough();

        server.world.commands.sleep(mockEntity, {
            cmd: 'sleep',
            roomObj: mockEntityRoom
        });

        expect(diceRollSpy).toHaveBeenCalledWith(1, 4);
        expect(saveSpy).not.toHaveBeenCalled();
    });
    
    it('should give the entity a message telling them they are already asleep', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockEntity.position = 'sleeping';

        server.world.commands.sleep(mockEntity, {
            cmd: 'sleep',
            roomObj: mockEntityRoom
        });

        expect(mockEntity.position).toBe('sleeping');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You are already asleep...',
            styleClass: 'warning'
        });
    });

    it('should prevent the entity from sleeping if they are not currently standing or resting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockEntity.position = 'fake-position';

        server.world.commands.sleep(mockEntity, {
            cmd: 'sleep',
            roomObj: mockEntityRoom
        });

        expect(mockEntity.position).toBe('fake-position');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You can\'t go to sleep right now.',
            styleClass: 'warning'
        });
    });
});
