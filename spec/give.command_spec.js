const MOCK_SERVER = require('../mocks/mock_server');

describe('Testing Command: GIVE', () => {
    let mockPlayer;
    let mockPlayer2;
    let server;
    let sword;

    beforeEach((done) => {
        server = null;
        MOCK_SERVER.setup(() => {
            server = MOCK_SERVER.server;

            mockPlayer = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '1';
          
            mockPlayer2 = MOCK_SERVER.getNewPlayerEntity();
            mockPlayer2.refId = 'player-player2';
            mockPlayer2.name = 'Player2';
            mockPlayer2.area = 'midgaard';
            mockPlayer2.originatingArea = mockPlayer.area;
            mockPlayer2.roomid = '1';
            mockPlayer2.behaviors.push({
                onReceive: (b) => {
                    // say thanks when getting a new item
                    let cmd = server.world.commands.createCommandObject(
                        {msg: 'say thanks'},
                        mockPlayer2
                    );
                    
                    server.world.commands.say(mockPlayer2, cmd);
                }
            })
            
            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);
            mockPlayerRoom.playersInRoom = [];
            mockPlayerRoom.playersInRoom.push(mockPlayer);
            mockPlayerRoom.playersInRoom.push(mockPlayer2);

            server.world.players = [];
            server.world.players.push(mockPlayer);
            server.world.players.push(mockPlayer2);

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
    
            mockPlayer.items = [];
            mockPlayer2.items = [];
    

            done();
        }, false, false);
    });


    it('should exist', () => {
        expect(server.world.commands.give).toBeTruthy();
    });

    it('should give the sword to player2', () => {
        const saySpy = spyOn(server.world.commands, 'say');

        mockPlayer.items.push(sword);

        expect(mockPlayer2.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'give sword player2'},
            mockPlayer
        );
        
        server.world.commands.give(mockPlayer, cmd);

        expect(mockPlayer2.items.length).toBe(1);
        expect(mockPlayer.items.length).toBe(0);
        expect(saySpy).toHaveBeenCalled();
    });

    it('should give the sword to player2 who should then give it back', () => {
        mockPlayer.items.push(sword);
       
        expect(mockPlayer2.items.length).toBe(0);
        expect(mockPlayer.items.length).toBe(1);

        let cmd = server.world.commands.createCommandObject(
                {msg: 'give massive sword player2'},
                mockPlayer
            );
        
        server.world.commands.give(mockPlayer, cmd);

        expect(mockPlayer2.items.length).toBe(1);
        expect(mockPlayer.items.length).toBe(0);

        cmd = server.world.commands.createCommandObject(
            {msg: 'give massive Mockplayer'},
            mockPlayer2
        );
    
        server.world.commands.give(mockPlayer2, cmd);
    
        expect(mockPlayer2.items.length).toBe(0);
        expect(mockPlayer.items.length).toBe(1);
    });

    it('should give 20 gold to player2', () => {
        mockPlayer.gold = 100;
        mockPlayer2.gold = 0;

        expect(mockPlayer.gold).toBe(100);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'give 20 gold player2'},
            mockPlayer
        );
    
        server.world.commands.give(mockPlayer, cmd);
    
        expect(mockPlayer.gold).toBe(80);
        expect(mockPlayer2.gold).toBe(20);
    });

    it('should give all gold to player2', () => {
        mockPlayer.gold = 100;
        mockPlayer2.gold = 0;

        let cmd = server.world.commands.createCommandObject(
            {msg: 'give all gold player2'},
            mockPlayer
        );
    
        server.world.commands.give(mockPlayer, cmd);
    
        expect(mockPlayer.gold).toBe(100);
        expect(mockPlayer2.gold).toBe(0);
    });

    it('should not transfer any gold if target is not found', () => {
        mockPlayer.gold = 100;
        mockPlayer2.gold = 0;

        let cmd = server.world.commands.createCommandObject(
            {msg: 'give all gold player5'},
            mockPlayer
        );
    
        server.world.commands.give(mockPlayer, cmd);
    
        expect(mockPlayer.gold).toBe(100);
        expect(mockPlayer2.gold).toBe(0);

        cmd = server.world.commands.createCommandObject(
            {msg: 'give all gold player'},
            mockPlayer
        );
    
        server.world.commands.give(mockPlayer, cmd);
    
        expect(mockPlayer.gold).toBe(100);
        expect(mockPlayer2.gold).toBe(0);
    });
    
    it('should only give away an item if beforeItemRemove return true', () => {
        sword.behaviors = [
            {
                beforeItemRemove: function() {
                    return false;
                }
            }
        ];

        mockPlayer.items.push(sword);

        expect(mockPlayer2.items.length).toBe(0);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'give sword player2'},
            mockPlayer
        );
        
        server.world.commands.give(mockPlayer, cmd);

        expect(mockPlayer2.items.length).toBe(0);
        expect(mockPlayer.items.length).toBe(1);
    });
});
