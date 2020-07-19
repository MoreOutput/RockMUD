const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Core: COMBAT', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let dragon;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            mockPlayer = MOCK_SERVER.player;
            mockPlayerRoom = MOCK_SERVER.room;
            mockPlayerArea = MOCK_SERVER.area;

            dragon = MOCK_SERVER.getNewEntity();
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
        let goblin = MOCK_SERVER.getNewEntity();
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
                "type": "spell",
                "learned": true,
            };
            let goblin = MOCK_SERVER.getNewEntity();
            goblin.isPlayer = false;
            goblin.name = 'goblin';
            goblin.displayName = 'Test Goblin';
            goblin.refId = 'goblin-refid';
            goblin.gold = 100;
            goblin.skills.push(bashSkill);
            goblin.chp = 100;

            let ogre = MOCK_SERVER.getNewEntity();
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

// uses ticks
describe('Testing: COMBAT LOOP', () => {
    let combatLoop;
    let cmdLoop;
    let mockPlayer;
    let mockPlayerRoom;
    let mockPlayerArea;
    let dragon;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            cmdLoop = spyOn(server.world.ticks, 'cmdLoop').and.callThrough();
            combatLoop = spyOn(server.world.ticks, 'combatLoop').and.callThrough();

            jasmine.clock().install();

            mockPlayer = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';
          
            mockPlayerArea = server.world.getArea(mockPlayer.area);

            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);

            mockPlayerRoom.playersInRoom.push(mockPlayer);

            server.world.players.push(mockPlayer);

            done();
        }, false, false);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should simulate player initiating combat with a deer and the deer being killed.', () => {
        const endOfCombatSpy = spyOn(server.world.combat, 'processEndOfCombat').and.callThrough();
        const createCorpseSpy = spyOn(server.world.character, 'createCorpse').and.callThrough();
        let deer = MOCK_SERVER.getNewEntity();
        deer.level = 1;
        deer.isPlayer = false;
        deer.name = 'deer';
        deer.displayName = 'Brown Deer';
        deer.refId = 'deer-refid';
        deer.area = mockPlayer.area;
        deer.originatingArea = mockPlayer.area;
        deer.roomid = mockPlayer.roomid;
        deer.cmv = 100;
        deer.mv = 100;
        deer.hp = 100;
        deer.chp = 1;
        mockPlayer.hitroll = 20; // beats the default entity AC of 10 so we always hit

        mockPlayerRoom.monsters = [];
        mockPlayerRoom.monsters.push(deer);
        
        setInterval(function() {
            server.world.ticks.cmdLoop();
        }, 280);

        setInterval(function() {
            server.world.ticks.combatLoop();
        }, 1900);

        expect(combatLoop).not.toHaveBeenCalled();

        let cmd = server.world.commands.createCommandObject({
            msg: 'kill deer'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);

        let battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);

        while (deer.chp > 0) {
            jasmine.clock().tick(1900); // trigger combat loop
        }

        expect(battleObj).toBeTruthy();
        expect(combatLoop).toHaveBeenCalled();
        expect(endOfCombatSpy).toHaveBeenCalledWith(battleObj, mockPlayer, deer)
        expect(createCorpseSpy).toHaveBeenCalledWith(deer);
    });

    it('should simulate player initiating combat with a deer and the deer fleeing.', () => {
        let deer = MOCK_SERVER.getNewEntity();
        deer.level = 1;
        deer.isPlayer = false;
        deer.name = 'deer';
        deer.displayName = 'Brown Deer';
        deer.refId = 'deer-refid';
        deer.area = mockPlayer.area;
        deer.originatingArea = mockPlayer.area;
        deer.roomid = mockPlayer.roomid;
        deer.cmv = 100;
        deer.mv = 100;
        deer.hp = 100;
        deer.chp = 100;

        mockPlayer.hitroll = 20; // beats the default entity AC of 10 so we always hit
        
        mockPlayerRoom.monsters = [];
        mockPlayerRoom.monsters.push(deer);

        setInterval(function() {
            server.world.ticks.cmdLoop();
        }, 280);

        setInterval(function() {
            server.world.ticks.combatLoop();
        }, 1900);

        expect(cmdLoop).not.toHaveBeenCalled();
        expect(combatLoop).not.toHaveBeenCalled();

        jasmine.clock().tick(280);
       
        expect(cmdLoop).toHaveBeenCalledTimes(1);

        let cmd = server.world.commands.createCommandObject({
            msg: 'kill deer'
        });
        let killSpy = spyOn(server.world.commands, 'kill').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280); // 560

        expect(server.world.cmds.length).toBe(0);
        expect(killSpy).toHaveBeenCalled();
        expect(server.world.battles.length).toBe(1);
        expect(cmdLoop).toHaveBeenCalledTimes(2);
        
        jasmine.clock().tick(280); // 840
        expect(cmdLoop).toHaveBeenCalledTimes(3);
        expect(combatLoop).not.toHaveBeenCalled();

        let roundSpy = spyOn(server.world.combat, 'round').and.callThrough();
        const attackSpy = spyOn(server.world.combat, 'attack').and.callThrough();

        jasmine.clock().tick(1060); // trigger combat loop

        let battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);

        expect(combatLoop).toHaveBeenCalledTimes(1);
        expect(roundSpy).toHaveBeenCalledTimes(1);
        expect(attackSpy).toHaveBeenCalledWith(mockPlayer, deer, battleObj, jasmine.any(Function));
        expect(attackSpy).toHaveBeenCalledWith(deer, mockPlayer, battleObj, jasmine.any(Function));
        expect(battleObj.attacked.length).toBe(2);
        expect(battleObj.round).toBe(1);
        
        attackSpy.calls.reset();

        cmd = server.world.commands.createCommandObject({
            msg: 'flee east'
        });
        let fleeSpy = spyOn(server.world.commands, 'flee').and.callThrough();

        server.world.addCommand(cmd, deer);

        jasmine.clock().tick(280);

        expect(fleeSpy).toHaveBeenCalled();
        expect(server.world.cmds.length).toBe(0);

        jasmine.clock().tick(1620); // trigger combat loop

        expect(combatLoop).toHaveBeenCalledTimes(2);
        expect(roundSpy).toHaveBeenCalledTimes(1);
        expect(attackSpy).not.toHaveBeenCalled();
        expect(battleObj.attacked.length).toBe(0);
        expect(battleObj.round).toBe(1);
        expect(deer.position).toBe('standing');
        expect(deer.fighting).toBe(false);
        expect(deer.area).toBe(mockPlayer.area);
        expect(deer.roomid).not.toBe(mockPlayer.roomid);
        expect(deer.cmv).toBeLessThan(100);
        expect(server.world.battles.length).toBe(0);
        expect(mockPlayer.position).toBe('standing');
        expect(mockPlayer.fighting).toBe(false);

        attackSpy.calls.reset();
        
        jasmine.clock().tick(1900); // trigger combat loop
        
        cmd = server.world.commands.createCommandObject({
            msg: 'move east'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);

        cmd = server.world.commands.createCommandObject({
            msg: 'kill deer'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);
        expect(server.world.cmds.length).toBe(0);

        battleObj = server.world.combat.getBattleByRefId(mockPlayer.refId);

        expect(battleObj.round).toBe(0); // round has not yet occured

        jasmine.clock().tick(1620); // trigger combat loop
        
        expect(server.world.cmds.length).toBe(0);
        expect(battleObj.round).toBe(1);
        expect(attackSpy).toHaveBeenCalledTimes(2);
        expect(server.world.battles.length).toBe(1);
        expect(mockPlayer.position).toBe('standing');
        expect(mockPlayer.fighting).toBe(true);
        expect(deer.position).toBe('standing');
        expect(deer.fighting).toBe(true);
    });
});
