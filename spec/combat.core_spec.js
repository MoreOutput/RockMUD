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
        const battleObj = server.world.combat.createBattleObject(mockPlayer, mockMob, mockPlayerRoom);

        expect(battlePosSpy).toHaveBeenCalled();
        expect(battleObj.positions['0'].attacker).toBe(mockPlayer);
        expect(battleObj.positions['0'].defender).toBe(mockMob);

        expect(battleObj.round).toBe(0);
        expect(battleObj.roomObj).toBe(mockPlayerRoom);
        expect(Object.keys(battleObj.skills).length).toBe(0);
        expect(battleObj.attacked.length).toBe(0);
    });

    it('should create a Battle Position', () => {
        // todo here
    });

    it('should add a new Battle Object into the combat queue', () => {
        const addBattle = spyOn(server.world.battles, 'push').and.callThrough();

        expect(server.world.battles.length).toBe(0);
        expect(mockMob.fighting).toBe(false);
        expect(mockPlayer.fighting).toBe(false);

        server.world.combat.processFight(mockPlayer, mockMob, mockPlayerRoom, null, null);

        expect(mockMob.fighting).toBe(true);
        expect(mockPlayer.fighting).toBe(true);
        expect(addBattle).toHaveBeenCalled();
        expect(server.world.battles.length).toBe(1);
    });

    it('should process a round for each Battle Object', () => {
    });
});
