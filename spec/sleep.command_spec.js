const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: SLEEP', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;
    
            server = mud.server;

            done();
        });
    });

    it('should move the entity into the sleeping position', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        const msgRoomSpy = spyOn(server.world, 'msgRoom').and.callThrough();
        const getRoomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();
        // 25% of the time sleep can result in a save of the player
        const diceRollSpy = spyOn(server.world.dice, 'roll').and.callFake(() => 1);
        const saveSpy = spyOn(server.world.character, 'save').and.callThrough();

        expect(server.world.commands.sleep).toBeTruthy();

        mockPlayer.name = 'test-name';
        mockPlayer.displayName = 'TEST';

        server.world.commands.sleep(mockPlayer, {
            cmd: 'sleep',
            roomObj: mockPlayerRoom
        });

        expect(mockPlayer.position).toBe('sleeping');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You lie down and go to sleep.',
            styleClass: 'cmd-sleep'
        });
        expect(getRoomSpy).toHaveBeenCalledWith(mockPlayer.area, mockPlayer.roomid);
        expect(msgRoomSpy).toHaveBeenCalledWith(mockPlayerRoom, {
            msg: 'TEST lies down and goes to sleep.',
            playerName: mockPlayer.name,
            styleClass: 'cmd-sleep'
        });
        expect(diceRollSpy).toHaveBeenCalledWith(1, 4);
        expect(saveSpy).toHaveBeenCalledWith(mockPlayer);
    });

    it('should only trigger a save 25% of the time', () => {
        const diceRollSpy = spyOn(server.world.dice, 'roll').and.callFake(() => 2);
        const saveSpy = spyOn(server.world.character, 'save').and.callThrough();

        server.world.commands.sleep(mockPlayer, {
            cmd: 'sleep',
            roomObj: mockPlayerRoom
        });

        expect(diceRollSpy).toHaveBeenCalledWith(1, 4);
        expect(saveSpy).not.toHaveBeenCalled();
    });
    
    it('should give the entity a message telling them they are already asleep', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockPlayer.position = 'sleeping';

        server.world.commands.sleep(mockPlayer, {
            cmd: 'sleep',
            roomObj: mockPlayerRoom
        });

        expect(mockPlayer.position).toBe('sleeping');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You are already asleep...',
            styleClass: 'warning'
        });
    });

    it('should prevent the entity from sleeping if they are not currently standing or resting', () => {
        const msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockPlayer.position = 'fake-position';

        server.world.commands.sleep(mockPlayer, {
            cmd: 'sleep',
            roomObj: mockPlayerRoom
        });

        expect(mockPlayer.position).toBe('fake-position');
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You can\'t go to sleep right now.',
            styleClass: 'warning'
        });
    });
});
