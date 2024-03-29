const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Behavior: Item Interactions', () => {
    const mockCurrentHealth = 10;
    const mockMaxHealth = 100;
    let mockPlayer;
    let mockPlayerRoom;
    let server;
    let cmdLoop;
    let helmet = {
        name: 'Leather Helmet',
        displayName: 'Leather Helmet',
        short: 'a leather helmet',
        long: 'A simple leather helmet was left here',
        area: 'midgaard',
        id: '3', 	
        refId: 'item-3',
        level: 1,
        itemType: 'armor',
        material: 'leather', 
        ac: 1, 
        weight: 1,
        slot: 'head',
        equipped: false,
        modifiers: {
            ac: 1
        },
        affects: [],
        behaviors: []
    };
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
        behaviors: [],
        spellCharges: 1,
        spell: {
			id: 'cureLight',
			display: 'Cure Light',
			train: 100,
			type: 'passive spell',
			wait: 2,
			prerequisites: {
				level: 1
			}
		}
    };

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            cmdLoop = spyOn(server.world.ticks, 'cmdLoop').and.callThrough();

            mockPlayer = mud.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';
            mockPlayer.damroll = 0;
            mockPlayer.hitroll = 0;
            mockPlayer.mana = 100;
            mockPlayer.cmana = 100;
            mockPlayer.hp = mockMaxHealth;
            mockPlayer.chp = mockCurrentHealth;
            mockPlayerArea = server.world.getArea(mockPlayer.area);
            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);
            
            mockPlayerRoom.items = [];

            mockPlayerRoom.items.push(mockDagger);
            mockPlayerRoom.items.push(mockStaff);

            done();
        }, false, false);
    });

    it('should pick up every item in the room and them drop them all', () => {
        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get dagger'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(cmdLoop).toHaveBeenCalledTimes(1);
        expect(getSpy).toHaveBeenCalledTimes(1);

        expect(mockPlayer.items.length).toBe(1);
        expect(mockPlayerRoom.items.length).toBe(1);

        cmd = server.world.commands.createCommandObject({
            msg: 'drop all'
        });

        let dropSpy = spyOn(server.world.commands, 'drop').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(dropSpy).toHaveBeenCalledTimes(1);

        expect(mockPlayer.items.length).toBe(0);
        expect(mockPlayerRoom.items.length).toBe(2);
    });

    it('should pick up the Dagger and fail to equip it due to being a lower level', () => {
        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get dagger'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

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
    
        server.world.ticks.cmdLoop(server.world);
    
        expect(wearSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledWith(mockPlayer, {
            msg: 'Your level is too low to equip a common looking dagger.',
            styleClass: 'error'
        });
    });

    it('should pick up the Staff and then wear it, remove it, drop it, pick it up, wear it again and brandish it to heal', () => {
        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get staff'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

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
    
        server.world.ticks.cmdLoop(server.world);
    
        expect(wearSpy).toHaveBeenCalledTimes(1);
        expect(wearWeaponSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(msgPlayerSpy).toHaveBeenCalledTimes(1);
        expect(server.world.character.getSlot(mockPlayer, 'hands').item).toBe(mockStaff.refId);
        expect(mockPlayer.items[0].equipped).toBe(true);
        expect(mockPlayer.damroll).toBe(1);
        expect(mockPlayer.hitroll).toBe(1);

        cmd = server.world.commands.createCommandObject({
            msg: 'remove staff'
        });
        
        let removeSpy = spyOn(server.world.commands, 'remove').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);
    
        server.world.ticks.cmdLoop(server.world);
    
        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(server.world.character.getSlot(mockPlayer, 'hands').item).not.toBe(mockStaff.refId);
        expect(mockPlayer.items[0].equipped).toBe(false);
        expect(mockPlayer.damroll).toBe(0);
        expect(mockPlayer.hitroll).toBe(0);

        cmd = server.world.commands.createCommandObject({
            msg: 'drop staff'
        });
    
        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);


        cmd = server.world.commands.createCommandObject({
            msg: 'get staff'
        });
    
        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        
        cmd = server.world.commands.createCommandObject({
            msg: 'wear staff'
        });
    
        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(mockPlayer.items[0].equipped).toBe(true);
        expect(mockPlayer.damroll).toBe(1);
        expect(mockPlayer.hitroll).toBe(1);

        const cureSpy = spyOn(server.world.spells, 'cureLight').and.callThrough();

        cmd = server.world.commands.createCommandObject({
            msg: 'brandish staff me'
        });

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(mockPlayer.chp).toBeGreaterThan(mockCurrentHealth);
        expect(cureSpy).toHaveBeenCalledTimes(1);

        cmd = server.world.commands.createCommandObject({
            msg: 'remove staff'
        });
        
        server.world.addCommand(cmd, mockPlayer);
    
        server.world.ticks.cmdLoop(server.world);

        expect(mockPlayer.items.length).toBe(1);
        expect(mockPlayer.items[0].equipped).toBe(false);

        // confirm items that are not equipped cannot be brandished
        cmd = server.world.commands.createCommandObject({
            msg: 'brandish staff me'
        });
    
        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(cureSpy).toHaveBeenCalledTimes(1);
    });

    it('should pick up the helmet and wear it', () => {
        mockPlayerRoom.items.push(helmet);

        mockPlayer.ac = 0;

        expect(mockPlayer.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'get helmet'
        });
        let getSpy = spyOn(server.world.commands, 'get').and.callThrough();

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.cmdLoop(server.world);

        expect(cmdLoop).toHaveBeenCalledTimes(1);
        expect(getSpy).toHaveBeenCalledTimes(1);

        expect(mockPlayer.items.length).toBe(1);
    });
});
