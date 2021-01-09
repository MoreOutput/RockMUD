const MOCK_SERVER = require('../mocks/mock_server');
let mud;


describe('Testing Feature: Hunger and Thirst', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            mud.createNewEntity((playerModel) => {
                mockPlayer = playerModel;
                mockPlayer.refId = 'unit-test-player'
                mockPlayer.area = 'midgaard';
                mockPlayer.originatingArea = mockPlayer.area;
                mockPlayer.roomid = '1';
                mockPlayer.isPlayer = true;
                mockPlayer.level = 1;
                mockPlayer.name = 'Bilbo';
                mockPlayer.displayName = 'Bilbo';
                mockPlayer.combatName = 'Bilbo';
                mockPlayer.hp = 100;
                mockPlayer.chp = 100;
                mockPlayer.hunger = 9;
                mockPlayer.thirst = 9;

                mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);

                mockPlayerRoom.playersInRoom.push(mockPlayer);

                server.world.players.push(mockPlayer);

                done();
            });
        }, false, false);
    });

    // hunger ticks upward to an entities maxHunger and then deals damage
    // every check afterward
    it('should simulate player reaching their max hunger and taking damage', () => {
        const charHungerSpy = spyOn(server.world.character, 'hunger').and.callThrough();
        const charThirstSpy = spyOn(server.world.character, 'thirst').and.callThrough();

        server.world.ticks.hungerThirstLoop(server.world);

        expect(charHungerSpy).toHaveBeenCalledTimes(1);
        expect(charThirstSpy).toHaveBeenCalledTimes(1);
        expect(mockPlayer.hunger).toBe(10);
        expect(mockPlayer.thirst).toBe(10);
        expect(mockPlayer.chp).toBe(100);

        server.world.ticks.hungerThirstLoop(server.world);

        expect(charHungerSpy).toHaveBeenCalledTimes(2);
        expect(charThirstSpy).toHaveBeenCalledTimes(2);
        expect(mockPlayer.hunger).toBe(10);
        expect(mockPlayer.thirst).toBe(10);
        expect(mockPlayer.chp).toBeLessThan(100);
    });
});
