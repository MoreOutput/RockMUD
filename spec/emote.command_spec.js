const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Skill: EMOTE', () => {
    let mockEntity;
    let mockEntityRoom;
    let mockEntityArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
        mockEntityArea = MOCK_SERVER.area;
    });

    it('should find the players room if it is not provided on the command', () => {
        const roomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();

        expect(server.world.commands.emote).toBeTruthy();

        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            msg: 'gives everyone a high five!'
        });

        expect(roomSpy).toHaveBeenCalledWith(mockEntity.area, mockEntity.roomid); 
    });

    it('should send a message to everyone in the room prefixed with the entities displayName', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();

        mockEntity.name = 'hollie';
        mockEntity.displayName = 'Hollie';

        expect(server.world.commands.emote).toBeTruthy();

        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            roomObj: mockEntityRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgRoomSpy).toHaveBeenCalledWith(mockEntityRoom, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            darkMsg: 'You sense some movement in the area.',
            noPrompt: true,
            styleClass: 'cmd-emote warning',
            checkSight: true,
            playerName: 'hollie'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });
    });

    it('should not allow the character to emote if they are fighting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockEntity.name = 'hollie';
        mockEntity.displayName = 'Hollie';
        
        mockEntity.fighting = true;

        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            roomObj: mockEntityRoom,
            msg: 'gives everyone a high five!'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You can\'t emote right now.',
            styleClass: 'error'
        });
    });

    it('should not allow the character to emote if they are not in the standing or resting position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockEntity.name = 'hollie';
        mockEntity.displayName = 'Hollie';
        
        mockEntity.fighting = false;
        mockEntity.position = 'sleeping';
        
        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            roomObj: mockEntityRoom,
            msg: 'gives everyone a high five!'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You can\'t emote right now.',
            styleClass: 'error'
        });

        mockEntity.position = 'resting';
       
        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            roomObj: mockEntityRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });

        mockEntity.position = 'resting';

        server.world.commands.emote(mockEntity, {
            cmd: 'emote',
            roomObj: mockEntityRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockEntity, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });
    });
});
