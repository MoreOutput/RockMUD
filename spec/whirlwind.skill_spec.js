const MOCK_SERVER = require('../mocks/mock_server');
let mud;

describe('Testing Skill: Whirlwind', () => {
    let mockPlayer;
    let wolf;
    let wolf2;
    let wolfRoom;
    let mockPlayerRoom;
    let mockPlayerArea;
    let server;
    const whirlwindSkillObj = {
        "id": "whirlwind",
        "display": "Whirlwind",
        "mod": 0,
        "train": 100,
        "type": "area melee",
        "learned": true
    };

    beforeEach((done) => {
        mud = new MOCK_SERVER(() => {
            server = mud.server;

            mud.createNewEntity((playerModel) => {
                mud.createNewEntity((wolfModel) => {
                    mud.createNewEntity((wolf2Model) => {
                        mockPlayer = playerModel;
                        mockPlayer.refId = 'unit-test-player'
                        mockPlayer.area = 'midgaard';
                        mockPlayer.originatingArea = mockPlayer.area;
                        mockPlayer.roomid = '1';
                        mockPlayer.isPlayer = true;
                        mockPlayer.level = 1;
                        mockPlayer.name = 'Bilbo';
                        mockPlayer.displayName = 'Bilbo';
                        mockPlayer.combatName = 'Bilbo';
                        mockPlayer.chp = 100;
                        mockPlayer.skills.push(whirlwindSkillObj);

                        wolf = wolfModel;
                        wolf.area = 'midgaard';
                        wolf.originatingArea = mockPlayer.area;
                        wolf.roomid = '2'; // north of player
                        wolf.level = 1;
                        wolf.isPlayer = false;
                        wolf.name = 'wolf';
                        wolf.displayName = 'Wolf';
                        wolf.combatName = 'Wolf';
                        wolf.refId = 'wolf-refid';
                        wolf.cmv = 100;
                        wolf.mv = 100;
                        wolf.hp = 100;
                        wolf.chp = 100;
                        wolf.refId = 'b';

                        wolf2 = wolf2Model;
                        wolf2.area = 'midgaard';
                        wolf2.originatingArea = mockPlayer.area;
                        wolf2.roomid = '2'; // north of player
                        wolf2.level = 1;
                        wolf2.isPlayer = false;
                        wolf2.name = 'wolf2';
                        wolf2.combatName = 'Wolf2';
                        wolf2.displayName = 'Wolf2';
                        wolf2.refId = 'wolf2-refid';
                        wolf2.cmv = 100;
                        wolf2.mv = 100;
                        wolf2.hp = 100;
                        wolf2.chp = 100;
                        wolf2.refId = 'a';

                        mockPlayerArea = server.world.getArea(mockPlayer.area);

                        mockPlayerRoom = server.world.getRoomObject(mockPlayer.area, mockPlayer.roomid);

                        mockPlayerRoom.playersInRoom.push(mockPlayer);

                        wolfRoom = server.world.getRoomObject(wolf.area, wolf.roomid);

                        wolfRoom.monsters = [];

                        server.world.players.push(mockPlayer);

                        done();
                    });
                });
            });
        }, false, false);
    });

    it('should start a battle with every entity in the room', () => {
        mockPlayer.hitroll = 20; // beats the default entity AC of 10 so we always hit
        
        wolfRoom.monsters.push(wolf);
        wolfRoom.monsters.push(wolf2);

        server.world.ticks.gameTime(server.world);

        let cmd = server.world.commands.createCommandObject({
            msg: 'move north'
        });

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.gameTime(server.world);

        cmd = server.world.commands.createCommandObject({
            msg: 'whirlwind'
        });
        cmd.skill = whirlwindSkillObj;

        server.world.addCommand(cmd, mockPlayer);

        server.world.ticks.gameTime(server.world);

        expect(server.world.battles.length).toBe(1);
        expect(server.world.battles[0].positions['0'].attacker.name).toBe('Bilbo');
        expect(server.world.battles[0].positions['0'].defender.name).toBe('wolf');
        expect(server.world.battles[0].positions['1'].attacker.name).toBe('wolf2');
        expect(server.world.battles[0].positions['1'].defender.name).toBe('Bilbo');
    });
});
