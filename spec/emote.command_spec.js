const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: EMOTE', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
    
            server = mud.server;

            done();
        });
    });

    it('should find the players room if it is not provided on the command', () => {
        const roomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();

        expect(server.world.commands.emote).toBeTruthy();

        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            msg: 'gives everyone a high five!'
        });

        expect(roomSpy).toHaveBeenCalledWith(mockPlayer.area, mockPlayer.roomid); 
    });

    it('should send a message to everyone in the room prefixed with the entities displayName', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();

        mockPlayer.name = 'hollie';
        mockPlayer.displayName = 'Hollie';

        expect(server.world.commands.emote).toBeTruthy();

        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            roomObj: mockPlayerRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgRoomSpy).toHaveBeenCalledWith(mockPlayerRoom, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            darkMsg: 'You sense some movement in the area.',
            noPrompt: true,
            styleClass: 'cmd-emote warning',
            checkSight: true,
            playerName: 'hollie'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });
    });

    it('should not allow the character to emote if they are fighting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockPlayer.name = 'hollie';
        mockPlayer.displayName = 'Hollie';
        
        mockPlayer.fighting = true;

        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            roomObj: mockPlayerRoom,
            msg: 'gives everyone a high five!'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You can\'t emote right now.',
            styleClass: 'error'
        });
    });

    it('should not allow the character to emote if they are not in the standing or resting position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        mockPlayer.name = 'hollie';
        mockPlayer.displayName = 'Hollie';
        
        mockPlayer.fighting = false;
        mockPlayer.position = 'sleeping';
        
        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            roomObj: mockPlayerRoom,
            msg: 'gives everyone a high five!'
        });

        // emoting player sees the output regardless of room state (darkness and etc)
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You can\'t emote right now.',
            styleClass: 'error'
        });

        mockPlayer.position = 'resting';
       
        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            roomObj: mockPlayerRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });

        mockPlayer.position = 'resting';

        server.world.commands.emote(mockPlayer, {
            cmd: 'emote',
            roomObj: mockPlayerRoom,
            msg: 'gives everyone a high five!'
        });

        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: '<i>Hollie gives everyone a high five!</i>',
            styleClass: 'cmd-emote',
            noPrompt: true
        });
    });
});
