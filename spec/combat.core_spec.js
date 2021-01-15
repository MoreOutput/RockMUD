const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Core: COMBAT', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let dragon;
    let server;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            mockPlayer = mud.player;
            mockPlayerRoom = mud.room;
            mockPlayerArea = mud.area;

            dragon = mud.getNewEntity();
            dragon.isPlayer = false;
            dragon.name = 'dragon';
            dragon.displayName = 'Test Dragon';
            dragon.refId = 'dragon-refid';
            dragon.chp = 100;

            mockPlayerRoom.monsters.push(dragon);
        
            done();
        });
    });

    it('should create a Battle Object', () => {
        const battlePosSpy = spyOn(server.world.combat, 'createBattlePosition').and.callThrough();
        const battleObj = server.world.combat.createBattleObject(mockPlayer, dragon, mockPlayerRoom);

        expect(battlePosSpy).toHaveBeenCalled();
        expect(battleObj.positions['0'].attacker).toBe(mockPlayer);
        expect(battleObj.positions['0'].defender).toBe(dragon);

        expect(battleObj.round).toBe(0);
        expect(battleObj.roomObj).toBe(mockPlayerRoom);
        expect(Object.keys(battleObj.skills).length).toBe(0);
        expect(battleObj.attacked.length).toBe(0);
    });

    it('should return the total positions in a given battle object', () => {
        let battleObj = server.world.combat.createBattleObject(mockPlayer, dragon, mockPlayerRoom);
        let posCnt = server.world.combat.getNextBattlePosition(battleObj);

        expect(posCnt).toBe(1); // by default we have 1 position, position 0

        battleObj.positions['1'] = {};

        posCnt = server.world.combat.getNextBattlePosition(battleObj);

        expect(posCnt).toBe(2);
    });

    it('should create a Battle Position', () => {
        const battlePos = server.world.combat.createBattlePosition();

        expect(Object.keys(battlePos).length).toBe(2);
        expect(battlePos.attacker).toBe(null);
        expect(battlePos.defender).toBe(null);
    });

    it('should detect if two given entities are in the same room', () => {
        let sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, dragon);
        
        expect(sameRoom).toBe(true);
    
        dragon.area = 'new-area';

        sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, dragon);

        expect(sameRoom).toBe(false);

        dragon.area = mockPlayer.area;
        dragon.roomid = 'test-room-id';

        sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, dragon);

        expect(sameRoom).toBe(false);
    });

    it('should add a new Battle Object into the combat queue', () => {
        const addBattle = spyOn(server.world.battles, 'push').and.callThrough();

        expect(server.world.battles.length).toBe(0);
        expect(dragon.fighting).toBe(false);
        expect(mockPlayer.fighting).toBe(false);

        server.world.combat.processFight(mockPlayer, dragon, mockPlayerRoom, null, null);

        expect(dragon.fighting).toBe(true);
        expect(mockPlayer.fighting).toBe(true);
        expect(addBattle).toHaveBeenCalled();
        expect(server.world.battles.length).toBe(1);
    });

    // if an attacker or defender in any position matches the refId the battle is returned
    it('should find a battle by refId', () => {
        let goblin = mud.getNewEntity();
        goblin.isPlayer = false;
        goblin.name = 'goblin';
        goblin.displayName = 'Test Goblin';
        goblin.refId = 'goblin-refid';

        mockPlayerRoom.monsters.push(goblin);

        server.world.combat.processFight(mockPlayer, dragon, mockPlayerRoom, null, null);
        server.world.combat.processFight(mockPlayer, goblin, mockPlayerRoom, null, null);

        const battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);

        expect(server.world.combat.getBattleByRefId(null)).toBeFalsy();
        expect(Object.keys(battleObj.positions).length).toBe(2);
        expect(server.world.combat.getBattleByRefId(mockPlayer.refId)).toEqual(battleObj);
        expect(server.world.combat.getBattleByRefId(dragon.refId)).toEqual(battleObj);
        expect(server.world.combat.getBattleByRefId(goblin.refId)).toEqual(battleObj);
    });
});
