const MOCK_SERVER = require('../mocks/mock_server');
let mud;

xdescribe('Testing Core: COMBAT', () => {
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

    xdescribe('Rounds', () => {
        it('should simulate player initiating combat with three entites. ' +
            'Player kills the dragon, the goblin uses Bash, ' +
            'the goblin is killed, player casts Spark ' + 
            ', the ogre is slain and then the player levels.', () => {
            const bashSkill = {
                "id": "bash",
                "display": "Bash",
                "train": 100,
                "type": "melee",
                "wait": 2, // atypical bash wait 
                "learned": true
            };
            const sparkSpell = {
                "id": "spark",
                "display": "Spark",
                "mod": 0,
                "train": 100,
                "type": "combat spell",
                "learned": true,
            };
            let goblin = mud.getNewEntity();
            goblin.isPlayer = false;
            goblin.name = 'goblin';
            goblin.displayName = 'Test Goblin';
            goblin.refId = 'goblin-refid';
            goblin.gold = 100;
            goblin.skills.push(bashSkill);
            goblin.chp = 100;

            let ogre = mud.getNewEntity();
            ogre.isPlayer = false;
            ogre.name = 'ogre';
            ogre.displayName = 'Test Ogre';
            ogre.refId = 'ogre-refid';
            goblin.chp = 200;

            mockPlayer.hitroll = 20; // beats the default entity AC of 10 so we always hit
            mockPlayer.skills.push(sparkSpell);
            mockPlayer.cmana = 100;

            // dragon was added in the beforeEach
            mockPlayerRoom.monsters.push(goblin);
            mockPlayerRoom.monsters.push(ogre);
    
            server.world.combat.processFight(mockPlayer, dragon, mockPlayerRoom, null, null);
            server.world.combat.processFight(mockPlayer, goblin, mockPlayerRoom, null, null);
            server.world.combat.processFight(mockPlayer, ogre, mockPlayerRoom, null, null);
            
            const attackSpy = spyOn(server.world.combat, 'attack').and.callThrough();
            const endOfCombatSpy = spyOn(server.world.combat, 'processEndOfCombat').and.callThrough();
            const battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);
            const vicinityCheckSpy = spyOn(server.world.combat, 'inPhysicalVicinity').and.callThrough();
            const battlePosSpy = spyOn(server.world.combat, 'getNumberOfBattlePositions').and.callThrough();
            const createCorpseSpy = spyOn(server.world.character, 'createCorpse').and.callThrough();

            expect(mockPlayer.exp).toBe(0);

            // round one
            server.world.combat.round(battleObj, null);
           
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj)
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, dragon, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(dragon, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(goblin, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(4);
            expect(battleObj.attacked.length).toBe(4);
            expect(battleObj.round).toBe(1);
            expect(vicinityCheckSpy).toHaveBeenCalled();

            attackSpy.calls.reset();

            // round two
            server.world.combat.round(battleObj, null);
          
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj)
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, dragon, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(dragon, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(goblin, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(4);
            expect(battleObj.attacked.length).toBe(4);
            expect(battleObj.round).toBe(2);

            attackSpy.calls.reset();

            // rounds 3 -- kill dragon in the next round
            dragon.chp = 1;
            
            if (dragon.chp === 1) {
                server.world.combat.round(battleObj, null);
            }
                      
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, dragon, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(goblin, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(3);
            expect(battleObj.attacked.length).toBe(3);
            expect(battleObj.round).toBe(3);
            expect(endOfCombatSpy).toHaveBeenCalledWith(battleObj, mockPlayer, dragon);
            expect(Object.keys(battleObj.positions).length).toBe(3);
            expect(battleObj.positions[0]).toBe(null);
            expect(mockPlayer.exp).toBeGreaterThan(0);
            expect(dragon.chp).toBe(0);
            expect(dragon.fighting).toBe(false);
            expect(dragon.killedBy).toBe(mockPlayer.name);
            expect(mockPlayer.fighting).toBe(true);
            expect(createCorpseSpy).toHaveBeenCalledWith(dragon);

            attackSpy.calls.reset();
            const startingHp = mockPlayer.chp;
            // rounds 4 -- goblin uses smash command
            server.world.skills['bash'](bashSkill, goblin, mockPlayerRoom, {
                cmd: 'bash'
            });

            server.world.combat.round(battleObj, null);
                      
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, goblin, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(goblin, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(3);
            expect(battleObj.attacked.length).toBe(3);
            expect(battleObj.round).toBe(4);
            expect(mockPlayer.chp).toBeLessThan(startingHp);

            attackSpy.calls.reset();

            server.world.combat.round(battleObj, null);
            
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, goblin, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(goblin, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(3);
            expect(battleObj.attacked.length).toBe(3);
            expect(battleObj.round).toBe(5);

            attackSpy.calls.reset();

            goblin.chp = 1;

            while(goblin.chp === 1) {
                server.world.combat.round(battleObj, null);
            }
             
            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, goblin, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(2); // goblin didnt get to attack because it was killed
            expect(battleObj.attacked.length).toBe(2);
            expect(battleObj.round).toBe(6);
            expect(goblin.chp).toBe(0);
            expect(goblin.fighting).toBe(false);
            expect(goblin.killedBy).toBe(mockPlayer.name);
            expect(endOfCombatSpy).toHaveBeenCalledWith(battleObj, mockPlayer, goblin);

            attackSpy.calls.reset();

            server.world.commands.cast(mockPlayer, {
                cmd: 'cast',
                arg: 'spark',
                roomObj: mockPlayerRoom,
                skillObj: sparkSpell
            });

            server.world.combat.round(battleObj, null);            

            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, ogre, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledWith(ogre, mockPlayer, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(2);
            expect(battleObj.attacked.length).toBe(2);
            expect(battleObj.round).toBe(7);

            attackSpy.calls.reset();
            
            // player should level at the end of combat
            mockPlayer.exp = 999;
            mockPlayer.expToLevel = 1000;
            mockPlayer.level = 1;
            mockPlayer.trains = 0;

            ogre.chp = 1;

            while (ogre.chp > 0) {
                server.world.combat.round(battleObj, null);
            }

            expect(battlePosSpy).toHaveBeenCalledWith(battleObj);
            expect(attackSpy).toHaveBeenCalledWith(mockPlayer, ogre, battleObj, jasmine.any(Function));
            expect(attackSpy).toHaveBeenCalledTimes(1); // ogre didnt get to attack because it was killed
            expect(battleObj.attacked.length).toBe(1);
            expect(battleObj.round).toBe(8);
            expect(ogre.chp).toBe(0);
            expect(ogre.fighting).toBe(false);
            expect(ogre.killedBy).toBe(mockPlayer.name);
            expect(endOfCombatSpy).toHaveBeenCalledWith(battleObj, mockPlayer, ogre);
            expect(mockPlayer.level).toBe(2);
            expect(mockPlayer.expToLevel).toBe(2000);
            expect(mockPlayer.trains).toBeGreaterThan(0);
        });
    });
});
