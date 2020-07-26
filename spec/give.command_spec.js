const MOCK_SERVER = require('../mocks/mock_server');

fdescribe('Testing Command: GIVE', () => {
    let mockPlayer;
    let mockPlayer2;
    let server;
    let sword;
    let cmdLoop;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            server.test = 123;
            
            cmdLoop = spyOn(server.world.ticks, 'cmdLoop').and.callThrough();

            jasmine.clock().install();
            
            mockPlayer = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';
            mockPlayer.gold = 100;
          
            mockPlayer2 = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer2.refId = 'player2';
            mockPlayer2.name = 'Player2';
            mockPlayer2.area = 'midgaard';
            mockPlayer2.originatingArea = mockPlayer.area;
            mockPlayer2.roomid = '1';

            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);
            mockPlayerRoom.playersInRoom.push(mockPlayer2);

            sword = {
                name: 'Huge Massive Sword', 
                displayName: 'A Massive Sword',
                short: 'a huge sword',
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

            mockPlayer.items.push(sword);

            server.world.players.push(mockPlayer);
            server.world.players.push(mockPlayer2);

            setInterval(function() {
                server.world.ticks.cmdLoop();
            }, 280);
            
            done();
        }, false, false);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('should give the sword to player2', () => {
        expect(mockPlayer2.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'give sword player2'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);

        expect(mockPlayer2.items.length).toBe(1);
        expect(mockPlayer.items.length).toBe(0);
    });

    it('should give 20 gold to player2', () => {
        expect(mockPlayer.gold).toBe(100);
        expect(mockPlayer2.gold).toBe(0);

        let cmd = server.world.commands.createCommandObject({
            msg: 'give 20 gold player2'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280);
        expect(mockPlayer.gold).toBe(80);
        expect(mockPlayer2.gold).toBe(20);
    });
});
