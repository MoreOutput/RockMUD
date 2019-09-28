const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

// Admin only command for healing everyone on the MUD
describe('Testing Skill: RESTORE', () => {
    let mockEntity;
    let mockEntityRoom;
    let mockEntityArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);

        mockEntity = MOCK_SERVER.entity;
        mockEntityRoom = MOCK_SERVER.room;
        mockEntityArea = MOCK_SERVER.area;
    });

    it('should heal every player to their maximum health', () => {
        const msgWorldSpy = spyOn(server.world, 'msgWorld').and.callThrough();

        expect(server.world.commands.restore).toBeTruthy();
        
        mockEntity.role = 'admin';
        mockEntity.chp = 1;
        mockEntity.hp = 100;
        mockEntity.cmana = 1;
        mockEntity.mana = 100;
        mockEntity.cmv = 1;
        mockEntity.mv = 100;
        mockEntity.hunger = 10;
        mockEntity.thirst = 10;
        mockEntity.wait = 10;

        server.world.commands.restore(mockEntity);

        expect(msgWorldSpy).toHaveBeenCalledWith({
            msg: 'You feel refreshed!',
            noPrompt: true
        });
        expect(mockEntity.chp).toBe(100);
        expect(mockEntity.cmana).toBe(100);
        expect(mockEntity.cmv).toBe(100);
        expect(mockEntity.hunger).toBe(0);
        expect(mockEntity.thirst).toBe(0);
        expect(mockEntity.wait).toBe(0);
    });

    it('should be an admin entity or have allAdmin=true before being able to use the command', () => {
        const msgWorldSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        
        mockEntity.chp = 1;
        mockEntity.hp = 100;

        server.world.config.allAdmin = false;

        server.world.commands.restore(mockEntity);

        expect(msgWorldSpy).toHaveBeenCalledWith(mockEntity, {
            msg: 'You do not possess that kind of power.',
            styleClass: 'error'
        });
        expect(mockEntity.chp).toBe(1);

        server.world.config.allAdmin = true;

        server.world.commands.restore(mockEntity);

        expect(msgWorldSpy).toHaveBeenCalled();
        expect(mockEntity.chp).toBe(100);
    });
});
