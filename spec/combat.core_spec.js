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
        mockMob.refId = 'dragon-refid';

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

    it('should return the total positions in a given battle object', () => {
        // getting the battle positions results in a count from 1 -- since
        // we order positions starting from 0 a count can be used as the next position
        let battleObj = server.world.combat.createBattleObject(mockPlayer, mockMob, mockPlayerRoom);
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
        let sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, mockMob);
        
        expect(sameRoom).toBe(true);
    
        mockMob.area = 'new-area';

        sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, mockMob);

        expect(sameRoom).toBe(false);

        mockMob.area = mockPlayer.area;
        mockMob.roomid = 'test-room-id';

        sameRoom = server.world.combat.inPhysicalVicinity(mockPlayer, mockMob);

        expect(sameRoom).toBe(false);
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

    // if an attacker or defender in any position matches the refId the battle is returned
    it('should find a battle by refId', () => {
        secondMob = MOCK_SERVER.getNewEntity();
        secondMob.isPlayer = false;
        secondMob.name = 'goblin';
        secondMob.displayName = 'Test Goblin';
        secondMob.refId = 'goblin-refid';

        mockPlayerRoom.monsters.push(secondMob);

        server.world.combat.processFight(mockPlayer, mockMob, mockPlayerRoom, null, null);
        server.world.combat.processFight(mockPlayer, secondMob, mockPlayerRoom, null, null);

        const battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);

        expect(server.world.combat.getBattleByRefId(null)).toBeFalsy();
        expect(Object.keys(battleObj.positions).length).toBe(2);
        expect(server.world.combat.getBattleByRefId(mockPlayer.refId)).toEqual(battleObj);
        expect(server.world.combat.getBattleByRefId(mockMob.refId)).toEqual(battleObj);
        expect(server.world.combat.getBattleByRefId(secondMob.refId)).toEqual(battleObj);
    });


    it('should find a battle by refId', () => {
        
    });

    describe('combat rounds', () => {
        it('should process a combat round for each Battle Object position', () => {
            secondMob = MOCK_SERVER.getNewEntity();
            secondMob.isPlayer = false;
            secondMob.name = 'goblin';
            secondMob.displayName = 'Test Goblin';
            secondMob.refId = 'goblin-refid';
    
            mockPlayerRoom.monsters.push(secondMob);
    
            server.world.combat.processFight(mockPlayer, mockMob, mockPlayerRoom, null, null);
            server.world.combat.processFight(mockPlayer, secondMob, mockPlayerRoom, null, null);
    
            const attackSpy = spyOn(server.world.combat, 'attack').and.callThrough();
            const endOfCombatSpy = spyOn(server.world.combat, 'processEndOfCombat').and.callThrough();
            const battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);
            const vicinityCheckSpy = spyOn(server.world.combat, 'inPhysicalVicinity').and.callThrough();
            const battlePosSpy = spyOn(server.world.combat, 'getNumberOfBattlePositions').and.callThrough();
    
            // round one
            server.world.combat.round(battleObj, null);
    
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, mockMob, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(mockMob, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(secondMob, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, secondMob, battleObj, jasmine.any(Function));
            expect(battleObj.attacked.length).toBe(0);
            expect(battleObj.round).toBe(1);
    
            // round two
            server.world.combat.round(battleObj, null);
    
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, mockMob, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(mockMob, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(secondMob, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, secondMob, battleObj, jasmine.any(Function));
            
            expect(battleObj.attacked.length).toBe(0);
            expect(battleObj.round).toBe(2);
    
            // rounds 3 -- kill mockMob
            mockMob.chp = 0;
            
            server.world.combat.round(battleObj, null);

            expect(endOfCombatSpy).toHaveBeenCalledWith(battleObj, mockPlayer, mockMob, null);
            expect(mockPlayer.exp).toBeGreaterThan(0);
    
             // round 4 -- down to mockPlayer vs secondMob
            secondMob.chp = 0;
            server.world.combat.round(battleObj, null);

            expect(battlePosSpy).toHaveBeenCalledWith(battleObj)
            expect(vicinityCheckSpy).toHaveBeenCalledTimes(7);
            expect(mockPlayer.exp).toBeGreaterThan(0);
            expect(battleObj.round).toBe(4);
        });
    });
});
