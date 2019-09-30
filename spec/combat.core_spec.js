const server = require('../server');
const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing core module: COMBAT', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let mockMob;

    beforeEach(() => {
        MOCK_SERVER.setup(server);
        
        mockPlayer = MOCK_SERVER.entity;
        mockPlayerRoom = MOCK_SERVER.room;
        mockPlayerArea = MOCK_SERVER.area;

        mockMob = MOCK_SERVER.getNewEntity();
        mockMob.isPlayer = false;
        mockMob.name = 'dragon';
        mockMob.displayName = 'Test Dragon';

        mockPlayerRoom.monsters.push(mockMob);
    });

    it('should create a Battle Object', () => {
        const battlePosSpy = spyOn(server.world.combat, 'createBattlePosition').and.callThrough();
        const battleObj = server.world.combat.createBattleObject(mockPlayer, mockMob, mockPlayerRoom, null, null);

        expect(battlePosSpy).toHaveBeenCalled();
        expect(battleObj.positions['0'].attacker).toBe(mockPlayer);
        expect(battleObj.positions['0'].defender).toBe(mockMob);

        expect(battleObj.round).toBe(0);
        expect(battleObj.roomObj).toBe(mockPlayerRoom);
        expect(Object.keys(battleObj.skills).length).toBe(0);
        expect(battleObj.attacked.length).toBe(0);
    });

    describe('processFight()', () => {
        it('should add a new Battle Object into the combat queue', () => {
            expect(mockMob.fighting).toBe(false);
        });
    });
});
