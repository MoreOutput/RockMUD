const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: KILL', () => {
    let mockPlayer;
    let mockMob;
    let mockPlayerRoom;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;
        
            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;

            mockMob = mud.getNewEntity();
            mockMob.id = 'test-dragon';
            mockMob.refId = 'test-dragon-ref-id';
            mockMob.isPlayer = false;
            mockMob.name = 'dragon';
            mockMob.displayName = 'Test Dragon';
            mockMob.fighting = false;

            mockPlayerRoom.monsters.push(mockMob);

            done();
        });
    });

    it('should initiate combat with the first valid entity in the room', () => {
        const processFightSpy = spyOn(mud.server.world.combat, 'processFight').and.callThrough();
        const cmd = {
            cmd: 'kill',
            msg: 'dragon',
            arg: 'dragon',
            roomObj: mockPlayerRoom
        };

        expect(mud.server.world.commands.kill).toBeTruthy();

        mud.server.world.commands.kill(mockPlayer, cmd);

        expect(processFightSpy).toHaveBeenCalledWith(mockPlayer, mockMob, mockPlayerRoom);
    });
});
