const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: KILL', () => {
    let mockPlayer;
    let mockMob;
    let mockPlayerRoom;
    let mockPlayerArea;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
        mockPlayerArea = MOCK_SERVER.area;

        mockMob = MOCK_SERVER.getNewEntity();
        mockMob.id = 'test-dragon';
        mockMob.refId = 'test-dragon-ref-id';
        mockMob.isPlayer = false;
        mockMob.name = 'dragon';
        mockMob.displayName = 'Test Drago2n';
        mockMob.fighting = false;

        mockPlayerRoom.monsters.push(mockMob);
    });

    it('should initiate combat with the first valid entity in the room', () => {
        const roomSpy = spyOn(server.world, 'getRoomObject').and.callThrough();
        const searchSpy = spyOn(server.world, 'search').and.callThrough();
        const processFightSpy = spyOn(server.world.combat, 'processFight').and.callThrough();
        const cmd = {
            cmd: 'kill',
            msg: 'dragon',
            arg: 'dragon',
            roomObj: mockPlayerRoom
        };

        expect(server.world.commands.kill).toBeTruthy();

        server.world.commands.kill(mockPlayer, cmd);

        expect(searchSpy).toHaveBeenCalledWith(mockPlayerRoom.monsters, cmd);
        expect(processFightSpy).toHaveBeenCalledWith(mockPlayer, mockMob, mockPlayerRoom);
    });
});
