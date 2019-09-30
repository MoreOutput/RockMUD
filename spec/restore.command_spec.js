const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

// Admin only command for healing everyone on the MUD
describe('Testing Command: RESTORE', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);

        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
        mockPlayerArea = MOCK_SERVER.area;
    });

    it('should heal every player to their maximum health', () => {
        const msgWorldSpy = spyOn(server.world, 'msgWorld').and.callThrough();

        expect(server.world.commands.restore).toBeTruthy();
        
        mockPlayer.role = 'admin';
        mockPlayer.chp = 1;
        mockPlayer.hp = 100;
        mockPlayer.cmana = 1;
        mockPlayer.mana = 100;
        mockPlayer.cmv = 1;
        mockPlayer.mv = 100;
        mockPlayer.hunger = 10;
        mockPlayer.thirst = 10;
        mockPlayer.wait = 10;

        server.world.commands.restore(mockPlayer);

        expect(msgWorldSpy).toHaveBeenCalledWith({
            msg: 'You feel refreshed!',
            noPrompt: true
        });
        expect(mockPlayer.chp).toBe(100);
        expect(mockPlayer.cmana).toBe(100);
        expect(mockPlayer.cmv).toBe(100);
        expect(mockPlayer.hunger).toBe(0);
        expect(mockPlayer.thirst).toBe(0);
        expect(mockPlayer.wait).toBe(0);
    });

    it('should be an admin entity or have allAdmin=true before being able to use the command', () => {
        const msgWorldSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockPlayer.chp = 1;
        mockPlayer.hp = 100;

        server.world.config.allAdmin = false;

        server.world.commands.restore(mockPlayer);

        expect(msgWorldSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'You do not possess that kind of power.',
            styleClass: 'error'
        });
        expect(mockPlayer.chp).toBe(1);

        server.world.config.allAdmin = true;

        server.world.commands.restore(mockPlayer);

        expect(msgWorldSpy).toHaveBeenCalled();
        expect(mockPlayer.chp).toBe(100);
    });
});
