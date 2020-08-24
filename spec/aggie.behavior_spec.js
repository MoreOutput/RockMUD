const MOCK_SERVER = require('../mocks/mock_server');

fdescribe('Testing: AGGIE BEHAVIOR', () => {
    let combatLoop;
    let cmdLoop;
    let mockPlayer;
    let wolf;
    let wolfRoom;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;

    beforeEach((done) => {
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;
 
            cmdLoop = spyOn(server.world.ticks, 'cmdLoop').and.callThrough();
            combatLoop = spyOn(server.world.ticks, 'combatLoop').and.callThrough();

            jasmine.clock().install();

            mockPlayer = MOCK_SERVER.createNewEntity((playerModel) => {
                MOCK_SERVER.createNewEntity((wolfModel) => {
                    mockPlayer = playerModel;
                    mockPlayer.refId = 'unit-test-player'
                    mockPlayer.area = 'midgaard';
                    mockPlayer.originatingArea = mockPlayer.area;
                    mockPlayer.roomid = '1';
                    mockPlayer.isPlayer = true;
                    mockPlayer.level = 1;
                    mockPlayer.name = 'Mockplayer';
                    mockPlayer.displayName = 'Mockplayer';
                    mockPlayer.combatName = 'Mockplayer';
                
                    wolf = wolfModel;
                    wolf.area = 'midgaard';
                    wolf.originatingArea = mockPlayer.area;
                    wolf.roomid = '3'; // east of player
                    wolf.level = 1;
                    wolf.isPlayer = false;
                    wolf.name = 'wolf';
                    wolf.displayName = 'Wolf';
                    wolf.refId = 'wolf-refid';
                    wolf.cmv = 100;
                    wolf.mv = 100;
                    wolf.hp = 100;
                    wolf.chp = 100;

                    mockPlayerArea = server.world.getArea(mockPlayer.area);

                    mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);

                    mockPlayerRoom.playersInRoom.push(mockPlayer);

                    wolfRoom = server.world.getRoomObject(wolf.area, wolf.roomid);

                    server.world.players.push(mockPlayer);

                    done();
                }, [{
                    module: 'aggie'
                }]);
            });
        }, false, false);
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

     it('should simulate player walking into a room and being attacked by a wolf', () => {
        mockPlayer.hitroll = 20; // beats the default entity AC of 10 so we always hit
        
        wolfRoom.monsters.push(wolf);

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
            msg: 'move east'
        });

        server.world.addCommand(cmd, mockPlayer);

        jasmine.clock().tick(280); // 560

        jasmine.clock().tick(280);

        jasmine.clock().tick(1060); // trigger combat loop
        
        expect(combatLoop).toHaveBeenCalled();
    });
});
