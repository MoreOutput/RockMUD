const MOCK_SERVER = require('../mocks/mock_server');

fdescribe('Testing Feature: Wearing Equipment', () => {
    let mockPlayer;
    let mockPlayerRoom;
    let server;
    let cmdLoop;
    let mockDagger = {
        name: 'Small Dagger',
        displayName: 'Short Sword',
        short: 'a common looking dagger',
        area: 'midgaard',
        refId: '1',
        id: '2', 
        level: 2,
        itemType: 'weapon',
        weaponType: 'dagger',
        material: 'iron', 
        diceNum: 1, 
        diceSides: 6,
        attackType: 'slash',
        weight: 4,
        slot: 'hands',
        equipped: false,
        modifiers: {
            damroll: 1,
            hitroll: 1
        },
        affects: [],
        behaviors: []
    };
    let mockStaff = {
        name: 'Large Staff',
        displayName: 'Large Staff',
        short: 'a common looking wooden staff',
        area: 'midgaard',
        refId: '2',
        id: '3',
        level: 1,
        itemType: 'weapon',
        weaponType: 'staff',
        material: 'wood', 
        diceNum: 1, 
        diceSides: 6,
        attackType: 'smash',
        weight: 4,
        slot: 'hands',
        equipped: false,
        modifiers: {
            damroll: 1,
            hitroll: 1
        },
        affects: [],
        behaviors: []
    };

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            cmdLoop = spyOn(server.world.ticks, 'cmdLoop').and.callThrough();

            jasmine.clock().install();

            mockPlayer = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';

            mockPlayerArea = server.world.getArea(mockPlayer.area);
            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);

            mockPlayerRoom.items.push(mockDagger);
            mockPlayerRoom.items.push(mockStaff);

            done();
        }, false, false);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should pick up the Dagger and fail to equip it due to being a lower level', () => {
        setInterval(function() {
            server.world.ticks.cmdLoop();
        }, 280);

        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get dagger'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);

        expect(cmdLoop).toHaveBeenCalledTimes(1);
        expect(getSpy).toHaveBeenCalledTimes(1);

        expect(mockPlayer.items.length).toBe(1);
    
        expect(mockPlayer.items[0].name).toBe('Small Dagger');

        cmd = server.world.commands.createCommandObject({
            msg: 'wear dagger'
        });
        let wearSpy = spyOn(server.world.commands, 'wear').and.callThrough();
        let msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);
    
        jasmine.clock().tick(280);
    
        expect(wearSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'Your level is too low to equip a common looking dagger.',
            styleClass: 'error'
        });
    });

    fit('should pick up the Staff and equip it', () => {
        setInterval(function() {
            server.world.ticks.cmdLoop();
        }, 280);

        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get staff'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);

        expect(cmdLoop).toHaveBeenCalledTimes(1);
        expect(getSpy).toHaveBeenCalledTimes(1);

        expect(mockPlayer.items.length).toBe(1);
    
        expect(mockPlayer.items[0].name).toBe('Large Staff');

        cmd = server.world.commands.createCommandObject({
            msg: 'wear staff'
        });
        
        let wearSpy = spyOn(server.world.commands, 'wear').and.callThrough();
        let wearWeaponSpy = spyOn(server.world.character, 'wearWeapon').and.callThrough();
        let msgPlayerSpy = spyOn(server.world, 'msgPlayer').and.callThrough();
        let saveSpy = spyOn(server.world.character, 'save').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);
    
        jasmine.clock().tick(280);
    
        expect(wearSpy).toHaveBeenCalledTimes(1);
        expect(wearWeaponSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledTimes(1);
        expect(server.world.character.getSlot(mockPlayer, 'hands').item).toBe(mockStaff.refId);
    }); 
});
