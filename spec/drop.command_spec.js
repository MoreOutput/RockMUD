const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Command: DROP', () => {
    let mockPlayer;
    let server;
    let sword;
    let dagger;

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            mockPlayer = mud.getNewPlayerEntity();
            mockPlayer.area = 'midgaard';
            mockPlayer.originatingArea = mockPlayer.area;
            mockPlayer.roomid = '3';
            
            mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);
            mockPlayerRoom.items = [];
            mockPlayerRoom.playersInRoom = [];
            mockPlayerRoom.playersInRoom.push(mockPlayer);

            server.world.players = [];
            server.world.players.push(mockPlayer);

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
    
            dagger = {
                name: 'Small Dagger',
                displayName: 'Short Sword',
                short: 'a common looking dagger',
                area: 'midgaard',
                refId: '2',
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

            done();
        }, false, false);
    });


    it('should exist', () => {
        expect(server.world.commands.drop).toBeTruthy();
    });

    it('should drop the sword', () => {
        const saySpy = spyOn(server.world.commands, 'say');

        mockPlayer.items.push(sword);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'drop sword'},
            mockPlayer
        );
        
        server.world.commands.drop(mockPlayer, cmd);

        expect(mockPlayer.items.length).toBe(0);
        expect(mockPlayerRoom.items.length).toBe(1);
    });

    it('should drop the sword and dagger', () => {
        dagger.behaviors = [
            {
                beforeItemRemove: function() {
                    return true;
                }
            },
            {
                beforeItemRemove: function() {
                    return true;
                }
            }
        ];

        mockPlayer.items.push(sword);
        mockPlayer.items.push(dagger);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'drop all'},
            mockPlayer
        );
        
        server.world.commands.drop(mockPlayer, cmd);

        expect(mockPlayer.items.length).toBe(0);
        expect(mockPlayerRoom.items.length).toBe(2);
    });

    it('should not allow items with a beforeItemRemove returning false to be dropped', () => {
        dagger.behaviors = [
            {
                beforeItemRemove: function() {
                    return true;
                }
            },
            {
                beforeItemRemove: function() {
                    return false;
                }
            }
        ];

        mockPlayer.items.push(sword);
        mockPlayer.items.push(dagger);

        let cmd = server.world.commands.createCommandObject(
            {msg: 'drop all'},
            mockPlayer
        );
        
        server.world.commands.drop(mockPlayer, cmd);

        expect(mockPlayer.items.length).toBe(1);
        expect(mockPlayerRoom.items.length).toBe(1);
    });
});
